"""Composed fake HTTP + genuine synthetic PBF; never a provider acquisition."""
import io
import json
import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts/osm'))
import osmium
import spot_manifest
import spot_runner
from spot_build import build_source


def varint(value):
    result = bytearray()
    while value > 127:
        result.append((value & 127) | 128)
        value >>= 7
    result.append(value)
    return bytes(result)


def synthetic_pbf(root, source):
    """Pad with a valid empty protobuf data block, not arbitrary file garbage."""
    path = root / (source['id'] + '.fixture.osm.pbf')
    header = osmium.io.Header()
    header.set('osmosis_replication_timestamp', source['expectedVintage'])
    with osmium.SimpleWriter(str(path), header=header) as writer:
        writer.add_node(osmium.osm.mutable.Node(id=1, location=(179, 10), tags={'name':'Synthetic Lookout', 'tourism':'viewpoint'}))
        writer.add_node(osmium.osm.mutable.Node(id=2, location=(-179, 10)))
        writer.add_way(osmium.osm.mutable.Way(id=3, nodes=[1,2], tags={'name':'Synthetic Crossing', 'leisure':'park'}))
    original = path.read_bytes()
    # Empty StringTable plus an unknown length-delimited protobuf field. Both
    # are structurally valid; the empty data block contributes no OSM entities.
    def frame(padding):
        primitive = b'\x0a\x00' + varint((100 << 3) | 2) + varint(padding) + b'\x00' * padding
        blob = b'\x0a' + varint(len(primitive)) + primitive
        blob_header = b'\x0a\x07OSMData' + b'\x18' + varint(len(blob))
        return struct.pack('>I', len(blob_header)) + blob_header + blob
    padding = source['declaredBytes'] - len(original) - 32
    for _ in range(8):
        block = frame(padding)
        difference = source['declaredBytes'] - len(original) - len(block)
        if difference == 0:
            path.write_bytes(original + block)
            return path
        padding += difference
    raise AssertionError('synthetic PBF length did not converge')


class Reply(io.BytesIO):
    def __init__(self, path, source, method):
        super().__init__(b'' if method == 'HEAD' else path.read_bytes())
        self.status = 200
        self.headers = {'Content-Length':str(source['declaredBytes']), 'ETag':source['etag']}
        self.url = source['url']
    def geturl(self):
        return self.url


class SpotIntegrationTests(unittest.TestCase):
    def test_fake_acquisition_actual_build_and_strict_inspection(self):
        with tempfile.TemporaryDirectory() as temp:
            fixtures = Path(temp) / 'fixtures'
            fixtures.mkdir()
            paths = {source['url']:synthetic_pbf(fixtures,source) for source in spot_manifest.PINNED_SOURCES}
            # Independently establish that padding remains parseable and contains
            # only the three known synthetic entities before exercising the runner.
            for path in paths.values():
                self.assertEqual(sum(1 for _ in osmium.FileProcessor(str(path))),3)
            calls = []
            def opener(request, timeout):
                source = next(s for s in spot_manifest.PINNED_SOURCES if s['url'] == request.full_url)
                calls.append((source['id'],request.method))
                return Reply(paths[request.full_url],source,request.method)
            root = Path(temp) / 'wave'
            builder = spot_runner.supervised_build if os.name == 'nt' else build_source
            result = spot_runner.run_wave(root, opener=opener, build=builder)
            self.assertEqual(result['status'],'complete',result)
            self.assertEqual(result['httpRequests'],6)
            self.assertEqual([method for _,method in calls],['HEAD','GET']*3)
            self.assertGreaterEqual(result['peakLogicalBytes'],spot_runner.logical_bytes(root))
            self.assertEqual(spot_runner.inspect_wave(root)['status'],'complete')
            for source in spot_manifest.PINNED_SOURCES:
                report = json.loads((root/source['id']/'build'/'report.json').read_text())
                self.assertEqual(report['candidateRows'],1)
                self.assertEqual(report['geometry']['datelineWays'],1)
                self.assertEqual(report['geometry']['sourceIds']['datelineWays'],[3])
                self.assertTrue(report['referenceFilteredEqual'])
                self.assertTrue(report['partitionIdentityValueEqual'])
                self.assertFalse(report['independentGeometryProof'])
            raw = root/'monaco'/'monaco.osm.pbf'
            with raw.open('r+b') as stream:
                stream.seek(-1,2)
                stream.write(b'\x01')
            with self.assertRaises(ValueError):
                spot_runner.inspect_wave(root)


if __name__ == '__main__':
    unittest.main()
