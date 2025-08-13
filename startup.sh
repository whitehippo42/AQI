#!/bin/bash
echo "Starting AQI Prediction System initialization..."
python aqi_prediction_system.py
echo "Starting Flask backend server..."
python flask_api_backend.py
