import razorpay
import traceback
from dotenv import load_dotenv
load_dotenv()
from app.config import settings

print("Key ID:", settings.razorpay_key_id)

try:
    client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
    order = client.order.create({
        "amount": 900,
        "currency": "USD",
        "notes": {
            "user_id": "test-user",
            "plan": "pro_monthly",
            "email": "test@example.com"
        }
    })
    print("SUCCESS:", order)
except Exception as e:
    print("FAILED:", type(e).__name__)
    print("ERROR:", str(e)[:800])
    traceback.print_exc()
