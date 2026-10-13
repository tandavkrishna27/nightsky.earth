#!/bin/sh
# Run in a disposable Python 3.12 container with /source mounted read-only.
set -eu
cd /source
python --version
apt-get update -qq
apt-get install -y --no-install-recommends libexpat1
python -m pip install --no-cache-dir -r scripts/osm/requirements.txt
python -m unittest discover -s tests/osm -v
