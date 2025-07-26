#!/usr/bin/env python3
"""
Test script for emotion recognition integration
"""

import os
import sys
sys.path.append('ai_models')

from emotion_recognition_service import get_emotion_service, initialize_emotion_service

def test_emotion_service():
    """Test the emotion recognition service"""
    print("🧪 Testing Emotion Recognition Integration")
    print("=" * 50)
    
    # Initialize service
    print("1. Initializing emotion recognition service...")
    success = initialize_emotion_service()
    
    if not success:
        print("❌ Failed to initialize emotion recognition service")
        return False
    
    print("✅ Emotion recognition service initialized successfully")
    
    # Get service instance
    service = get_emotion_service()
    
    # Check status
    print("\n2. Checking service status...")
    status = service.get_status()
    for key, value in status.items():
        print(f"   {key}: {value}")
    
    if not service.is_available():
        print("❌ Emotion recognition service not available")
        return False
    
    print("✅ Emotion recognition service is available")
    
    # Test with dummy data (this will fail gracefully)
    print("\n3. Testing with dummy base64 data...")
    try:
        result = service.analyze_emotion_from_base64("dummy_data")
        if result.get("error"):
            print(f"✅ Expected error handling works: {result['error']}")
        else:
            print("❌ Expected error but got valid result")
    except Exception as e:
        print(f"✅ Exception handling works: {e}")
    
    print("\n🎉 Emotion recognition integration test completed!")
    print("\nNext steps:")
    print("1. Start the backend server: python ai_models/start_backend.py")
    print("2. Test the /emotion/analyze endpoint with real audio data")
    print("3. Use voice mode in the frontend to see emotion detection in action")
    
    return True

if __name__ == "__main__":
    test_emotion_service() 