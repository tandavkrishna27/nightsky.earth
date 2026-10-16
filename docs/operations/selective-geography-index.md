# Reference-selective geography index

The raw producer now offers an explicit `selected-references` geography mode. Existing callers and plans default to `all-nodes`. Neither mode changes the `named-complete-way-v1-polar85` candidate policy or catalogue revision identity.

## Execution and admission

Direct producer usage adds `--geography-mode selected-references`; Python callers pass `geography_mode='selected-references'`. The supervised membership assembly plan accepts optional `"geographyMode": "selected-references"`. The plan SHA-256 therefore binds this operational choice. The fixed supervisor passes the mode to the raw worker, whose checkpoint and completion descriptor record it. Assembly rejects a producer mode different from the plan. Resume checks both checkpoint and completion modes; old descriptors without the field mean `all-nodes`.

Selected mode makes three sequential passes per source:

1. Apply the existing category and cleaned name selection to ways; insert their node references into SQLite primary-key placeholders. Duplicate references share one row. No global Python reference set is held.
2. Read all nodes, retain coordinates only for placeholders, and count every valid node against the existing `nodes` ceiling. Validate nondecreasing **valid-node IDs** and compare adjacent duplicate coordinates for every valid node, including unselected nodes. Conflicting duplicates abort. Invalid coordinates remain ignored for way lookup as before.
3. Run the existing candidate and exclusion logic. Named selected nodes use their own coordinates directly. Missing or invalid referenced nodes leave NULL placeholders and produce the same incomplete-way exclusion. Closed-way averaging, date-line and polar exclusions, source lineage and candidate conflicts are unchanged.

The ordering rule is an explicit selective-mode admission contract. Unordered valid-node IDs fail closed; there is no automatic fallback that unexpectedly creates an all-node index. Legacy mode still supports arbitrary node order and full disk-backed duplicate validation. Ordering is checked while reading, never inferred from a filename or asserted as a planet property.

## Resource limits

References and their coordinates share the existing main SQLite database, its `max_page_count`, 2 MiB cache, DELETE journal and scratch inventory. Every reference insertion calls the existing resource guard. All three passes share the same deadline, source pins, row/reference limits, scratch/output budgets and free reserve. Existing path checks and source verification remain in force. The node limit still counts input valid-node records, not retained coordinate rows.

This trades another full sequential input pass for fewer retained coordinates. The reference set can still be large; disk caps and sampled journal accounting are still necessary. Candidate, lineage and exclusion tables also consume the database allowance. Deleted source rows can leave allocated SQLite pages for reuse, so physical size reflects the high-water allocation rather than only the final source's live rows.

## Validation

Synthetic tests compare exact candidate, exclusion and lineage bytes across modes, including named nodes, complete/closed ways, invalid and missing references, empty ways, date-line and polar ways, relations, unnamed ways and duplicate source lineage. Tests also reject conflicting unselected duplicates, unordered IDs, mismatched resume/assembly modes, node/reference/scratch caps, and exercise the supervised selected-mode assembly. A 5,001-node fixture with only two referenced nodes completes below a 64 KiB main scratch ceiling while legacy mode stops at that ceiling.

The existing osmium virtual environment is required for full Python coverage; the system Python does not have osmium. A first system-Python suite run failed for that missing dependency, then the existing environment passed. No installation occurred. Final verification: Python OSM suite 138 tests with four skips and no failures; repository JavaScript suite 910 tests, 909 passed and one skipped; six focused assembly TypeScript tests passed; tools TypeScript typecheck passed.

## Retained local comparison

[Machine-readable evidence](data-pilot-evidence/selective-geography-index-20261016.json) records two completed sequential jobs against existing Monaco and Faroe PBFs (8,427,934 source bytes total). Candidate, exclusion and lineage files were compared byte for byte and are identical: 84 candidates, 295 exclusions, and 84 lineage rows.

| Observation | All nodes | Selected references |
| --- | ---: | ---: |
| Elapsed seconds | 47.196 | 64.599 |
| Final SQLite bytes, all tables | 33,828,864 | 147,456 |
| Final source geography rows (Faroe only) | 1,198,456 | 1,446 |
| Peak counted logical bytes, including retained inputs/results | 42,375,097 | 42,632,811 |

The final database is 99.56% smaller in this example; selective elapsed time is about 37% greater. These are observed small-source results, not planet projections. The selective peak counted bytes include the completed baseline as retained evidence, so they are not a direct comparison of new allocation alone. Final geography rows refer only to Faroe, because the table is reset for each source; they do not count cells or all input nodes across both sources.

Each job had 120 seconds wall time, a 768 MiB hard process-tree commit ceiling, two active processes, 256 MiB counted logical disk ceiling, 128 GiB free reserve, and the producer's 110-second shared deadline, 64 MiB scratch and 8 MiB output ceilings. The supervisor's 512 MiB RSS sampling observes the virtual-environment launcher; its approximately 4.8 MB result is **not parser RSS evidence**. The Windows Job hard tree commit ceiling covers launcher and parser. One earlier attempt with a one-process ceiling stopped before parsing because the virtual-environment launcher needed a child; its failure files remain retained and counted in the successful attempt. Local job files are under `.data/osm/selective-geography-20261016-v1` and `-v2`.

The comparison retains the existing synthetic clipping control explicitly as unadmitted. It establishes local equivalence and storage behavior, not searched global coverage. Production planet fit remains unproven: selected reference count, journals, candidates, downstream membership limits, runtime and whole build storage still require an admitted capacity envelope. No new source download, provider request, installation or deployment occurred.
