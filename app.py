"""
PropertyDesk Enterprise Management System - Main Entry Point
"""
import os
import sys

# Ensure backend directory is in sys.path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from backend.app import app

if __name__ == '__main__':
    print("Starting PropertyDesk Server on http://127.0.0.1:5000 ...")
    app.run(host='127.0.0.1', port=5000, debug=True)
