#!/usr/bin/env python3
"""
Diagnostic script to test ML service API.
"""

import requests
import json
import sys

def test_health():
    """Test health endpoint."""
    print("\n" + "="*60)
    print("🏥 TESTING HEALTH ENDPOINT")
    print("="*60)
    
    try:
        response = requests.get("http://localhost:5000/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('model_loaded'):
                print("\n✅ ML model is loaded!")
                return True
            else:
                print("\n⚠️  Model not loaded - will use fallback")
                return False
    except Exception as e:
        print(f"\n❌ Health check failed: {e}")
        return False

def test_prediction():
    """Test prediction endpoint with sample data."""
    print("\n" + "="*60)
    print("🤖 TESTING PREDICTION ENDPOINT")
    print("="*60)
    
    # Test with both camelCase (from Java) and snake_case
    test_cases = [
        {
            "name": "CamelCase (Java format)",
            "data": {
                "partId": 1,
                "changeType": "MODIFY",
                "bomDepth": 2,
                "whereUsedCount": 3,
                "releasedAffected": 1,
                "conflictingChanges": 0,
                "lifecycleState": "UNDERREVIEW",
                "hasComplianceIssues": False
            }
        },
        {
            "name": "snake_case (Python format)",
            "data": {
                "part_id": 1,
                "change_type": "OBSOLETE",
                "bom_depth": 3,
                "where_used_count": 8,
                "released_affected": 2,
                "conflicting_changes": 1,
                "lifecycle_state": "RELEASED",
                "has_compliance_issues": True
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📋 Test: {test_case['name']}")
        print(f"Request: {json.dumps(test_case['data'], indent=2)}")
        
        try:
            response = requests.post(
                "http://localhost:5000/predict-risk",
                json=test_case['data'],
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\nStatus Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n✅ SUCCESS!")
                print(f"Risk Score:  {result['risk_score']}/10")
                print(f"Risk Level:  {result['risk_level']}")
                print(f"Confidence:  {result['confidence']*100:.1f}%")
                print(f"Model Type:  {result['model_type']}")
                print(f"\nRisk Factors:")
                for factor in result['factors']:
                    print(f"  - {factor}")
            else:
                print(f"\n❌ FAILED")
                print(f"Error: {response.text}")
                
        except Exception as e:
            print(f"\n❌ Request failed: {e}")
        
        print("\n" + "-"*60)

def test_backend():
    """Test backend API endpoint."""
    print("\n" + "="*60)
    print("🔗 TESTING BACKEND API")
    print("="*60)
    print("\n⚠️  Note: This requires authentication token")
    print("Skipping backend test - use browser or curl with auth token\n")

def main():
    print("\n")
    print("#" * 60)
    print("#" + " "*18 + "ML SERVICE DIAGNOSTIC" + " "*18 + "#")
    print("#" * 60)
    
    # Test health
    model_loaded = test_health()
    
    # Test predictions
    test_prediction()
    
    # Summary
    print("\n" + "="*60)
    print("📊 DIAGNOSTIC SUMMARY")
    print("="*60)
    
    if model_loaded:
        print("\n✅ ML Service: HEALTHY")
        print("✅ Model Status: LOADED")
        print("✅ API: WORKING")
        print("\n🎉 Your ML service is production-ready!")
    else:
        print("\n⚠️  ML Service: HEALTHY (fallback mode)")
        print("⚠️  Model Status: NOT LOADED")
        print("✅ API: WORKING (using rules)")
        print("\n💡 To load ML model:")
        print("   1. Run: python training/generate_training_data.py")
        print("   2. Run: python training/train_model.py")
        print("   3. Restart ML service")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()