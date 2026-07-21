"""
Keep-Alive Bot for Render Free Tier
Pings https://handloom-ai-app.onrender.com/ every 5 minutes to prevent spin-down.
Run this script locally: python keep_alive.py
"""
import time
import urllib.request
import urllib.error
from datetime import datetime

URL = "https://handloom-ai-app.onrender.com/"
PING_INTERVAL_SECONDS = 5 * 60  # 5 minutes


def ping():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with urllib.request.urlopen(URL, timeout=30) as response:
            status = response.status
            print(f"[{timestamp}] ✅ ALIVE — HTTP {status} from {URL}")
    except urllib.error.HTTPError as e:
        print(f"[{timestamp}] ⚠️  HTTP Error {e.code} — server is responding but returned an error.")
    except urllib.error.URLError as e:
        print(f"[{timestamp}] ❌ FAILED — {e.reason}")
    except Exception as e:
        print(f"[{timestamp}] ❌ UNEXPECTED ERROR — {e}")


if __name__ == "__main__":
    print(f"🤖 Keep-alive bot started. Pinging every {PING_INTERVAL_SECONDS // 60} minutes.")
    print(f"   Target: {URL}")
    print("   Press Ctrl+C to stop.\n")

    while True:
        ping()
        time.sleep(PING_INTERVAL_SECONDS)
