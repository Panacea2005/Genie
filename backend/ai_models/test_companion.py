#!/usr/bin/env python3
"""
Test script to verify Genie AI works as a general companion system
Tests different types of conversations to ensure it's not mental health focused
"""

import asyncio
import sys
from pathlib import Path

# Add the current directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from main import GenieAI

def test_scenarios():
    """Test scenarios covering different conversation types"""
    return [
        {
            "type": "celebration",
            "query": "I just got promoted at work! I'm so excited!",
            "expected_tone": "enthusiastic"
        },
        {
            "type": "casual_chat", 
            "query": "What do you think about the weather today?",
            "expected_tone": "conversational"
        },
        {
            "type": "advice_seeking",
            "query": "I'm trying to decide between two job offers. Any thoughts?",
            "expected_tone": "supportive"
        },
        {
            "type": "information",
            "query": "How does photosynthesis work in plants?",
            "expected_tone": "informative"
        },
        {
            "type": "personal_share",
            "query": "I had an interesting conversation with my neighbor today",
            "expected_tone": "interested"
        },
        {
            "type": "support_needed",
            "query": "I'm feeling overwhelmed with everything happening",
            "expected_tone": "supportive"
        }
    ]

async def test_companion_system():
    """Test the companion system with various scenarios"""
    print("🚀 Testing Genie AI Companion System")
    print("=" * 50)
    
    # Initialize the system
    try:
        print("Initializing Genie AI...")
        genie = GenieAI(skip_data_loading=True)
        print("✅ System initialized successfully\n")
    except Exception as e:
        print(f"❌ Failed to initialize system: {e}")
        return False
    
    # Test scenarios
    scenarios = test_scenarios()
    session_id = "test_companion_session"
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"Test {i}: {scenario['type'].title()}")
        print(f"Query: \"{scenario['query']}\"")
        print("-" * 30)
        
        try:
            # Test with both models
            for model in ["groq", "local"]:
                print(f"\n🤖 Testing with {model.upper()} model:")
                
                response = await genie.chat(
                    query=scenario['query'],
                    session_id=f"{session_id}_{model}",
                    model_preference=model
                )
                
                if response and response.get('response'):
                    print(f"Response: {response['response'][:200]}...")
                    print(f"Confidence: {response.get('confidence', 0):.2f}")
                    print(f"Model: {response.get('model', 'unknown')}")
                    
                    # Check if response seems appropriate
                    response_text = response['response'].lower()
                    
                    # Check for overly clinical/therapeutic language
                    clinical_words = ['therapeutic', 'therapy', 'treatment', 'diagnosis', 'patient']
                    clinical_count = sum(1 for word in clinical_words if word in response_text)
                    
                    if clinical_count > 1:
                        print("⚠️  Warning: Response seems overly clinical")
                    else:
                        print("✅ Response tone seems appropriate")
                    
                else:
                    print("❌ No response received")
                
        except Exception as e:
            print(f"❌ Error in test {i}: {e}")
        
        print("\n" + "=" * 50)
    
    # Test system info
    print("\n📊 System Information:")
    try:
        info = genie.get_system_info()
        print(f"Version: {info.get('version', 'unknown')}")
        print(f"Knowledge Base: {info.get('vector_store_docs', 0):,} documents")
        print(f"Graph: {info.get('graph_nodes', 0):,} nodes")
        print(f"Features: {info.get('features', {})}")
        print("✅ System info retrieved successfully")
    except Exception as e:
        print(f"❌ Error getting system info: {e}")
    
    print("\n🎉 Companion system testing complete!")
    return True

def main():
    """Main test function"""
    print("Testing Genie AI as General Companion System")
    print("This test verifies the system works for all types of conversations,")
    print("not just mental health support.\n")
    
    try:
        # Run the async test
        asyncio.run(test_companion_system())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest failed with error: {e}")

if __name__ == "__main__":
    main() 