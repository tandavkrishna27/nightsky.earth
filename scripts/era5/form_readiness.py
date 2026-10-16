"""Compare sanitized CDS form observations offline. Never grants execution authority.

Input observations are human/browser transcriptions, not provider-signed evidence.
Exact generated-code equality and current Submit UI state are separate findings.
No browser, network, credentials, job, allowance or acquisition path exists here.
"""
import argparse
from datetime import date, datetime, timedelta, timezone
import hashlib
import json
import re

import global_acquisition as g

DOWNLOAD_URL = 'https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=download'
MAX_BYTES = g.MiB
# Asia/Calcutta uses UTC+05:30 throughout the current observation period.
# A fixed offset avoids depending on a machine-local timezone or tzdata install.
OBSERVATION_ZONE = timezone(timedelta(hours=5, minutes=30), 'Asia/Calcutta')
PACKET_KEYS = {'schemaVersion', 'kind', 'observedDate', 'url', 'proposalSha256',
               'orderedRequestSha256', 'sourcePins', 'observations', 'blocker'}
ROW_KEYS = {'proposalRow', 'requestSha256', 'observedAt', 'state', 'generatedDataset',
            'generatedRequest', 'submitControl', 'validationMessages', 'limits'}


def _object(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError('Duplicate JSON key')
        value[key] = item
    return value


def read_json(path, expected_hash=None):
    """Read bounded non-aliased evidence; reject duplicate keys and nonfinite JSON."""
    path = g.safe(path)
    with path.open('rb') as stream:
        body = stream.read(MAX_BYTES + 1)
    if len(body) > MAX_BYTES:
        raise ValueError('Evidence byte cap')
    digest = hashlib.sha256(body).hexdigest()
    if expected_hash is not None and digest != expected_hash:
        raise ValueError('Exact file hash differs')
    value = json.loads(body, object_pairs_hook=_object,
                       parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Nonfinite JSON')))
    return value, digest


def _text(value, *, nullable=False):
    return (nullable and value is None) or (isinstance(value, str) and 0 < len(value) <= 4096)


def _messages(value):
    return isinstance(value, list) and len(value) <= 32 and all(_text(v) for v in value)


def validate(proposal_path, proposal_sha256, evidence, *, observed_date):
    """Return computed comparison facts; absent rows remain explicitly missing.

    ``observed_date`` must be supplied from the caller's current user date. A
    report can truthfully describe a blocked or incomplete inspection; it does
    not silently turn missing rows into reviewed rows. Supplied rows must follow
    proposal order, with every generated request key/value exactly preserved.
    A canonical date retains day precision; an offset-bearing timestamp is
    converted to Asia/Calcutta before checking that date. No time is invented.
    """
    if not isinstance(proposal_sha256, str) or not re.fullmatch('[a-f0-9]{64}', proposal_sha256):
        raise ValueError('Proposal hash required')
    proposal, _ = read_json(proposal_path, proposal_sha256)
    if (proposal.get('kind') != 'weather-regrouping-proposal-v1'
            or proposal.get('status') != 'unapproved-nonexecuting'
            or proposal.get('executionEligible') is not False
            or proposal.get('limits') != g.LIMITS
            or proposal.get('budgetReview', {}).get('approved') is not False):
        raise ValueError('Unapproved proposal with unchanged limits required')
    jobs = proposal.get('jobs')
    if not isinstance(jobs, list) or len(jobs) != 27:
        raise ValueError('Exact bounded 27-request proposal required')
    for job in jobs:
        g.validate_job(job)
    identities = [job['sha256'] for job in jobs]
    if len(set(identities)) != len(jobs):
        raise ValueError('Unique proposal identities required')
    try:
        if not isinstance(observed_date, str) or date.fromisoformat(observed_date).isoformat() != observed_date:
            raise ValueError('Current observed date required')
    except (ValueError, TypeError):
        raise ValueError('Current observed date required') from None
    if not isinstance(evidence, dict) or set(evidence) != PACKET_KEYS:
        raise ValueError('Observation packet keys differ; authority claims prohibited')
    if (type(evidence['schemaVersion']) is not int or evidence['schemaVersion'] != 1
            or evidence['kind'] != 'weather-form-observations-v1'
            or evidence['observedDate'] != observed_date or evidence['url'] != DOWNLOAD_URL
            or evidence['proposalSha256'] != proposal_sha256
            or evidence['orderedRequestSha256'] != identities
            or evidence['sourcePins'] != proposal['sourcePins']):
        raise ValueError('Observation date, URL, source or ordered proposal pins differ')
    if not _text(evidence['blocker'], nullable=True):
        raise ValueError('Blocker must be null or bounded text')
    observations = evidence['observations']
    if not isinstance(observations, list) or len(observations) > len(jobs):
        raise ValueError('Bounded observation list required')
    rows, previous = [], 0
    for observation in observations:
        if not isinstance(observation, dict) or set(observation) != ROW_KEYS:
            raise ValueError('Observation row keys differ; authority claims prohibited')
        index = observation['proposalRow']
        if type(index) is not int or not previous < index <= len(jobs):
            raise ValueError('Duplicate, out-of-order or invalid proposal row')
        previous = index
        job = jobs[index - 1]
        if observation['requestSha256'] != job['sha256']:
            raise ValueError('Substituted request identity')
        try:
            stamp = observation['observedAt']
            if not isinstance(stamp, str):
                raise ValueError()
            if re.fullmatch(r'\d{4}-\d{2}-\d{2}', stamp):
                row_date = date.fromisoformat(stamp).isoformat()
                precision = 'day'
            else:
                if 'T' not in stamp:
                    raise ValueError()
                parsed = datetime.fromisoformat(stamp.replace('Z', '+00:00'))
                if parsed.utcoffset() is None:
                    raise ValueError()
                row_date = parsed.astimezone(OBSERVATION_ZONE).date().isoformat()
                precision = 'instant'
            if row_date != observed_date:
                raise ValueError()
        except (ValueError, TypeError):
            raise ValueError('Each row needs a current Asia/Calcutta date or offset-bearing timestamp') from None
        state, control = observation['state'], observation['submitControl']
        allowed = {'enabled': {'enabled'}, 'disabled': {'disabled'},
                   'login-required': {'disabled', 'unavailable'}, 'uninspected': {'unavailable'}}
        if (not isinstance(state, str) or state not in allowed
                or not isinstance(control, str) or control not in allowed[state]):
            raise ValueError('Observed state and submit control disagree')
        if not _messages(observation['validationMessages']) or not _messages(observation['limits']):
            raise ValueError('Bounded actual UI messages and limits required')
        dataset, request = observation['generatedDataset'], observation['generatedRequest']
        compared = dataset is not None or request is not None
        if compared and (dataset != job['dataset'] or not isinstance(request, dict)
                         or g.canonical(request) != g.canonical(job['request'])):
            raise ValueError('Observed generated request or dataset differs')
        if state in ('enabled', 'disabled') and not compared:
            raise ValueError('Inspected selection needs actual generated request')
        if state == 'uninspected' and compared:
            raise ValueError('Uninspected row cannot claim generated code comparison')
        if state == 'login-required' and not observation['validationMessages']:
            raise ValueError('Actual login blocker message required')
        rows.append(dict(proposalRow=index, requestSha256=job['sha256'],
                         observedAt=observation['observedAt'], state=state,
                         observationPrecision=precision,
                         exactGeneratedRequestCompared=compared, submitControl=control,
                         validationMessages=list(observation['validationMessages']),
                         limits=list(observation['limits'])))
    present = {row['proposalRow'] for row in rows}
    compared = sum(row['exactGeneratedRequestCompared'] for row in rows)
    enabled = sum(row['submitControl'] == 'enabled' for row in rows)
    return dict(schemaVersion=1, kind='weather-form-comparison-report-v1',
                evidenceType='sanitized-transcription-not-provider-signed',
                observedDate=observed_date, proposalSha256=proposal_sha256,
                orderedRequestSha256=identities, sourcePins=proposal['sourcePins'],
                expectedRows=len(jobs), observedRows=len(rows), comparedRows=compared,
                enabledRows=enabled, disabledRows=sum(r['state'] == 'disabled' for r in rows),
                loginRequiredRows=sum(r['state'] == 'login-required' for r in rows),
                uninspectedRows=sum(r['state'] == 'uninspected' for r in rows),
                missingRows=[i for i in range(1, len(jobs) + 1) if i not in present],
                allRequestsCompared=compared == len(jobs), allSubmitControlsEnabled=enabled == len(jobs),
                executionEligible=False, blocker=evidence['blocker'], rows=rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--proposal', required=True)
    parser.add_argument('--proposal-sha256', required=True)
    parser.add_argument('--observations', required=True)
    parser.add_argument('--observed-date', required=True, help='Current date in user timezone, YYYY-MM-DD')
    args = parser.parse_args()
    observations, digest = read_json(args.observations)
    report = validate(args.proposal, args.proposal_sha256, observations, observed_date=args.observed_date)
    print(g.canonical(dict(report, observationsSha256=digest)))


if __name__ == '__main__': main()
