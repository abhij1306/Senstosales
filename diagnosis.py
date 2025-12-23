
import urllib.request
import urllib.error
import sys

url = "http://localhost:8000/api/reports/date-summary/export?entity=invoice&start_date=2024-01-01&end_date=2024-12-31"

print(f"Hitting URL: {url}")

try:
    with urllib.request.urlopen(url) as response:
        print(f"Status Code: {response.getcode()}")
        print("Headers:", response.info())
        content = response.read(100) # Read first 100 bytes
        print(f"Content Preview: {content}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Reason: {e.reason}")
    print("Error Content:", e.read().decode('utf-8'))
except Exception as e:
    print(f"An error occurred: {e}")

print("-" * 20)

url_challan = "http://localhost:8000/api/reports/date-summary/export?entity=challan&start_date=2024-01-01&end_date=2024-12-31"
print(f"Hitting Challan URL: {url_challan}")
try:
    with urllib.request.urlopen(url_challan) as response:
        print(f"Status Code: {response.getcode()}")
        print("Headers:", response.info())
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Reason: {e.reason}")
    print("Error Content:", e.read().decode('utf-8'))
