from fastapi.testclient import TestClient
from app.main import app
from app.middleware.auth import get_current_user

class MockUser:
    id = "11111111-1111-1111-1111-111111111111"
    email = "test@example.com"

app.dependency_overrides[get_current_user] = lambda: MockUser()
client = TestClient(app)
try:
    response = client.post("/api/billing/create-order", json={"plan": "pro_monthly"})
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.json())
except Exception as e:
    import traceback
    traceback.print_exc()
