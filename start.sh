#!/usr/bin/env bash
set -e

# 1) start your prediction system in the background
python aqi_prediction_system.py &

# 2) start the Flask API with gunicorn (binds to the port Azure provides)
exec gunicorn --bind=0.0.0.0:${PORT:-8000} flask_api_backend:app
