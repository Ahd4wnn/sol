import os
import base64
import json
from dotenv import load_dotenv
load_dotenv(override=True)
from supabase import create_client
import traceback

def main():
    try:
        url = os.environ.get('SUPABASE_URL')
        key = os.environ.get('SUPABASE_SERVICE_KEY')
        print("URL:", url)
        if key:
            payload = key.split('.')[1]
            padded = payload + '=' * (-len(payload) % 4)
            decoded = base64.urlsafe_b64decode(padded).decode('utf-8')
            print("DECODED ROLE:", json.loads(decoded).get('role'))
        else:
            print("NO KEY")
            return
            
        supabase = create_client(url, key)
        data = {
            "user_id": "00000000-0000-0000-0000-000000000000",
            "title": "Test Session",
            "mood_before": "good"
        }
        res = supabase.table('therapy_sessions').insert(data).execute()
        print('SUCCESS:', res.data)
    except Exception as e:
        print("EXCEPTION OCCURRED:", type(e).__name__, str(e))

if __name__ == "__main__":
    main()
