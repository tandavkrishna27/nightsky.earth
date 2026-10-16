"""Fixed time-series preparation. Default CLI only prints an offline plan.

The fixture seam shares the legacy bounded state machine. Live execution and
scientific admission are deliberately unavailable until separately reviewed.
"""
import argparse
import hashlib
import json
import sys
import time
from pathlib import Path

# Permit direct isolated (-I) CLI invocation without consulting environment paths.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sample_executor as core


def plan():
    return dict(schemaVersion=1, dataset='reanalysis-era5-single-levels-timeseries',
                request=dict(variable=['total_cloud_cover'],
                             location=dict(longitude=48.75, latitude=32),
                             date=['1990-12-30/1990-12-30'], data_format='netcdf'),
                destinationId='place:v1:geonames:12', expectedHours=24,
                expectedPoint=dict(longitude=48.75, latitude=32),
                rawLimitBytes=core.RAW_LIMIT, newOutputLimitBytes=core.TREE_LIMIT,
                deadlineSeconds=core.SECONDS, maxSubmissions=1,
                maxPolls=core.MAX_POLLS, pollIntervalSeconds=core.POLL_SECONDS,
                automaticRetries=0, scientificAdmission='unimplemented')


def identity():
    return hashlib.sha256(json.dumps(plan(), sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def validate_plan(value):
    # Canonical serialization also distinguishes integer/boolean and list/scalar.
    if json.dumps(value, sort_keys=True, separators=(',', ':')) != json.dumps(plan(), sort_keys=True, separators=(',', ':')):
        raise ValueError('Fixed time-series plan mismatch')


def run_fixture(root, transport, *, clock=time.time, sleep=time.sleep, resume=False):
    if getattr(transport, 'fixture_only', False) is not True:
        raise ValueError('Live time-series execution is disabled')
    validate_plan(plan())
    return core._run(root, transport, clock=clock, sleep=sleep, resume=resume,
                     contract=sys.modules[__name__])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', action='store_true')
    parser.parse_args(argv)
    print(json.dumps(dict(plan=plan(), planSha256=identity(), liveExecution='disabled'), indent=2))


if __name__ == '__main__':
    main()
