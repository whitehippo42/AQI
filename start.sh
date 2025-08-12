#!/usr/bin/env bash
set -e
python aqi_prediction_system.py &
exec gunicorn --bind=0.0.0.0:${PORT:-8000} flask_api_backend:app
