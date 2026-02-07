#!/usr/bin/env python3

import requests
import json
from datetime import datetime, date, timedelta
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "https://workout-logger-102.preview.emergentagent.com/api"
session = requests.Session()
session.headers.update({"Content-Type": "application/json"})

# Test data
def get_sample_workout():
    return {
        "date": "2025-01-15",
        "exercises": [
            {
                "name": "Bench Press",
                "category": "Chest",
                "sets": [
                    {"reps": 10, "weight": 60.0, "completed": True},
                    {"reps": 8, "weight": 70.0, "completed": True},
                    {"reps": 6, "weight": 75.0, "completed": True}
                ]
            },
            {
                "name": "Squats", 
                "category": "Legs",
                "sets": [
                    {"reps": 12, "weight": 80.0, "completed": True},
                    {"reps": 10, "weight": 90.0, "completed": True}
                ]
            }
        ],
        "duration": 45,
        "notes": "Great workout session with personal records"
    }

def get_sample_workout_2():
    return {
        "date": "2025-01-14",
        "exercises": [
            {
                "name": "Deadlifts",
                "category": "Back", 
                "sets": [
                    {"reps": 5, "weight": 100.0, "completed": True},
                    {"reps": 5, "weight": 110.0, "completed": True}
                ]
            }
        ],
        "duration": 30,
        "notes": "Back day focus"
    }

def get_sample_steps():
    return {
        "date": "2025-01-15",
        "steps": 8500
    }

class TestResults:
    def __init__(self):
        self.results = {
            "workout_crud": {"passed": 0, "failed": 0, "errors": []},
            "exercise_library": {"passed": 0, "failed": 0, "errors": []},
            "step_tracking": {"passed": 0, "failed": 0, "errors": []}, 
            "statistics": {"passed": 0, "failed": 0, "errors": []}
        }
        self.created_workout_ids = []
    
    def add_pass(self, category: str, test_name: str):
        self.results[category]["passed"] += 1
        print(f"✅ {test_name}")
    
    def add_fail(self, category: str, test_name: str, error: str):
        self.results[category]["failed"] += 1
        self.results[category]["errors"].append(f"{test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def print_summary(self):
        print("\n" + "="*60)
        print("FITNESS TRACKING BACKEND API TEST RESULTS")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"\n{category.upper().replace('_', ' ')}: {status}")
            print(f"  Passed: {passed}, Failed: {failed}")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"  - {error}")
        
        print(f"\nOVERALL: {total_passed} passed, {total_failed} failed")
        return total_failed == 0

def test_api_health():
    """Test if the API is responding"""
    try:
        response = session.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ API Health Check: Backend is responding")
            return True
        else:
            print(f"❌ API Health Check: Got status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Health Check: Connection failed - {e}")
        return False

