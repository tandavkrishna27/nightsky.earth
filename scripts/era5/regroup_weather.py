"""Bounded offline weather regrouping proposal. No acquisition or allowance path.

Split each reviewed parent in place into at most 27-year chunks; never take a
shorter prefix of a regenerated schedule. Provider suitability remains unproved.
The live executor's 16-submission contract is deliberately unchanged.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

import global_acquisition as g

MAX_YEARS = 27
MAX_PARENTS = 32  # <=16 input parents, each with <=30 years
MAX_OUTPUT_BYTES = g.MiB
JOB_KEYS = {'dataset', 'revision', 'member', 'request', 'sha256', 'tileId',
            'expectedCells', 'requiredCells', 'fillerCells', 'expectedHours',
            'scalarCellHours', 'partitions', 'status', 'providerAcceptance'}


def regroup(packet):
    g.validate_packet(packet)
    jobs, mapping = [], []
    for index, original in enumerate(packet['jobs'], 1):
        if set(original) != JOB_KEYS or original['status'] != 'unapproved-nonexecuting' or original['providerAcceptance'] != 'unproved-for-this-group':
            raise ValueError('Only unapproved request rows without provider claims may be regrouped')
        first = len(jobs) + 1
        years = original['request']['year']
        for offset in range(0, len(years), MAX_YEARS):
            row = copy.deepcopy(original)
            chosen = years[offset:offset + MAX_YEARS]
            row['request']['year'] = chosen
            row['partitions'] = [p for p in row['partitions'] if p['year'] in chosen]
            row['expectedHours'] = sum(p['expectedHours'] for p in row['partitions'])
            row['scalarCellHours'] = row['expectedHours'] * len(row['expectedCells'])
            row['sha256'] = g.identity({k: row[k] for k in ('dataset', 'revision', 'member', 'request')})
            g.validate_job(row)
            jobs.append(row)
        mapping.append(dict(originalRow=index, originalRequestSha256=original['sha256'],
                            replacementRows=list(range(first, len(jobs) + 1))))
    prove_equivalence(packet['jobs'], jobs)
    return jobs, mapping


def coverage(jobs):
    """Exact per-cell/month bitsets, including ownership and required/filler class.

    A bit is a UTC day/hour; there is no rounding, sampling or count-only check.
    Calendar validity and source identity are checked before constructing bits.
    """
    if not 1 <= len(jobs) <= MAX_PARENTS:
        raise ValueError('Bounded finite parent list required')
    result = {}
    for row in jobs:
        g.validate_job(row)
        request = row['request']
        mask = sum(1 << ((int(day) - 1)*24 + int(hour[:2]))
                   for day in request['day'] for hour in request['time'])
        for cell in row['expectedCells']:
            kind = 'required' if cell in row['requiredCells'] else 'filler'
            for year in request['year']:
                key = (cell, year, request['month'][0])
                contract = (row['tileId'], kind, row['dataset'], row['revision'], row['member'])
                prior_contract, prior_mask = result.get(key, (contract, 0))
                if prior_contract != contract or prior_mask & mask:
                    raise ValueError('Overlapping or changed cell ownership/classification')
                result[key] = (contract, prior_mask | mask)
    return result


def prove_equivalence(original, proposed):
    before, after = coverage(original), coverage(proposed)
    if before != after:
        raise ValueError('Exact required/filler cell-hour coverage differs')
    rows = [dict(cellId=k[0], year=k[1], month=k[2], owner=v[0][0],
                 classification=v[0][1], hoursHex=hex(v[1])) for k, v in sorted(after.items())]
    return dict(method='exact-per-cell-month-bitsets-v1', coverageSha256=g.identity(rows),
                requiredCellHours=sum(v[1].bit_count() for v in after.values() if v[0][1] == 'required'),
                fillerCellHours=sum(v[1].bit_count() for v in after.values() if v[0][1] == 'filler'),
                monthlyChildren=sum(len(j['partitions']) for j in proposed))


def build_proposal(packet, jobs, mapping, source_proof):
    expected_jobs, expected_mapping = regroup(packet)
    if jobs != expected_jobs or mapping != expected_mapping:
        raise ValueError('Deterministic ordered regrouping required')
    proof = prove_equivalence(packet['jobs'], jobs)
    # These are proposed deltas only. No runtime limit is raised or allowance made.
    budget = dict(currentSubmissions=packet['limits']['submissions'], proposedSubmissions=len(jobs),
                  submissionsDelta=max(0, len(jobs) - packet['limits']['submissions']),
                  allOtherLimits='unchanged', approved=False,
                  maximumPollCalls=len(jobs)*packet['limits']['polls'],
                  perJobRawBytes=g.RAW_LIMIT, perResponseMetadataBytes=g.METADATA_LIMIT,
                  maximumStagingBytes=max((2*len(j['partitions'])+1)*4*g.MiB+2*g.RAW_LIMIT for j in jobs))
    base = Path(__file__).resolve().parent
    return dict(schemaVersion=1, kind='weather-regrouping-proposal-v1',
                status='unapproved-nonexecuting', executionEligible=False,
                originalPacketSha256=g.identity(packet), maxYearsPerRequest=MAX_YEARS,
                jobs=jobs, mapping=mapping, sourcePins=copy.deepcopy(packet['sourcePins']),
                runtimePins=copy.deepcopy(packet['runtimePins']), assetHosts=list(packet['assetHosts']),
                limits=copy.deepcopy(packet['limits']), budgetReview=budget,
                proof=proof, sourceProof=source_proof,
                preparationCodePins={name: hashlib.sha256((base/name).read_bytes()).hexdigest()
                                     for name in ['regroup_weather.py', 'weather_coverage.py']},
                remainingGates=['exact-current-form-review-for-every-request',
                                'explicit-job-budget-and-resource-review',
                                'fresh-executable-packet-runtime-and-owner-allowance'])


def write_proposal(path, proposal):
    data = (g.canonical(proposal)+'\n').encode()
    if len(data) > MAX_OUTPUT_BYTES:
        raise ValueError('Proposal output byte cap')
    path = g.safe(path)
    with path.open('xb') as stream:
        stream.write(data)
    return dict(bytes=len(data), sha256=hashlib.sha256(data).hexdigest())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--packet', required=True)
    parser.add_argument('--packet-sha256', required=True)
    parser.add_argument('--source-paths', required=True, help='Local source locators; each body is hash-pinned by the packet')
    parser.add_argument('--output', required=True, help='Fresh exclusive proposal path')
    args = parser.parse_args()
    packet = g.pinned_json(args.packet, args.packet_sha256, g.MiB)
    g.validate_packet(packet)
    locators = g.safe(args.source_paths)
    if locators.stat().st_size > 65536:
        raise ValueError('Source locator byte cap')
    with locators.open('rb') as stream:
        data = stream.read(65537)
    if len(data) > 65536:
        raise ValueError('Source locator byte cap')
    paths = json.loads(data)
    sources = g.verify_sources(packet, paths)
    jobs, mapping = regroup(packet)
    candidate = dict(packet, jobs=jobs)
    g.verify_sources(candidate, paths)
    from weather_coverage import prove_sources
    source_proof = prove_sources(jobs, sources, packet['sourcePins'])
    proposal = build_proposal(packet, jobs, mapping, source_proof)
    result = write_proposal(args.output, proposal)
    print(g.canonical(dict(result, jobs=len(jobs), liveCalls=0, status=proposal['status'])))


if __name__ == '__main__':
    main()
