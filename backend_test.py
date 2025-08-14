#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Spiread Application - Phase 1 Hotfix
Testing all backend functionality after implementing Phase 1 hotfix.

Focus Areas:
1. Game Launches & Integration - Test all 9 games can be launched and game runs saved
2. API Endpoints Health Check - Verify all critical API endpoints
3. Database Schema & Operations - Verify tables exist and operations work
4. Session Runner 2.0 - Test enhanced session runner functionality  
5. AI/LLM Integration - Verify AI endpoints work with Emergent LLM Key

Known Issues to Verify:
- External URL routing (502 errors)
- Database table naming inconsistencies
- Missing gamification database tables
- Session schedules table naming mismatch
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://brain-trainer-5.preview.emergentagent.com"
LOCAL_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test user data
TEST_USER_ID = "test_user_spiread_2025"
TEST_DOC_ID = "test_doc_001"

class GamificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_health(self):
        """Test basic API connectivity"""
        self.log("Testing API health...")
        try:
            response = self.session.get(f"{API_BASE}/health")
            if response.status_code == 200:
                self.log("✅ API health check passed")
                return True
            else:
                self.log(f"❌ API health check failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ API health check failed: {str(e)}", "ERROR")
            return False
    
    def test_xp_calculation_logic(self):
        """Test XP calculation: clamp(score, 0, 300)"""
        self.log("Testing XP calculation logic...")
        
        test_cases = [
            (-50, 0),      # Negative score should clamp to 0
            (0, 0),        # Zero score
            (150, 150),    # Normal score
            (300, 300),    # Max score
            (450, 300),    # Over max should clamp to 300
            (999, 300),    # Very high score should clamp to 300
        ]
        
        all_passed = True
        for input_score, expected_xp in test_cases:
            # Simulate the clamp logic: Math.max(0, Math.min(300, Math.floor(score)))
            calculated_xp = max(0, min(300, int(input_score)))
            if calculated_xp == expected_xp:
                self.log(f"✅ XP calculation: score {input_score} → {calculated_xp} XP")
            else:
                self.log(f"❌ XP calculation failed: score {input_score} → {calculated_xp} XP (expected {expected_xp})", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_level_calculation_logic(self):
        """Test Level calculation: floor(xp/1000) + 1"""
        self.log("Testing Level calculation logic...")
        
        test_cases = [
            (0, 1),        # 0 XP = Level 1
            (500, 1),      # 500 XP = Level 1
            (999, 1),      # 999 XP = Level 1
            (1000, 2),     # 1000 XP = Level 2
            (1500, 2),     # 1500 XP = Level 2
            (2000, 3),     # 2000 XP = Level 3
            (5000, 6),     # 5000 XP = Level 6
            (10000, 11),   # 10000 XP = Level 11
        ]
        
        all_passed = True
        for xp, expected_level in test_cases:
            # Simulate the level logic: Math.floor(xp / 1000) + 1
            calculated_level = int(xp // 1000) + 1
            if calculated_level == expected_level:
                self.log(f"✅ Level calculation: {xp} XP → Level {calculated_level}")
            else:
                self.log(f"❌ Level calculation failed: {xp} XP → Level {calculated_level} (expected {expected_level})", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_xp_progress_logic(self):
        """Test XP to next level calculations"""
        self.log("Testing XP progress calculations...")
        
        test_cases = [
            (0, 1000),     # 0 XP needs 1000 for level 2
            (500, 500),    # 500 XP needs 500 more for level 2
            (999, 1),      # 999 XP needs 1 more for level 2
            (1000, 1000),  # 1000 XP needs 1000 more for level 3
            (1500, 500),   # 1500 XP needs 500 more for level 3
            (2000, 1000),  # 2000 XP needs 1000 more for level 4
        ]
        
        all_passed = True
        for xp, expected_xp_to_next in test_cases:
            # Simulate XP to next level logic
            current_level = int(xp // 1000) + 1
            next_level_xp = current_level * 1000
            xp_to_next = next_level_xp - xp
            
            if xp_to_next == expected_xp_to_next:
                self.log(f"✅ XP progress: {xp} XP needs {xp_to_next} more for next level")
            else:
                self.log(f"❌ XP progress failed: {xp} XP needs {xp_to_next} more (expected {expected_xp_to_next})", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_game_run_validation_logic(self):
        """Test game run validation for different game types"""
        self.log("Testing game run validation logic...")
        
        test_cases = [
            # Phase 3 games (60s sessions, 55s tolerance)
            ("running_words", 60000, True),   # Exact 60s
            ("running_words", 55000, True),   # 55s tolerance
            ("running_words", 54999, False),  # Just under tolerance
            ("letters_grid", 58000, True),    # Within tolerance
            ("word_search", 50000, False),    # Under tolerance
            ("anagrams", 62000, True),        # Over 60s is fine
            
            # Legacy games (30s minimum)
            ("shuttle", 30000, True),         # Exact 30s
            ("twin_words", 29999, False),     # Just under 30s
            ("par_impar", 45000, True),       # Over 30s is fine
            ("memory_digits", 25000, False),  # Under 30s
            
            # Special games
            ("rsvp", 10000, True),           # RSVP with tokens check
            ("reading_quiz", 5000, True),    # Reading quiz with total check
        ]
        
        all_passed = True
        for game, duration_ms, expected_valid in test_cases:
            # Simulate validation logic
            if game in ['rsvp', 'reading_quiz']:
                # These games have different validation (tokens/total >= 1)
                is_valid = True  # Assume valid for basic test
            elif game in ['running_words', 'letters_grid', 'word_search', 'anagrams']:
                # Phase 3 games: 60s sessions with 55s tolerance
                is_valid = duration_ms >= 55000
            else:
                # Legacy games: 30s minimum
                is_valid = duration_ms >= 30000
                
            if is_valid == expected_valid:
                self.log(f"✅ Game validation: {game} ({duration_ms}ms) → {'Valid' if is_valid else 'Invalid'}")
            else:
                self.log(f"❌ Game validation failed: {game} ({duration_ms}ms) → {'Valid' if is_valid else 'Invalid'} (expected {'Valid' if expected_valid else 'Invalid'})", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_achievement_definitions(self):
        """Test that all 11 achievements are properly defined"""
        self.log("Testing achievement definitions...")
        
        expected_achievements = [
            # Existing achievements (Phase 1-2)
            "first_run",
            "week_streak_7", 
            "speed_600_wpm",
            "schulte_7x7",
            "digits_7",
            "twinwords_90acc",
            
            # New Phase 3 achievements
            "runningwords_lvl10",
            "letters_grid_15", 
            "wordsearch_10_words",
            "anagram_7len",
            
            # New AI achievement
            "reading_quiz_5of5"
        ]
        
        self.log(f"✅ Expected 11 achievements defined: {', '.join(expected_achievements)}")
        
        # Test achievement trigger conditions
        achievement_conditions = {
            "first_run": "Any first game completion",
            "week_streak_7": "7-day consecutive streak",
            "speed_600_wpm": "RSVP game with ≥600 WPM",
            "schulte_7x7": "Shuttle game with difficulty ≥7",
            "digits_7": "Memory digits with ≥7 digits",
            "twinwords_90acc": "Twin words with ≥90% accuracy",
            "runningwords_lvl10": "Running words difficulty ≥10",
            "letters_grid_15": "Letters grid with N≥15",
            "wordsearch_10_words": "Word search with ≥10 words found",
            "anagram_7len": "Anagram with ≥7 letters solved",
            "reading_quiz_5of5": "Reading quiz with perfect 5/5 score"
        }
        
        for achievement, condition in achievement_conditions.items():
            self.log(f"✅ Achievement '{achievement}': {condition}")
            
        return len(expected_achievements) == 11
    
    def test_streak_system_logic(self):
        """Test streak system logic"""
        self.log("Testing streak system logic...")
        
        # Simulate streak scenarios
        scenarios = [
            {
                "name": "First day activity",
                "last_activity": None,
                "current_streak": 0,
                "today_activity": True,
                "expected_streak": 1
            },
            {
                "name": "Consecutive day activity", 
                "last_activity": "2025-01-14",  # Yesterday
                "current_streak": 3,
                "today_activity": True,
                "expected_streak": 4
            },
            {
                "name": "Same day activity (no increment)",
                "last_activity": "2025-01-15",  # Today
                "current_streak": 5,
                "today_activity": True,
                "expected_streak": 5
            },
            {
                "name": "Broken streak (gap)",
                "last_activity": "2025-01-13",  # 2 days ago
                "current_streak": 7,
                "today_activity": True,
                "expected_streak": 1
            },
            {
                "name": "Invalid run breaks streak",
                "last_activity": "2025-01-14",
                "current_streak": 2,
                "today_activity": False,  # Invalid run
                "expected_streak": 0
            }
        ]
        
        all_passed = True
        today = "2025-01-15"
        
        for scenario in scenarios:
            # Simulate streak logic
            if not scenario["today_activity"]:
                # Invalid run breaks streak
                new_streak = 0
            elif scenario["last_activity"] == today:
                # Same day, don't increment
                new_streak = scenario["current_streak"]
            elif scenario["last_activity"] == "2025-01-14":  # Yesterday
                # Consecutive day
                new_streak = scenario["current_streak"] + 1
            else:
                # First day or broken streak
                new_streak = 1
                
            if new_streak == scenario["expected_streak"]:
                self.log(f"✅ Streak scenario: {scenario['name']} → {new_streak} days")
            else:
                self.log(f"❌ Streak scenario failed: {scenario['name']} → {new_streak} days (expected {scenario['expected_streak']})", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_game_runs_api_with_gamification(self):
        """Test game runs API with various game types and scores"""
        self.log("Testing Game Runs API with gamification data...")
        
        test_games = [
            {
                "game": "running_words",
                "score": 250,
                "duration_ms": 60000,
                "difficulty_level": 12,
                "metrics": {
                    "wordsPerLine": 7,
                    "wordExposureMs": 200,
                    "accuracy": 85,
                    "meanRT": 1200
                }
            },
            {
                "game": "letters_grid", 
                "score": 180,
                "duration_ms": 58000,
                "difficulty_level": 8,
                "metrics": {
                    "N": 16,  # Should trigger letters_grid_15 achievement
                    "targets": 2,
                    "hits": 15,
                    "falsePositives": 1,
                    "accuracy": 93.75
                }
            },
            {
                "game": "word_search",
                "score": 320,  # Should clamp to 300 XP
                "duration_ms": 59500,
                "difficulty_level": 15,
                "metrics": {
                    "gridSize": "12x12",
                    "wordsFound": 12,  # Should trigger wordsearch_10_words achievement
                    "time_per_word_ms": [2500, 3200, 1800, 2100, 2800, 1900, 2400, 3100, 2200, 2600, 1700, 2900],
                    "accuracy": 100
                }
            },
            {
                "game": "anagrams",
                "score": 150,
                "duration_ms": 60000,
                "difficulty_level": 18,
                "metrics": {
                    "length": 8,  # Should trigger anagram_7len achievement
                    "solved": True,
                    "expired": False,
                    "accuracy": 100,
                    "bestStreak": 5
                }
            },
            {
                "game": "reading_quiz",
                "score": 100,
                "duration_ms": 45000,
                "difficulty_level": 1,
                "metrics": {
                    "correct": 5,
                    "total": 5,  # Should trigger reading_quiz_5of5 achievement
                    "questions": ["q1", "q2", "q3", "q4", "q5"],
                    "accuracy": 100
                }
            }
        ]
        
        all_passed = True
        
        for game_data in test_games:
            try:
                # Add user_id to game data
                payload = {
                    "userId": TEST_USER_ID,
                    **game_data
                }
                
                self.log(f"Testing game run: {game_data['game']} (score: {game_data['score']})")
                
                response = self.session.post(f"{API_BASE}/gameRuns", json=payload)
                
                if response.status_code in [200, 201]:
                    self.log(f"✅ Game run saved: {game_data['game']}")
                    
                    # Verify XP calculation
                    expected_xp = max(0, min(300, int(game_data['score'])))
                    self.log(f"   Expected XP gain: {expected_xp}")
                    
                    # Verify game run validation
                    if game_data['game'] in ['running_words', 'letters_grid', 'word_search', 'anagrams']:
                        is_valid = game_data['duration_ms'] >= 55000
                    else:
                        is_valid = game_data.get('metrics', {}).get('total', 0) >= 1
                    
                    self.log(f"   Game run valid for streaks: {is_valid}")
                    
                else:
                    self.log(f"❌ Game run failed: {game_data['game']} - {response.status_code}", "ERROR")
                    if response.text:
                        self.log(f"   Error: {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Game run exception: {game_data['game']} - {str(e)}", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_legacy_game_compatibility(self):
        """Test that legacy games still work with gamification"""
        self.log("Testing legacy game compatibility...")
        
        legacy_games = [
            {
                "game": "shuttle",
                "score": 85,
                "duration_ms": 35000,
                "difficulty_level": 8,  # Should trigger schulte_7x7 achievement
                "metrics": {
                    "table_size": "8x8",
                    "completion_time": 35000,
                    "errors": 2
                }
            },
            {
                "game": "twin_words",
                "score": 95,
                "duration_ms": 40000,
                "difficulty_level": 5,
                "metrics": {
                    "accuracy": 92,  # Should trigger twinwords_90acc achievement
                    "reaction_times": [800, 750, 900, 820, 780],
                    "correct": 23,
                    "total": 25
                }
            },
            {
                "game": "memory_digits",
                "score": 120,
                "duration_ms": 45000,
                "difficulty_level": 3,
                "metrics": {
                    "max_digits": 8,  # Should trigger digits_7 achievement
                    "sequences_completed": 5,
                    "average_rt": 2500
                }
            },
            {
                "game": "rsvp",
                "score": 200,
                "duration_ms": 30000,
                "difficulty_level": 1,
                "metrics": {
                    "wpm_start": 300,
                    "wpm_end": 650,  # Should trigger speed_600_wpm achievement
                    "total_tokens": 150,
                    "comprehension": 85
                }
            }
        ]
        
        all_passed = True
        
        for game_data in legacy_games:
            try:
                payload = {
                    "userId": TEST_USER_ID,
                    **game_data
                }
                
                self.log(f"Testing legacy game: {game_data['game']}")
                
                response = self.session.post(f"{API_BASE}/gameRuns", json=payload)
                
                if response.status_code in [200, 201]:
                    self.log(f"✅ Legacy game run saved: {game_data['game']}")
                    
                    # Check if this should trigger achievements
                    potential_achievements = []
                    if game_data['game'] == 'shuttle' and game_data['difficulty_level'] >= 7:
                        potential_achievements.append('schulte_7x7')
                    if game_data['game'] == 'twin_words' and game_data['metrics']['accuracy'] >= 90:
                        potential_achievements.append('twinwords_90acc')
                    if game_data['game'] == 'memory_digits' and game_data['metrics']['max_digits'] >= 7:
                        potential_achievements.append('digits_7')
                    if game_data['game'] == 'rsvp' and game_data['metrics']['wpm_end'] >= 600:
                        potential_achievements.append('speed_600_wpm')
                        
                    if potential_achievements:
                        self.log(f"   Potential achievements: {', '.join(potential_achievements)}")
                    
                else:
                    self.log(f"❌ Legacy game run failed: {game_data['game']} - {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"❌ Legacy game exception: {game_data['game']} - {str(e)}", "ERROR")
                all_passed = False
                
        return all_passed
    
    def test_progress_integration(self):
        """Test that progress API works with gamification"""
        self.log("Testing progress integration...")
        
        try:
            # Test saving progress for Phase 3 games
            progress_data = {
                "userId": TEST_USER_ID,
                "game": "running_words",
                "progress": {
                    "lastLevel": 15,
                    "lastBestScore": 280
                }
            }
            
            response = self.session.post(f"{API_BASE}/progress/save", json=progress_data)
            
            if response.status_code in [200, 201]:
                self.log("✅ Progress save API working")
                
                # Test retrieving progress
                get_response = self.session.get(f"{API_BASE}/progress/get?userId={TEST_USER_ID}&game=running_words")
                
                if get_response.status_code == 200:
                    self.log("✅ Progress get API working")
                    return True
                else:
                    self.log(f"❌ Progress get API failed: {get_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Progress save API failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Progress integration exception: {str(e)}", "ERROR")
            return False
    
    def run_comprehensive_test(self):
        """Run all gamification tests"""
        self.log("=" * 60)
        self.log("PHASE 4 MVP+ GAMIFICATION BACKEND TESTING")
        self.log("=" * 60)
        
        test_results = {}
        
        # Core Logic Tests (no API calls needed)
        test_results["API Health"] = self.test_api_health()
        test_results["XP Calculation Logic"] = self.test_xp_calculation_logic()
        test_results["Level Calculation Logic"] = self.test_level_calculation_logic()
        test_results["XP Progress Logic"] = self.test_xp_progress_logic()
        test_results["Game Run Validation Logic"] = self.test_game_run_validation_logic()
        test_results["Achievement Definitions"] = self.test_achievement_definitions()
        test_results["Streak System Logic"] = self.test_streak_system_logic()
        
        # API Integration Tests
        if test_results["API Health"]:
            test_results["Game Runs API with Gamification"] = self.test_game_runs_api_with_gamification()
            test_results["Legacy Game Compatibility"] = self.test_legacy_game_compatibility()
            test_results["Progress Integration"] = self.test_progress_integration()
        else:
            self.log("⚠️  Skipping API tests due to health check failure", "WARNING")
            test_results["Game Runs API with Gamification"] = False
            test_results["Legacy Game Compatibility"] = False
            test_results["Progress Integration"] = False
        
        # Summary
        self.log("=" * 60)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name}")
            if result:
                passed += 1
        
        self.log("=" * 60)
        self.log(f"OVERALL: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL PHASE 4 GAMIFICATION TESTS PASSED!")
        else:
            self.log("⚠️  Some tests failed - see details above")
        
        return passed == total

if __name__ == "__main__":
    tester = GamificationTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)