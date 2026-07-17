import requests, json, time

BASE_URL = "http://127.0.0.1:5000"
HEADERS = {"Content-Type": "application/json"}

# Dummy credentials for testing
TEST_EMAIL = "sentinel_test_40@gmail.com"
TEST_PASSWORD = "SuperSecretPassword123!"

def run_integration_test():

    print("🚀 Starting Sentinel Backend Integration Test...\n")

    # ==========================================
    # [0/5] AUTHENTICATION (NEW)
    # ==========================================
    print("[0/5] Authenticating test user (/api/auth/login)...")
    
    # 1. Attempt to login first
    login_payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=HEADERS)
    
    # 2. If login fails (user doesn't exist), register them
    if login_res.status_code != 200:
        print("    User not found. Registering new test user (/api/auth/signup)...")
        signup_res = requests.post(f"{BASE_URL}/api/auth/signup", json=login_payload, headers=HEADERS)
        
        if signup_res.status_code not in (200, 201):
            print(f"❌ Failed to register test user: {signup_res.text}")
            return
            
        # Try logging in one more time after successful registration
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, headers=HEADERS)

    # 3. Extract the JWT and update the global headers
    if login_res.status_code == 200:
        access_token = login_res.json().get("access_token")
        # Attach the Bearer token to all future requests
        HEADERS["Authorization"] = f"Bearer {access_token}"
        print("✅ Authentication successful! JWT token attached to headers.\n")
    else:
        print(f"❌ Failed to authenticate test user: {login_res.text}")
        return

    # ==========================================
    # [1/5] INITIALIZATION
    # ==========================================
    print("[1/5] Initializing simulation session (/api/start)...")
    start_payload = {
        "scenario": "Hostile Termination",
        "personality": "Defensive senior engineer refusing to hand over credentials",
        "context": "An employee named Alex caught violating data exfiltration policies.",
        "brutal": True
    }

    start_res = requests.post(f"{BASE_URL}/api/start", json=start_payload, headers=HEADERS)
    if start_res.status_code != 201:
        print(f"❌ Failed to start session: {start_res.text}")
        return
        
    session_id = start_res.json().get("session_id")
    print(f"✅ Session started! ID: {session_id}\n")

    # ==========================================
    # [2/5] CHAT SIMULATION
    # ==========================================
    print("[2/5] Executing chat simulation (/api/chat)...")
    mock_dialogue = [
        "Alex, we need to talk about your recent system logs. We have to suspend your access immediately.",
        "Um, so I understand you're frustrated, but like, this is a security protocol.",
        "Alex, this is not a negotiation. Refusing to hand over credentials will escalate this to a legal matter."
    ]
    
    for i, message in enumerate(mock_dialogue, 1):
        print(f"👉 Turn {i} (User): {message}")
        chat_payload = {"session_id": session_id, "message": message}
        
        chat_res = requests.post(f"{BASE_URL}/api/chat", json=chat_payload, headers=HEADERS, stream=True)
        
        if chat_res.status_code == 200:
            print(f"🤖 Turn {i} (AI): ", end="", flush=True)
            
            for line in chat_res.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith("data: "):
                        json_str = decoded_line.replace("data: ", "")
                        try:
                            chunk_data = json.loads(json_str)
                            if chunk_data.get("type") == "chunk":
                                print(chunk_data.get("text", ""), end="", flush=True)
                        except json.JSONDecodeError:
                            pass
            print("\n")
        else:
            print(f"❌ Chat error: {chat_res.text}")
            return
            
        time.sleep(2)

    # ==========================================
    # [3/5] METRIC EVALUATION
    # ==========================================
    print("[3/5] Triggering session performance evaluation (/api/evaluate)...")
    eval_payload = {"session_id": session_id}
    eval_res = requests.post(f"{BASE_URL}/api/evaluate", json=eval_payload, headers=HEADERS)
    
    if eval_res.status_code == 200:
        print("✅ Evaluation complete! Metrics written to database.")
    else:
        print(f"❌ Evaluation Failed! Status: {eval_res.status_code} - {eval_res.text}")
        return

    # ==========================================
    # [4/5] PDF REPORT EXPORT
    # ==========================================
    print("\n[4/5] Testing PDF Export (/api/export)...")

    export_url = f"{BASE_URL}/api/export/{session_id}"
    export_response = requests.get(export_url, headers=HEADERS)

    if export_response.status_code == 200:
        output_filename = f"test_report_{session_id[:8]}.pdf"
        with open(output_filename, "wb") as f:
            f.write(export_response.content)
        print(f"✅ Success! PDF downloaded and saved locally as '{output_filename}'")
    else:
        print(f"❌ PDF Export Failed! Status: {export_response.status_code}")
        print(export_response.text)

if __name__ == "__main__":
    run_integration_test()
