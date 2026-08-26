#!/bin/sh
set -e
echo "[kspapi] Installing dependencies..."
python3 -m pip install -r requirements.txt
echo "[kspapi] Starting server..."
exec python3 run.py