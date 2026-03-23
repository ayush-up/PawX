import requests
import os

url = "http://localhost:5000/process"
image_path = "input.jpg"

if not os.path.exists(image_path):
    print(f"Error: {image_path} not found.")
    exit(1)

files = {"image": open(image_path, "rb")}
data = {"seamless": "true", "pbr": "true"}

try:
    response = requests.post(url, files=files, data=data)
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)
except Exception as e:
    print("Request failed:", e)
