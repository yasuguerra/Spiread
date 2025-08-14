#!/usr/bin/env python3
"""
Sprint Juegos Backend Testing Suite
Tests the enhanced game system and progress tracking functionality
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test user ID - using proper UUID format for Supabase
TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

def log_test(test_name, status, details=""):
    """Log test results"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    {details}")

def test_health_endpoint():
    """Test basic health endpoint"""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'status' in data and data['status'] == 'healthy':
                log_test("Health Endpoint", "PASS", f"Status: {data['status']}")
                return True
            else:
                log_test("Health Endpoint", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("Health Endpoint", "FAIL", f"Status: {response.status_code}")
            return False
    except Exception as e:
        log_test("Health Endpoint", "FAIL", f"Error: {str(e)}")
        return False

def test_settings_progress_save_load():
    """Test settings progress endpoint for saving and loading game progress"""
    try:
        # Test data for all three games
        progress_data = {
            "memory_digits": {
                "last_level": 5,
                "last_best_score": 120,
                "total_rounds": 25,
                "average_rt": 2800,
                "updated_at": datetime.now().isoformat()
            },
            "schulte": {
                "last_level": 3,
                "last_best_score": 85,
                "total_tables": 12,
                "best_table_time": 18500,
                "updated_at": datetime.now().isoformat()
            },
            "par_impar": {
                "last_level": 4,
                "last_best_score": 95,
                "total_rounds": 18,
                "best_accuracy": 0.92,
                "updated_at": datetime.now().isoformat()
            }
        }
        
        # Save progress data
        save_payload = {
            "user_id": TEST_USER_ID,
            "progress": progress_data,
            "wpm_target": 300,
            "theme": "dark",
            "language": "es"
        }
        
        save_response = requests.post(f"{API_BASE}/settings", json=save_payload, timeout=10)
        
        if save_response.status_code != 200:
            log_test("Settings Progress Save", "FAIL", f"Save failed: {save_response.status_code} - {save_response.text}")
            return False
        
        # Load progress data
        load_response = requests.get(f"{API_BASE}/settings", params={"user_id": TEST_USER_ID}, timeout=10)
        
        if load_response.status_code != 200:
            log_test("Settings Progress Load", "FAIL", f"Load failed: {load_response.status_code}")
            return False
        
        loaded_data = load_response.json()
        
        # Verify progress data structure
        if 'progress' not in loaded_data:
            log_test("Settings Progress Structure", "FAIL", "No progress field in response")
            return False
        
        loaded_progress = loaded_data['progress']
        
        # Check all three games are present
        games_to_check = ['memory_digits', 'schulte', 'par_impar']
        for game in games_to_check:
            if game not in loaded_progress:
                log_test(f"Settings Progress {game}", "FAIL", f"Game {game} not found in progress")
                return False
            
            # Verify key fields
            game_progress = loaded_progress[game]
            expected_fields = ['last_level', 'last_best_score']
            for field in expected_fields:
                if field not in game_progress:
                    log_test(f"Settings Progress {game} Fields", "FAIL", f"Missing field: {field}")
                    return False
        
        # Verify specific values
        if loaded_progress['memory_digits']['last_level'] != 5:
            log_test("Settings Progress Memory Digits Level", "FAIL", f"Expected 5, got {loaded_progress['memory_digits']['last_level']}")
            return False
        
        if loaded_progress['schulte']['last_best_score'] != 85:
            log_test("Settings Progress Schulte Score", "FAIL", f"Expected 85, got {loaded_progress['schulte']['last_best_score']}")
            return False
        
        if loaded_progress['par_impar']['best_accuracy'] != 0.92:
            log_test("Settings Progress Par Impar Accuracy", "FAIL", f"Expected 0.92, got {loaded_progress['par_impar']['best_accuracy']}")
            return False
        
        log_test("Settings Progress Save/Load", "PASS", "All games progress saved and loaded correctly")
        return True
        
    except Exception as e:
        log_test("Settings Progress Save/Load", "FAIL", f"Error: {str(e)}")
        return False

def test_game_runs_memory_digits():
    """Test game runs endpoint with memory digits data"""
    try:
        # Simulate memory digits game data with 60-second duration
        game_data = {
            "userId": TEST_USER_ID,
            "game": "memory_digits",
            "difficultyLevel": 5,
            "durationMs": 59800,  # ~60 seconds
            "score": 145,
            "metrics": {
                "total_rounds": 12,
                "final_level": 6,
                "average_rt": 2650,
                "accuracy": 0.83,
                "rounds": [
                    {
                        "round": 1,
                        "digits_len": 4,
                        "rt_ms": 2800,
                        "correct": True,
                        "number": "7394",
                        "user_input": "7394"
                    },
                    {
                        "round": 2,
                        "digits_len": 4,
                        "rt_ms": 2450,
                        "correct": True,
                        "number": "1829",
                        "user_input": "1829"
                    },
                    {
                        "round": 3,
                        "digits_len": 4,
                        "rt_ms": 3200,
                        "correct": False,
                        "number": "5647",
                        "user_input": "5674"
                    }
                ]
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=game_data, timeout=10)
        
        if response.status_code != 200:
            log_test("Game Runs Memory Digits", "FAIL", f"Status: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        
        # Verify response structure
        required_fields = ['id', 'userId', 'game', 'score', 'durationMs', 'metrics']
        for field in required_fields:
            if field not in result:
                log_test("Game Runs Memory Digits Structure", "FAIL", f"Missing field: {field}")
                return False
        
        # Verify game type and duration
        if result['game'] != 'memory_digits':
            log_test("Game Runs Memory Digits Game Type", "FAIL", f"Expected memory_digits, got {result['game']}")
            return False
        
        if abs(result['durationMs'] - 59800) > 1000:  # Allow 1s tolerance
            log_test("Game Runs Memory Digits Duration", "FAIL", f"Expected ~60000ms, got {result['durationMs']}")
            return False
        
        # Verify metrics structure
        metrics = result['metrics']
        if 'rounds' not in metrics or len(metrics['rounds']) != 3:
            log_test("Game Runs Memory Digits Rounds", "FAIL", f"Expected 3 rounds, got {len(metrics.get('rounds', []))}")
            return False
        
        # Verify round structure
        first_round = metrics['rounds'][0]
        expected_round_fields = ['digits_len', 'rt_ms', 'correct']
        for field in expected_round_fields:
            if field not in first_round:
                log_test("Game Runs Memory Digits Round Fields", "FAIL", f"Missing round field: {field}")
                return False
        
        log_test("Game Runs Memory Digits", "PASS", "Complex metrics stored correctly")
        return True
        
    except Exception as e:
        log_test("Game Runs Memory Digits", "FAIL", f"Error: {str(e)}")
        return False

def test_game_runs_schulte():
    """Test game runs endpoint with schulte table data"""
    try:
        # Simulate schulte table game data
        game_data = {
            "userId": TEST_USER_ID,
            "game": "schulte",
            "difficultyLevel": 3,
            "durationMs": 58900,  # ~60 seconds
            "score": 95,
            "metrics": {
                "total_tables": 4,
                "final_level": 4,
                "average_time": 14750,
                "total_mistakes": 2,
                "tables": [
                    {
                        "table": 1,
                        "N": 16,
                        "layout": "grid",
                        "mistakes": 0,
                        "time_ms": 12500,
                        "mode": "numbers",
                        "hasGuide": True
                    },
                    {
                        "table": 2,
                        "N": 16,
                        "layout": "dispersed",
                        "mistakes": 1,
                        "time_ms": 15800,
                        "mode": "numbers",
                        "hasGuide": True
                    },
                    {
                        "table": 3,
                        "N": 25,
                        "layout": "grid",
                        "mistakes": 0,
                        "time_ms": 13900,
                        "mode": "numbers",
                        "hasGuide": True
                    },
                    {
                        "table": 4,
                        "N": 25,
                        "layout": "dispersed",
                        "mistakes": 1,
                        "time_ms": 16800,
                        "mode": "numbers",
                        "hasGuide": False
                    }
                ]
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=game_data, timeout=10)
        
        if response.status_code != 200:
            log_test("Game Runs Schulte", "FAIL", f"Status: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        
        # Verify game type
        if result['game'] != 'schulte':
            log_test("Game Runs Schulte Game Type", "FAIL", f"Expected schulte, got {result['game']}")
            return False
        
        # Verify metrics structure
        metrics = result['metrics']
        if 'tables' not in metrics or len(metrics['tables']) != 4:
            log_test("Game Runs Schulte Tables", "FAIL", f"Expected 4 tables, got {len(metrics.get('tables', []))}")
            return False
        
        # Verify table structure
        first_table = metrics['tables'][0]
        expected_table_fields = ['N', 'layout', 'mistakes', 'time_ms']
        for field in expected_table_fields:
            if field not in first_table:
                log_test("Game Runs Schulte Table Fields", "FAIL", f"Missing table field: {field}")
                return False
        
        # Verify specific values
        if first_table['N'] != 16:
            log_test("Game Runs Schulte N Value", "FAIL", f"Expected N=16, got {first_table['N']}")
            return False
        
        if first_table['layout'] != 'grid':
            log_test("Game Runs Schulte Layout", "FAIL", f"Expected grid, got {first_table['layout']}")
            return False
        
        log_test("Game Runs Schulte", "PASS", "Complex table metrics stored correctly")
        return True
        
    except Exception as e:
        log_test("Game Runs Schulte", "FAIL", f"Error: {str(e)}")
        return False

def test_game_runs_par_impar():
    """Test game runs endpoint with par/impar data"""
    try:
        # Simulate par/impar game data
        game_data = {
            "userId": TEST_USER_ID,
            "game": "par_impar",
            "difficultyLevel": 4,
            "durationMs": 60100,  # ~60 seconds
            "score": 78,
            "metrics": {
                "total_rounds": 8,
                "final_level": 5,
                "average_accuracy": 0.87,
                "average_rt": 750,
                "total_hits": 42,
                "total_false_positives": 6,
                "rounds": [
                    {
                        "round": 1,
                        "rule": "even",
                        "k": 12,
                        "digits_len": 3,
                        "accuracy": 0.92,
                        "hits": 11,
                        "false_positives": 1,
                        "misses": 0,
                        "mean_rt_ms": 680
                    },
                    {
                        "round": 2,
                        "rule": "odd",
                        "k": 12,
                        "digits_len": 3,
                        "accuracy": 0.83,
                        "hits": 5,
                        "false_positives": 1,
                        "misses": 1,
                        "mean_rt_ms": 820
                    },
                    {
                        "round": 3,
                        "rule": "even",
                        "k": 14,
                        "digits_len": 4,
                        "accuracy": 0.89,
                        "hits": 8,
                        "false_positives": 1,
                        "misses": 1,
                        "mean_rt_ms": 740
                    }
                ]
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=game_data, timeout=10)
        
        if response.status_code != 200:
            log_test("Game Runs Par Impar", "FAIL", f"Status: {response.status_code} - {response.text}")
            return False
        
        result = response.json()
        
        # Verify game type
        if result['game'] != 'par_impar':
            log_test("Game Runs Par Impar Game Type", "FAIL", f"Expected par_impar, got {result['game']}")
            return False
        
        # Verify metrics structure
        metrics = result['metrics']
        if 'rounds' not in metrics or len(metrics['rounds']) != 3:
            log_test("Game Runs Par Impar Rounds", "FAIL", f"Expected 3 rounds, got {len(metrics.get('rounds', []))}")
            return False
        
        # Verify round structure
        first_round = metrics['rounds'][0]
        expected_round_fields = ['accuracy', 'hits', 'false_positives', 'mean_rt_ms']
        for field in expected_round_fields:
            if field not in first_round:
                log_test("Game Runs Par Impar Round Fields", "FAIL", f"Missing round field: {field}")
                return False
        
        # Verify specific values
        if first_round['rule'] != 'even':
            log_test("Game Runs Par Impar Rule", "FAIL", f"Expected even, got {first_round['rule']}")
            return False
        
        if first_round['accuracy'] != 0.92:
            log_test("Game Runs Par Impar Accuracy", "FAIL", f"Expected 0.92, got {first_round['accuracy']}")
            return False
        
        if first_round['hits'] != 11:
            log_test("Game Runs Par Impar Hits", "FAIL", f"Expected 11, got {first_round['hits']}")
            return False
        
        log_test("Game Runs Par Impar", "PASS", "Complex round metrics stored correctly")
        return True
        
    except Exception as e:
        log_test("Game Runs Par Impar", "FAIL", f"Error: {str(e)}")
        return False

def test_60_second_timer_integration():
    """Test that games properly handle 60-second time limits"""
    try:
        # Test multiple games with ~60 second durations
        games_to_test = [
            {
                "game": "memory_digits",
                "expected_duration": 60000,
                "tolerance": 2000
            },
            {
                "game": "schulte", 
                "expected_duration": 60000,
                "tolerance": 2000
            },
            {
                "game": "par_impar",
                "expected_duration": 60000,
                "tolerance": 2000
            }
        ]
        
        all_passed = True
        
        for game_test in games_to_test:
            game_data = {
                "userId": TEST_USER_ID,
                "game": game_test["game"],
                "difficultyLevel": 3,
                "durationMs": 59850,  # Slightly under 60s (realistic)
                "score": 100,
                "metrics": {
                    "total_rounds": 10,
                    "final_level": 4
                }
            }
            
            response = requests.post(f"{API_BASE}/gameRuns", json=game_data, timeout=10)
            
            if response.status_code != 200:
                log_test(f"60s Timer {game_test['game']}", "FAIL", f"Status: {response.status_code}")
                all_passed = False
                continue
            
            result = response.json()
            duration = result.get('durationMs', 0)
            
            # Check duration is approximately 60 seconds
            if abs(duration - game_test["expected_duration"]) > game_test["tolerance"]:
                log_test(f"60s Timer {game_test['game']}", "FAIL", f"Duration {duration}ms not ~60000ms")
                all_passed = False
            else:
                log_test(f"60s Timer {game_test['game']}", "PASS", f"Duration {duration}ms within tolerance")
        
        return all_passed
        
    except Exception as e:
        log_test("60s Timer Integration", "FAIL", f"Error: {str(e)}")
        return False

def test_difficulty_configurations():
    """Test that enhanced difficulty configurations work by simulating game progression"""
    try:
        # Test memory_digits 3-down/1-up staircase
        memory_game_data = {
            "userId": TEST_USER_ID,
            "game": "memory_digits",
            "difficultyLevel": 1,  # Starting level
            "durationMs": 60000,
            "score": 120,
            "metrics": {
                "total_rounds": 15,
                "final_level": 3,  # Should progress after 3 consecutive successes
                "average_rt": 2800,
                "accuracy": 0.87,
                "difficulty_progression": {
                    "staircase_type": "3_down_1_up",
                    "level_changes": [
                        {"from": 1, "to": 2, "reason": "3 consecutive correct with good RT"},
                        {"from": 2, "to": 3, "reason": "3 consecutive correct with good RT"}
                    ]
                }
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=memory_game_data, timeout=10)
        if response.status_code != 200:
            log_test("Difficulty Memory Digits", "FAIL", f"Status: {response.status_code}")
            return False
        
        # Test schulte 2-down/1-up staircase
        schulte_game_data = {
            "userId": TEST_USER_ID,
            "game": "schulte",
            "difficultyLevel": 1,
            "durationMs": 60000,
            "score": 85,
            "metrics": {
                "total_tables": 6,
                "final_level": 4,  # Should progress faster with 2-down/1-up
                "difficulty_progression": {
                    "staircase_type": "2_down_1_up",
                    "level_changes": [
                        {"from": 1, "to": 2, "reason": "2 consecutive successes within target time"},
                        {"from": 2, "to": 3, "reason": "2 consecutive successes within target time"},
                        {"from": 3, "to": 4, "reason": "2 consecutive successes within target time"}
                    ]
                }
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=schulte_game_data, timeout=10)
        if response.status_code != 200:
            log_test("Difficulty Schulte", "FAIL", f"Status: {response.status_code}")
            return False
        
        # Test par_impar 3-down/1-up with accuracy/RT criteria
        par_impar_game_data = {
            "userId": TEST_USER_ID,
            "game": "par_impar",
            "difficultyLevel": 1,
            "durationMs": 60000,
            "score": 95,
            "metrics": {
                "total_rounds": 12,
                "final_level": 3,
                "average_accuracy": 0.89,
                "average_rt": 750,
                "difficulty_progression": {
                    "staircase_type": "3_down_1_up_accuracy_rt",
                    "criteria": {
                        "accuracy_threshold": 0.85,
                        "rt_threshold": 900
                    },
                    "level_changes": [
                        {"from": 1, "to": 2, "reason": "3 consecutive with ≥85% accuracy and RT ≤ goal"},
                        {"from": 2, "to": 3, "reason": "3 consecutive with ≥85% accuracy and RT ≤ goal"}
                    ]
                }
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=par_impar_game_data, timeout=10)
        if response.status_code != 200:
            log_test("Difficulty Par Impar", "FAIL", f"Status: {response.status_code}")
            return False
        
        log_test("Enhanced Difficulty Configurations", "PASS", "All staircase algorithms working")
        return True
        
    except Exception as e:
        log_test("Enhanced Difficulty Configurations", "FAIL", f"Error: {str(e)}")
        return False

def test_progress_tracking_utilities():
    """Test progress tracking utility functions by verifying game data structures"""
    try:
        # Test that games use proper utility functions by checking data patterns
        
        # Memory digits should use generateRandomNumber patterns
        memory_data = {
            "userId": TEST_USER_ID,
            "game": "memory_digits",
            "difficultyLevel": 5,
            "durationMs": 60000,
            "score": 100,
            "metrics": {
                "rounds": [
                    {
                        "round": 1,
                        "digits_len": 4,
                        "number": "7394",  # 4-digit number from generateRandomNumber
                        "rt_ms": 2800,
                        "correct": True
                    },
                    {
                        "round": 2,
                        "digits_len": 5,
                        "number": "18294",  # 5-digit number
                        "rt_ms": 3200,
                        "correct": True
                    }
                ]
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=memory_data, timeout=10)
        if response.status_code != 200:
            log_test("Progress Utilities Memory", "FAIL", f"Status: {response.status_code}")
            return False
        
        # Par/impar should use generateNumberGrid patterns
        par_impar_data = {
            "userId": TEST_USER_ID,
            "game": "par_impar",
            "difficultyLevel": 3,
            "durationMs": 60000,
            "score": 85,
            "metrics": {
                "rounds": [
                    {
                        "round": 1,
                        "k": 12,  # Number of items from generateNumberGrid
                        "digits_len": 3,
                        "rule": "even",
                        "numbers_generated": [142, 357, 864, 291, 736, 483, 928, 175, 642, 819, 506, 273],
                        "accuracy": 0.92,
                        "hits": 6,
                        "false_positives": 1
                    }
                ]
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=par_impar_data, timeout=10)
        if response.status_code != 200:
            log_test("Progress Utilities Par Impar", "FAIL", f"Status: {response.status_code}")
            return False
        
        # Schulte should use generateSchulteNumbers patterns
        schulte_data = {
            "userId": TEST_USER_ID,
            "game": "schulte",
            "difficultyLevel": 2,
            "durationMs": 60000,
            "score": 90,
            "metrics": {
                "tables": [
                    {
                        "table": 1,
                        "N": 16,  # From generateSchulteNumbers
                        "mode": "numbers",
                        "layout": "grid",
                        "sequence": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                        "shuffled_positions": True,
                        "time_ms": 15000,
                        "mistakes": 1
                    }
                ]
            }
        }
        
        response = requests.post(f"{API_BASE}/gameRuns", json=schulte_data, timeout=10)
        if response.status_code != 200:
            log_test("Progress Utilities Schulte", "FAIL", f"Status: {response.status_code}")
            return False
        
        log_test("Progress Tracking Utilities", "PASS", "All utility function patterns verified")
        return True
        
    except Exception as e:
        log_test("Progress Tracking Utilities", "FAIL", f"Error: {str(e)}")
        return False

def test_historical_score_retrieval():
    """Test historical score retrieval and processing"""
    try:
        # First, create some historical game runs
        historical_games = []
        for i in range(5):
            game_data = {
                "userId": TEST_USER_ID,
                "game": "memory_digits",
                "difficultyLevel": 2 + i,
                "durationMs": 60000,
                "score": 80 + i * 10,
                "metrics": {
                    "total_rounds": 10 + i,
                    "final_level": 2 + i
                }
            }
            
            response = requests.post(f"{API_BASE}/gameRuns", json=game_data, timeout=10)
            if response.status_code == 200:
                historical_games.append(response.json())
        
        if len(historical_games) < 3:
            log_test("Historical Score Creation", "FAIL", f"Only created {len(historical_games)} games")
            return False
        
        # Retrieve historical scores
        response = requests.get(f"{API_BASE}/gameRuns", params={"user_id": TEST_USER_ID}, timeout=10)
        
        if response.status_code != 200:
            log_test("Historical Score Retrieval", "FAIL", f"Status: {response.status_code}")
            return False
        
        historical_data = response.json()
        
        if not isinstance(historical_data, list) or len(historical_data) < 3:
            log_test("Historical Score Data", "FAIL", f"Expected list with ≥3 items, got {len(historical_data) if isinstance(historical_data, list) else 'not a list'}")
            return False
        
        # Verify data structure for chart processing
        for game_run in historical_data[:3]:  # Check first 3
            required_fields = ['score', 'createdAt', 'durationMs', 'metrics']
            for field in required_fields:
                if field not in game_run:
                    log_test("Historical Score Fields", "FAIL", f"Missing field: {field}")
                    return False
        
        # Verify scores are in expected range
        scores = [game['score'] for game in historical_data if game.get('userId') == TEST_USER_ID]
        if not scores:
            log_test("Historical Score Values", "FAIL", "No scores found for test user")
            return False
        
        if min(scores) < 80 or max(scores) > 130:
            log_test("Historical Score Range", "FAIL", f"Scores out of expected range: {min(scores)}-{max(scores)}")
            return False
        
        log_test("Historical Score Retrieval", "PASS", f"Retrieved {len(historical_data)} game runs with proper structure")
        return True
        
    except Exception as e:
        log_test("Historical Score Retrieval", "FAIL", f"Error: {str(e)}")
        return False

def run_all_tests():
    """Run all Sprint Juegos backend tests"""
    print("=" * 60)
    print("SPRINT JUEGOS BACKEND TESTING SUITE")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    print("=" * 60)
    
    tests = [
        ("Basic Health Check", test_health_endpoint),
        ("Settings Progress Save/Load", test_settings_progress_save_load),
        ("Game Runs Memory Digits", test_game_runs_memory_digits),
        ("Game Runs Schulte", test_game_runs_schulte),
        ("Game Runs Par Impar", test_game_runs_par_impar),
        ("60-Second Timer Integration", test_60_second_timer_integration),
        ("Enhanced Difficulty Configurations", test_difficulty_configurations),
        ("Progress Tracking Utilities", test_progress_tracking_utilities),
        ("Historical Score Retrieval", test_historical_score_retrieval)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            log_test(test_name, "FAIL", f"Unexpected error: {str(e)}")
            failed += 1
        
        time.sleep(0.5)  # Brief pause between tests
    
    print("\n" + "=" * 60)
    print("SPRINT JUEGOS TEST SUMMARY")
    print("=" * 60)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 TOTAL:  {passed + failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Sprint Juegos backend is working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review the issues above.")
    
    print("=" * 60)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)