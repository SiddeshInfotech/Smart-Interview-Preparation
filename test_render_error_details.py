import requests

RENDER_BASE_URL = "https://smart-interview-preparation-iv4c.onrender.com/api"

def test_reg():
    # Test register directly
    res = requests.post(f"{RENDER_BASE_URL}/auth/register/", json={
        "full_name": "Test Candidate Render",
        "email": "render_test_diag@example.com",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!",
        "role": "candidate"
    })
    print("Status Code:", res.status_code)
    print("Response Content:", res.text)

if __name__ == "__main__":
    test_reg()
