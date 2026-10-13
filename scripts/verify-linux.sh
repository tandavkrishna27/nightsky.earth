#!/bin/sh
# Run inside a disposable Linux container with /source mounted read-only and /work as a volume.
set -eu
tar -C /source --exclude=node_modules --exclude=.data --exclude=.git --exclude=dist --exclude=.superpowers -cf - . | tar -C /work -xf -
cd /work
node --version
npm ci --no-fund
npm test
npm run check
npm run build
npm prune --omit=dev --no-fund
npm audit --omit=dev
node scripts/verify-production-runtime.mjs
