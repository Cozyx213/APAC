#!/bin/bash
# filepath: backend_start.sh

# Navigate to the backend directory
cd /home/jake/codes/APAC/backend || exit

# Activate the virtual environment
source venv/bin/activate

# Run the Flask app
python3 app.py