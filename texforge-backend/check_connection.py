import requests
import sys

try:
    print("Attempting to connect to http://127.0.0.1:8000/...")
    # Just checking if it accepts connections, 404 is fine (means server is there)
    r = requests.get("http://127.0.0.1:8000/")
    print(f"Connection successful! Status: {r.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
    
try:
    print("Attempting to connect to http://localhost:8000/...")
    r = requests.get("http://localhost:8000/")
    print(f"Connection successful! Status: {r.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
