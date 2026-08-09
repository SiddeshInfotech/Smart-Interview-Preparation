import requests, random

RENDER_BASE_URL = "https://smart-interview-preparation-iv4c.onrender.com/api"

def test_full_reg_on_render():
    rand = random.randint(10000, 99999)
    email = f"render_user_{rand}@gmail.com"
    pwd = "TestPassword123!"
    
    print(f"Step 1: Send registration OTP to {email}")
    res1 = requests.post(f"{RENDER_BASE_URL}/auth/send-registration-otp/", json={"email": email})
    print(f"  Send OTP Status: {res1.status_code}, Response: {res1.text}")
    
    # Check if registration without verifying OTP triggers 500 or 400
    print("\nStep 2: Submit Registration payload")
    res2 = requests.post(f"{RENDER_BASE_URL}/auth/register/", json={
        "full_name": "Test Candidate",
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "role": "candidate"
    })
    print(f"  Register Status: {res2.status_code}")
    print(f"  Register Response Body: {res2.text}")

if __name__ == "__main__":
    test_full_reg_on_render()
