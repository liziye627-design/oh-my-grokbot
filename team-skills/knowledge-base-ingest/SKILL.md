---
name: knowledge-base-ingest
description: >-
  Use after an artifact has passed independent acceptance review, to file its
  full text into a shared knowledge base with provenance and hand a short
  summary upstream.
---
# Steps
1. Confirm acceptance: locate the reviewer's pass record for this artifact. If there is no pass record, or it lists open gaps, stop and return it as not ready; never ingest unreviewed or rejected material.
2. Collect metadata: title, source task, owner role, reviewer, acceptance date, source paths or URLs, version.
3. Check for duplicates: search the knowledge base by title and source. If an entry exists, add a new version and link it to the old one instead of overwriting.
4. Write the entry: full original text unchanged, plus a header with the metadata. Keep facts, inferences, and unknowns labeled as the source labeled them; do not add new claims.
5. Index it: add it to the knowledge base index with tags and a one-line description.
6. Verify: reread the saved entry and confirm it matches the source and the index link works.
7. Hand off: send upstream a summary of 3 to 5 sentences with the entry location. Keep the full text in the record, not in the message.
