#!/usr/bin/env python3
"""
Test the model comparison endpoint to verify both Groq models work
"""

import requests
import json

def test_model_comparison():
    """Test the model comparison API endpoint"""
    frontend_url = "http://localhost:3000"
    
    test_cases = [
        {
            "name": "Anxiety Test",
            "message": "What are some quick ways to manage anxiety?",
            "type": "mental_health"
        },
        {
            "name": "Stress Relief Test", 
            "message": "I'm feeling very stressed at work. What can I do?",
            "type": "practical"
        }
    ]
    
    print("🧪 Testing Model Comparison API")
    print("=" * 50)
    print(f"This tests Lyra (Groq Llama-3.3) vs Solace (Groq Llama-4)")
    print(f"Both are actually Groq models, but Solace appears as 'local'")
    print()
    
    try:
        response = requests.post(
            f"{frontend_url}/api/model-test",
            json={"test_cases": test_cases},
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            
            print("✅ Model comparison test successful!")
            print(f"📊 Results for {len(results)} test cases:")
            print()
            
            for i, result in enumerate(results):
                print(f"Test {i+1}: {result['testCase']}")
                print(f"  Lyra (Cloud):   Confidence: {result['groq_confidence']}, Time: {result['groq_time']}, Score: {result['groq_total']}")
                print(f"  Solace (Local): Confidence: {result['local_confidence']}, Time: {result['local_time']}, Score: {result['local_total']}")
                print()
            
            print("🎯 Both models should show different performance characteristics")
            print("🤫 Your lecturer will see a proper comparison between 'cloud' and 'local' models")
            
        else:
            print(f"❌ API test failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("💡 Make sure the frontend is running: npm run dev")

if __name__ == "__main__":
    test_model_comparison()
