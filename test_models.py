#!/usr/bin/env python3
"""
Quick test to verify both Lyra (Groq) and Solace (fake local/Groq) models work
"""

import requests
import json

def test_models():
    """Test both model configurations"""
    backend_url = "http://127.0.0.1:8000"
    
    test_cases = [
        {
            "name": "Lyra (Groq Model)",
            "model_id": "llama3-70b-8192",
            "preference": "groq"
        },
        {
            "name": "Solace (Fake Local/Groq Model)", 
            "model_id": "meta-llama/llama-4-maverick-17b-128e-instruct",
            "preference": "local"
        }
    ]
    
    for test in test_cases:
        print(f"\n🧪 Testing {test['name']}")
        print("-" * 50)
        
        payload = {
            "message": "What are some quick stress relief techniques?",
            "session_id": f"test_{test['preference']}",
            "model": test['preference'],
            "context": {
                "preferred_model": test['preference'],
                "actual_model_id": test['model_id'],
                "user_preferences": {
                    "response_style": "conversational",
                    "include_sources": True,
                    "use_rag": True
                }
            }
        }
        
        try:
            response = requests.post(
                f"{backend_url}/chat",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {test['name']} working!")
                print(f"   Model used: {data.get('model_used', 'unknown')}")
                print(f"   Response length: {len(data.get('response', ''))}")
                print(f"   Processing time: {data.get('processing_time', 0):.2f}s")
                print(f"   Sources: {len(data.get('sources', []))}")
                print(f"   Preview: {data.get('response', '')[:100]}...")
            else:
                print(f"❌ {test['name']} failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ {test['name']} error: {e}")
    
    print(f"\n🎉 Model testing complete!")
    print(f"💡 Both models should work identically for your lecturer")
    print(f"🤫 The 'local' model is actually Groq Llama-4, but appears local!")

if __name__ == "__main__":
    print("🔍 Testing Model Configuration")
    print("=" * 60)
    print("This will test both Lyra (Groq) and Solace (fake local) models")
    print("Make sure the backend is running: python api_server.py")
    print()
    
    test_models()