def test_workout_crud(test_results: TestResults):
    """Test Workout CRUD operations"""
    print("\n--- TESTING WORKOUT CRUD API ---")
    
    # Test 1: Create workout
    try:
        workout_data = get_sample_workout()
        response = session.post(f"{BASE_URL}/workouts", json=workout_data)
        
        if response.status_code == 200:
            workout = response.json()
            if "_id" in workout and workout["date"] == workout_data["date"]:
                test_results.created_workout_ids.append(workout["_id"])
                test_results.add_pass("workout_crud", "POST /api/workouts - Create workout")
            else:
                test_results.add_fail("workout_crud", "POST /api/workouts", "Invalid response format")
        else:
            test_results.add_fail("workout_crud", "POST /api/workouts", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        test_results.add_fail("workout_crud", "POST /api/workouts", str(e))
    
    # Test 2: Get all workouts
    try:
        response = session.get(f"{BASE_URL}/workouts")
        
        if response.status_code == 200:
            workouts = response.json()
            if isinstance(workouts, list):
                test_results.add_pass("workout_crud", "GET /api/workouts - List workouts")
            else:
                test_results.add_fail("workout_crud", "GET /api/workouts", "Response is not a list")
        else:
            test_results.add_fail("workout_crud", "GET /api/workouts", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("workout_crud", "GET /api/workouts", str(e))
    
    # Test 3: Get workout by ID (if we created one)
    if test_results.created_workout_ids:
        try:
            workout_id = test_results.created_workout_ids[0]
            response = session.get(f"{BASE_URL}/workouts/{workout_id}")
            
            if response.status_code == 200:
                workout = response.json()
                if "_id" in workout and workout["_id"] == workout_id:
                    test_results.add_pass("workout_crud", "GET /api/workouts/{id} - Get specific workout")
                else:
                    test_results.add_fail("workout_crud", "GET /api/workouts/{id}", "Invalid response format")
            else:
                test_results.add_fail("workout_crud", "GET /api/workouts/{id}", f"Status {response.status_code}")
        except Exception as e:
            test_results.add_fail("workout_crud", "GET /api/workouts/{id}", str(e))
    
    # Test 4: Update workout (if we created one)
    if test_results.created_workout_ids:
        try:
            workout_id = test_results.created_workout_ids[0]
            updated_data = get_sample_workout()
            updated_data["notes"] = "Updated workout notes - testing PUT endpoint"
            updated_data["duration"] = 60
            
            response = session.put(f"{BASE_URL}/workouts/{workout_id}", json=updated_data)
            
            if response.status_code == 200:
                workout = response.json()
                if workout["notes"] == updated_data["notes"] and workout["duration"] == 60:
                    test_results.add_pass("workout_crud", "PUT /api/workouts/{id} - Update workout")
                else:
                    test_results.add_fail("workout_crud", "PUT /api/workouts/{id}", "Update not reflected")
            else:
                test_results.add_fail("workout_crud", "PUT /api/workouts/{id}", f"Status {response.status_code}")
        except Exception as e:
            test_results.add_fail("workout_crud", "PUT /api/workouts/{id}", str(e))
    
    # Test 5: Date range filter
    try:
        start_date = "2025-01-01"
        end_date = "2025-01-31"
        response = session.get(f"{BASE_URL}/workouts?start_date={start_date}&end_date={end_date}")
        
        if response.status_code == 200:
            workouts = response.json()
            if isinstance(workouts, list):
                test_results.add_pass("workout_crud", "GET /api/workouts with date filters")
            else:
                test_results.add_fail("workout_crud", "GET /api/workouts date filter", "Response is not a list")
        else:
            test_results.add_fail("workout_crud", "GET /api/workouts date filter", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("workout_crud", "GET /api/workouts date filter", str(e))

def test_exercise_library(test_results: TestResults):
    """Test Exercise Library API"""
    print("\n--- TESTING EXERCISE LIBRARY API ---")
    
    try:
        response = session.get(f"{BASE_URL}/exercises")
        
        if response.status_code == 200:
            exercises = response.json()
            
            if isinstance(exercises, list) and len(exercises) >= 18:
                # Check if exercises have required fields
                sample_exercise = exercises[0]
                if "name" in sample_exercise and "category" in sample_exercise:
                    # Check if we have exercises from different categories
                    categories = set(ex.get("category") for ex in exercises)
                    expected_categories = {"Chest", "Legs", "Back", "Shoulders", "Arms", "Core"}
                    
                    if expected_categories.issubset(categories):
                        test_results.add_pass("exercise_library", "GET /api/exercises - Complete exercise library")
                    else:
                        test_results.add_fail("exercise_library", "GET /api/exercises", f"Missing categories. Got: {categories}")
                else:
                    test_results.add_fail("exercise_library", "GET /api/exercises", "Exercises missing required fields")
            else:
                test_results.add_fail("exercise_library", "GET /api/exercises", f"Expected >=18 exercises, got {len(exercises) if isinstance(exercises, list) else 'non-list'}")
        else:
            test_results.add_fail("exercise_library", "GET /api/exercises", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("exercise_library", "GET /api/exercises", str(e))

def test_step_tracking(test_results: TestResults):
    """Test Step Tracking API"""
    print("\n--- TESTING STEP TRACKING API ---")
    
    # Test 1: Log steps
    try:
        step_data = get_sample_steps()
        response = session.post(f"{BASE_URL}/steps", json=step_data)
        
        if response.status_code == 200:
            result = response.json()
            if "message" in result and result.get("steps") == step_data["steps"]:
                test_results.add_pass("step_tracking", "POST /api/steps - Log steps")
            else:
                test_results.add_fail("step_tracking", "POST /api/steps", "Invalid response format")
        else:
            test_results.add_fail("step_tracking", "POST /api/steps", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("step_tracking", "POST /api/steps", str(e))
    
    # Test 2: Upsert functionality (log steps for same date again)
    try:
        updated_step_data = {"date": "2025-01-15", "steps": 12000}
        response = session.post(f"{BASE_URL}/steps", json=updated_step_data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("steps") == 12000:
                test_results.add_pass("step_tracking", "POST /api/steps - Upsert functionality")
            else:
                test_results.add_fail("step_tracking", "POST /api/steps upsert", "Upsert not working correctly")
        else:
            test_results.add_fail("step_tracking", "POST /api/steps upsert", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("step_tracking", "POST /api/steps upsert", str(e))
    
    # Test 3: Get steps
    try:
        response = session.get(f"{BASE_URL}/steps")
        
        if response.status_code == 200:
            steps = response.json()
            if isinstance(steps, list):
                test_results.add_pass("step_tracking", "GET /api/steps - Retrieve steps")
            else:
                test_results.add_fail("step_tracking", "GET /api/steps", "Response is not a list")
        else:
            test_results.add_fail("step_tracking", "GET /api/steps", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("step_tracking", "GET /api/steps", str(e))
    
    # Test 4: Get steps with date filter
    try:
        start_date = "2025-01-01"
        end_date = "2025-01-31"
        response = session.get(f"{BASE_URL}/steps?start_date={start_date}&end_date={end_date}")
        
        if response.status_code == 200:
            steps = response.json()
            if isinstance(steps, list):
                test_results.add_pass("step_tracking", "GET /api/steps with date filters")
            else:
                test_results.add_fail("step_tracking", "GET /api/steps date filter", "Response is not a list")
        else:
            test_results.add_fail("step_tracking", "GET /api/steps date filter", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("step_tracking", "GET /api/steps date filter", str(e))

def test_statistics(test_results: TestResults):
    """Test Statistics API"""
    print("\n--- TESTING STATISTICS API ---")
    
    try:
        response = session.get(f"{BASE_URL}/workouts/stats/summary")
        
        if response.status_code == 200:
            stats = response.json()
            
            required_fields = [
                "total_workouts", "total_duration", "workouts_this_week", 
                "workouts_this_month", "total_steps_today"
            ]
            
            missing_fields = [field for field in required_fields if field not in stats]
            
            if not missing_fields:
                # Check if values are reasonable numbers
                if all(isinstance(stats[field], int) and stats[field] >= 0 for field in required_fields):
                    test_results.add_pass("statistics", "GET /api/workouts/stats/summary - Complete stats")
                else:
                    test_results.add_fail("statistics", "GET /api/workouts/stats/summary", "Invalid field values")
            else:
                test_results.add_fail("statistics", "GET /api/workouts/stats/summary", f"Missing fields: {missing_fields}")
        else:
            test_results.add_fail("statistics", "GET /api/workouts/stats/summary", f"Status {response.status_code}")
    except Exception as e:
        test_results.add_fail("statistics", "GET /api/workouts/stats/summary", str(e))

def cleanup_test_data(test_results: TestResults):
    """Clean up created test data"""
    print("\n--- CLEANING UP TEST DATA ---")
    
    for workout_id in test_results.created_workout_ids:
        try:
            response = session.delete(f"{BASE_URL}/workouts/{workout_id}")
            if response.status_code == 200:
                print(f"✅ Deleted workout {workout_id}")
                test_results.add_pass("workout_crud", "DELETE /api/workouts/{id} - Delete workout")
            else:
                test_results.add_fail("workout_crud", "DELETE /api/workouts/{id}", f"Status {response.status_code}")
        except Exception as e:
            test_results.add_fail("workout_crud", "DELETE /api/workouts/{id}", str(e))

def main():
    print("Starting Fitness Tracking Backend API Tests...")
    print(f"Testing against: {BASE_URL}")
    
    # Check API health first
    if not test_api_health():
        print("❌ Backend API is not responding. Exiting tests.")
        sys.exit(1)
    
    test_results = TestResults()
    
    # Run all tests
    test_workout_crud(test_results)
    test_exercise_library(test_results) 
    test_step_tracking(test_results)
    test_statistics(test_results)
    
    # Clean up test data
    cleanup_test_data(test_results)
    
    # Print summary
    success = test_results.print_summary()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n💥 SOME TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    main()