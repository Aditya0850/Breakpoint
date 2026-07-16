import requests, json, time

BASE_URL = "http://127.0.0.1:5000"
HEADERS = {"Content-Type": "application/json"}

def run_integration_test():

    print("🚀 Starting Sentinel Backend Integration Test...\n")

    print("[1/3] Initializing simulation session (/api/start)...")
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

    print("[2/3] Executing chat simulation (/api/chat)...")
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

if __name__ == "__main__":
    run_integration_test()
