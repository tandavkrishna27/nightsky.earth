"""Bounded offline calendar/retained proofs; never an acquisition allowance."""
from datetime import datetime
import re
import time

import global_acquisition as g

MAX_HOURS = 263088
MAX_RETAINED_HOURS = 1000000
MAX_SECONDS = 120


def prove_sources(jobs, sources, pins):
    """Prove selected coverage and positively audit every retained/overlay owner.

    The caller hash-pins sources and calls verify_sources first. This independently
    compares effective calendars with actual retained masks, rather than trusting
    reconciliation counts. Null observations are represented by retained hours;
    they prevent reacquisition without conferring scientific completeness.
    """
    began = time.monotonic()

    def check():
        if time.monotonic() - began > MAX_SECONDS:
            raise ValueError('Weather coverage deadline exceeded')

    plan, reconciliation = sources['frozenPlan'], sources['reconciliation']
    if not 1 <= len(jobs) <= 27 or not 1 <= len(plan['calendarTemplates']) <= 400 or len(plan['tiles']) > 100000:
        raise ValueError('Weather coverage finite bounds exceeded')
    if reconciliation.get('frozenPlanSha256') != pins['frozenPlan']:
        raise ValueError('Coverage reconciliation plan pin differs')
    templates, lookup, all_hours = {}, {}, {}
    for index, template in enumerate(plan['calendarTemplates']):
        check()
        if len(template['year']) != 1 or len(template['month']) != 1:
            raise ValueError('Coverage requires single year/month templates')
        year, month = template['year'][0], template['month'][0]
        if (year, month) in lookup:
            raise ValueError('Duplicate coverage source month')
        lookup[year, month] = index
        hours = _hours(year, month, template['day'], template['time'])
        if not hours or len(hours) > 744 or any(h in all_hours for h in hours):
            raise ValueError('Duplicate or oversized coverage template')
        templates[index] = hours
        all_hours.update({h: index for h in hours})
    if len(all_hours) > MAX_HOURS:
        raise ValueError('Coverage source hour bound exceeded')

    tiles, owners = {}, {}
    for tile in plan['tiles']:
        check()
        cells, required, filler = tile['expectedCells'], tile['requiredCells'], tile['fillerCells']
        if tile['tileId'] in tiles or not 4 <= len(cells) <= 10 or len(set(cells)) != len(cells):
            raise ValueError('Duplicate or invalid coverage owner')
        if len(required) + len(filler) != len(cells) or set(required) & set(filler) or set(required) | set(filler) != set(cells):
            raise ValueError('Coverage owner classification differs')
        tiles[tile['tileId']] = tile
        for cell in cells:
            if cell in owners:
                raise ValueError('Duplicate coverage cell ownership')
            owners[cell] = (tile['tileId'], 'required' if cell in required else 'filler')
    known, retained_owners, retained_count = {}, set(), 0
    if len(reconciliation['cells']) > 100000:
        raise ValueError('Coverage retained cell bound exceeded')
    for cell in reconciliation['cells']:
        check()
        cell_id = cell['cellId']
        if cell_id in known:
            raise ValueError('Duplicate retained coverage cell')
        expected_owner, expected_kind = owners.get(cell_id, (None, 'outside'))
        if (cell.get('tileId'), cell.get('ownership')) != (expected_owner, expected_kind):
            raise ValueError('Retained coverage owner/classification differs')
        values = cell['hoursUtc']
        if not isinstance(values, list) or len(values) != len(set(values)):
            raise ValueError('Duplicate retained coverage hour')
        retained_count += len(values)
        if retained_count > MAX_RETAINED_HOURS:
            raise ValueError('Coverage retained hour bound exceeded')
        masks = {}
        for at in values:
            check()
            if not isinstance(at, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:00:00Z', at) or at not in all_hours:
                raise ValueError('Invalid or off-template retained coverage hour')
            masks.setdefault(all_hours[at], set()).add(at)
        known[cell_id] = masks
        if expected_owner is not None:
            retained_owners.add(expected_owner)

    replacements, overlay_overrides, affected, overlay_report = {}, {}, set(), None
    if 'ownershipOverlay' in sources:
        overlay = sources['ownershipOverlay']
        replacements, overlay_overrides, _ = g.verify_ownership_overlay(overlay, plan, reconciliation, pins)
        affected = set(overlay['affectedTileIds'])
        overlay_report = dict(
            affectedOwnerIds=sorted(affected), exactVerifier='verify_ownership_overlay',
            transferredRequiredCellHours=sum(len(r['requiredCells']) * r['expectedHours'] for r in replacements.values()),
            transferredFillerCellHours=sum(len(r['fillerCells']) * r['expectedHours'] for r in replacements.values()),
            retainedExcludedCellHours=sum(len(known.get(c, {}).get(i, set())) for c in owners if owners[c][0] in affected for i in templates),
            removedFillerCellHours=len(overlay['removedFillerCells']) * len(overlay['hoursUtc']))
    overrides = {}
    for entry in reconciliation['updatedOverrides']:
        tile_id = entry['tileId']
        if tile_id in overrides or tile_id not in tiles:
            raise ValueError('Duplicate or unknown updated coverage owner')
        overrides[tile_id] = entry['overrides']
    overrides.update(overlay_overrides)
    selected = {}
    for row in jobs:
        check()
        g.validate_job(row)
        tile_id = row['tileId']
        if tile_id in replacements or tile_id in affected:
            raise ValueError('Selected overlay ownership requires separate transferred-day coverage approval')
        if tile_id not in tiles:
            raise ValueError('Unknown selected coverage owner')
        tile = tiles[tile_id]
        if row['request']['area'] != tile['area'] or any(row[k] != tile[k] for k in ('expectedCells', 'requiredCells', 'fillerCells')):
            raise ValueError('Selected coverage ownership differs')
        per_month = selected.setdefault(tile_id, {})
        for year in row['request']['year']:
            key = (year, row['request']['month'][0])
            if key not in lookup:
                raise ValueError('Selected clock outside coverage templates')
            index = lookup[key]
            hours = _hours(*key, row['request']['day'], row['request']['time'])
            prior = per_month.setdefault(index, set())
            if prior & hours:
                raise ValueError('Duplicate selected coverage hour')
            prior.update(hours)

    audits = []
    for tile_id in sorted(set(selected) | retained_owners | affected):
        check()
        tile = tiles[tile_id]
        effective = _overrides(overrides.get(tile_id, tile['overrides']), plan, templates)
        check()
        total = dict(fullMissingRequiredCellHours=0, fullMissingFillerCellHours=0,
                     originalScheduleRequiredCellHours=0, originalScheduleFillerCellHours=0,
                     selectedRequiredCellHours=0, selectedFillerCellHours=0,
                     remainderRequiredCellHours=0, remainderFillerCellHours=0,
                     retainedRequiredCellHours=0, retainedFillerCellHours=0)
        for index, base in templates.items():
            check()
            actual = effective.get(index, base)
            chosen = selected.get(tile_id, {}).get(index, set())
            for cell in tile['expectedCells']:
                kind = 'Required' if cell in tile['requiredCells'] else 'Filler'
                retained = known.get(cell, {}).get(index, set())
                missing = base - retained
                expected = missing
                if tile_id in affected:
                    expected = missing - set(sources['ownershipOverlay']['hoursUtc'])
                if actual != expected:
                    raise ValueError('Effective coverage override differs from exact template-minus-retained mask')
                if not chosen <= actual or chosen & retained:
                    raise ValueError('Selected coverage includes retained or unapproved hours')
                total['fullMissing' + kind + 'CellHours'] += len(missing)
                total['originalSchedule' + kind + 'CellHours'] += len(actual)
                total['selected' + kind + 'CellHours'] += len(chosen)
                total['remainder' + kind + 'CellHours'] += len(actual - chosen)
                total['retained' + kind + 'CellHours'] += len(retained)
        audits.append(dict(tileId=tile_id, selectedOwner=tile_id in selected,
                           retainedOwner=tile_id in retained_owners, overlayOwner=tile_id in affected,
                           completeSelectedOwner=tile_id in selected and total['remainderRequiredCellHours'] == 0 and total['remainderFillerCellHours'] == 0,
                           **total))
    selected_audits = [a for a in audits if a['selectedOwner']]
    check()
    return dict(schemaVersion=1, status='proved-offline-no-provider-acceptance',
                selectedOwnerIds=sorted(selected), auditedOwnerIds=[a['tileId'] for a in audits],
                sourceHoursPerCell=len(all_hours), retainedDisjoint=True, baselineCompletionClaim=False,
                selectedScopeTotals={key: sum(a[key] for a in selected_audits) for key in selected_audits[0] if key.endswith('CellHours')},
                ownerAudits=audits, ownershipOverlayAudit=overlay_report,
                bounds=dict(maxSourceHours=MAX_HOURS, maxRetainedHours=MAX_RETAINED_HOURS, maxSeconds=MAX_SECONDS))


def _hours(year, month, days, times):
    if not isinstance(year, str) or not re.fullmatch(r'\d{4}', year) or not isinstance(month, str) or not re.fullmatch(r'\d{2}', month):
        raise ValueError('Invalid coverage calendar')
    if not isinstance(days, list) or not isinstance(times, list) or len(days) > 31 or len(times) > 24 or len(set(days)) != len(days) or len(set(times)) != len(times):
        raise ValueError('Duplicate or invalid coverage day/hour')
    hours = set()
    for day in days:
        for hour in times:
            if not isinstance(day, str) or not re.fullmatch(r'\d{2}', day) or not isinstance(hour, str) or not re.fullmatch(r'(?:[01]\d|2[0-3]):00', hour):
                raise ValueError('Invalid coverage day/hour')
            at = f'{year}-{month}-{day}T{hour}:00Z'
            datetime.fromisoformat(at.replace('Z', '+00:00'))
            if not '1990-12-30T00:00:00Z' <= at < '2021-01-03T00:00:00Z':
                raise ValueError('Coverage calendar outside padded baseline')
            hours.add(at)
    return hours


def _overrides(entries, plan, templates):
    result = {}
    for entry in entries:
        index = entry['template']
        if type(index) is not int or index not in templates or index in result:
            raise ValueError('Duplicate or invalid coverage override')
        template = plan['calendarTemplates'][index]
        hours = set()
        for shape in entry['shapes']:
            selected = _hours(template['year'][0], template['month'][0], shape['days'], shape['time'])
            if not selected or not selected <= templates[index] or hours & selected:
                raise ValueError('Overlapping or off-template coverage override')
            hours.update(selected)
        result[index] = hours
    return result
