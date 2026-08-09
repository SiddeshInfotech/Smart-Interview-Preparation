import requests

RENDER_BASE_URL = "https://smart-interview-preparation-iv4c.onrender.com/api"

def test_auth():
    import random
    rand_id = random.randint(1000, 9999)
    email = f"render_candidate_{rand_id}@example.com"
    pwd = "TestPassword123!"
    
    reg_payload = {
        "full_name": "Render Candidate Test",
        "name": "Render Candidate Test",
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "user_type": "candidate",
        "role": "candidate"
    }
    
    res = requests.post(f"{RENDER_BASE_URL}/auth/register/", json=reg_payload)
    print(f"Register status: {res.status_code}")
    print(f"Register body: {res.json()}")
    
    if res.status_code in [200, 201]:
        token = res.json().get("access") or res.json().get("tokens", {}).get("access")
        if not token:
            login_res = requests.post(f"{RENDER_BASE_URL}/auth/login/", json={"email": email, "password": pwd})
            print(f"Login status: {login_res.status_code}")
            print(f"Login body: {login_res.json()}")
            token = login_res.json().get("access") or login_res.json().get("tokens", {}).get("access")

        if token:
            print("=== SUCCESS! JWT Token obtained ===")
            headers = {"Authorization": f"Bearer {token}"}
            
            # GET profile
            p_res = requests.get(f"{RENDER_BASE_URL}/candidate/profile/", headers=headers)
            print(f"GET /candidate/profile/ status: {p_res.status_code}, data: {p_res.json()}")
            
            # PUT profile with domain
            put_res = requests.put(f"{RENDER_BASE_URL}/candidate/profile/", data={
                "target_domain": "Game Development",
                "location": "Dhule",
                "education": "B.Tech",
                "experience_years": 2,
                "skills": "C++, Unity"
            }, headers=headers)
            print(f"PUT /candidate/profile/ status: {put_res.status_code}, data: {put_res.json()}")

            # Generate Quiz
            q_res = requests.post(f"{RENDER_BASE_URL}/quiz/generate/", json={
                "topics": ["Game Development", "C++"],
                "mode": "MCQ",
                "question_count": 10
            }, headers=headers)
            print(f"POST /quiz/generate/ status: {q_res.status_code}")
            if q_res.status_code == 200:
                print(f"Generated {len(q_res.json().get('questions', []))} questions!")
                
            # Generate Coding
            c_res = requests.post(f"{RENDER_BASE_URL}/coding/generate/", json={
                "language": "C++",
                "custom_instruction": "Game physics problem"
            }, headers=headers)
            print(f"POST /coding/generate/ status: {c_res.status_code}")
            if c_res.status_code == 200:
                print(f"Generated coding challenge: {c_res.json().get('data', {}).get('title')}")

if __name__ == "__main__":
    test_auth()
