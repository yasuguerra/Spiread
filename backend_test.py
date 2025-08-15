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
BASE_URL = "https://read-faster-2.preview.emergentagent.com"
LOCAL_URL = "http://localhost:3000"

# Test user data
TEST_USER_ID = "test_user_spiread_2025"
TEST_DOC_ID = "test_doc_001"

class SpireadBackendTester:
    def __init__(self, use_local=False):
        self.base_url = LOCAL_URL if use_local else BASE_URL
        self.api_base = f"{self.base_url}/api"
        self.use_local = use_local
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = {
            'health_check': {'passed': 0, 'failed': 0, 'details': []},
            'game_integration': {'passed': 0, 'failed': 0, 'details': []},
            'ai_integration': {'passed': 0, 'failed': 0, 'details': []},
            'session_runner': {'passed': 0, 'failed': 0, 'details': []},
            'database_operations': {'passed': 0, 'failed': 0, 'details': []},
            'progress_api': {'passed': 0, 'failed': 0, 'details': []},
            'gamification': {'passed': 0, 'failed': 0, 'details': []}
        }
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def log_result(self, category, test_name, passed, details=""):
        """Log test result"""
        if passed:
            self.results[category]['passed'] += 1
            status = "✅ PASS"
        else:
            self.results[category]['failed'] += 1
            status = "❌ FAIL"
            
        self.results[category]['details'].append(f"{status}: {test_name} - {details}")
        self.log(f"{status}: {test_name} - {details}")
        
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{self.api_base}{endpoint}"
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed for {url}: {e}", "ERROR")
            return None

    def test_health_endpoints(self):
        """Test 1: API Endpoints Health Check"""
        self.log("\n=== 1. API ENDPOINTS HEALTH CHECK ===")
        
        # Test basic health endpoint
        response = self.make_request('GET', '/health')
        if response and response.status_code == 200:
            data = response.json()
            if 'status' in data and data['status'] == 'healthy':
                self.log_result('health_check', 'Basic Health Endpoint', True, 
                              f"Status: {data['status']}, Timestamp: {data.get('timestamp', 'N/A')}")
            else:
                self.log_result('health_check', 'Basic Health Endpoint', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('health_check', 'Basic Health Endpoint', False, 
                          f"HTTP {status_code}")

        # Test AI health endpoint
        response = self.make_request('GET', '/ai/health')
        if response and response.status_code == 200:
            data = response.json()
            if data.get('ok') and 'provider' in data and 'model' in data:
                self.log_result('health_check', 'AI Health Endpoint', True, 
                              f"Provider: {data['provider']}, Model: {data['model']}, AI Enabled: {data.get('aiEnabled')}")
            else:
                self.log_result('health_check', 'AI Health Endpoint', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('health_check', 'AI Health Endpoint', False, 
                          f"HTTP {status_code}")

        # Test sessions endpoint (should require user_id)
        response = self.make_request('GET', '/sessions')
        if response and response.status_code == 400:
            self.log_result('health_check', 'Sessions Validation', True, 
                          "Correctly returns 400 for missing user_id")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('health_check', 'Sessions Validation', False, 
                          f"Expected 400, got HTTP {status_code}")

        # Test settings endpoint (should require user_id)
        response = self.make_request('GET', '/settings')
        if response and response.status_code == 400:
            self.log_result('health_check', 'Settings Validation', True, 
                          "Correctly returns 400 for missing user_id")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('health_check', 'Settings Validation', False, 
                          f"Expected 400, got HTTP {status_code}")

        # Test gameRuns endpoint (should require user_id)
        response = self.make_request('GET', '/gameRuns')
        if response and response.status_code == 400:
            self.log_result('health_check', 'GameRuns Validation', True, 
                          "Correctly returns 400 for missing user_id")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('health_check', 'GameRuns Validation', False, 
                          f"Expected 400, got HTTP {status_code}")

    def test_game_integration(self):
        """Test 2: Game Launches & Integration - Test all 9 games"""
        self.log("\n=== 2. GAME LAUNCHES & INTEGRATION ===")
        
        # Test game types: Original + Phase 3 games
        game_types = [
            # Original games
            {'game': 'rsvp', 'duration_ms': 45000, 'score': 150, 'metrics': {'wpm_start': 200, 'wpm_end': 250}},
            {'game': 'shuttle', 'duration_ms': 35000, 'score': 180, 'metrics': {'difficulty_level': 5, 'completion_time': 35}},
            {'game': 'twin_words', 'duration_ms': 40000, 'score': 200, 'metrics': {'accuracy': 85, 'reaction_time': 800}},
            {'game': 'par_impar', 'duration_ms': 30000, 'score': 120, 'metrics': {'accuracy': 90, 'total_numbers': 50}},
            {'game': 'memory_digits', 'duration_ms': 25000, 'score': 160, 'metrics': {'max_digits': 6, 'accuracy': 80}},
            
            # Phase 3 games (60-second sessions)
            {'game': 'running_words', 'duration_ms': 60000, 'score': 220, 'metrics': {'wordsPerLine': 5, 'wordExposureMs': 250, 'accuracy': 85, 'meanRT': 1200}},
            {'game': 'letters_grid', 'duration_ms': 60000, 'score': 190, 'metrics': {'N': 10, 'targets': 2, 'hits': 18, 'falsePositives': 2, 'accuracy': 90}},
            {'game': 'word_search', 'duration_ms': 60000, 'score': 240, 'metrics': {'gridSize': 12, 'wordsFound': 8, 'time_per_word_ms': 7500, 'accuracy': 100}},
            {'game': 'anagrams', 'duration_ms': 60000, 'score': 210, 'metrics': {'length': 6, 'solved': True, 'expired': False, 'accuracy': 95, 'bestStreak': 5}}
        ]
        
        for game_data in game_types:
            # Test game run creation
            game_run_data = {
                'userId': TEST_USER_ID,
                'game': game_data['game'],
                'difficultyLevel': 5,
                'durationMs': game_data['duration_ms'],
                'score': game_data['score'],
                'metrics': game_data['metrics']
            }
            
            response = self.make_request('POST', '/gameRuns', game_run_data)
            if response and response.status_code == 200:
                data = response.json()
                if 'game' in data and data['game'] == game_data['game']:
                    self.log_result('game_integration', f'{game_data["game"]} Game Run', True, 
                                  f"Successfully saved game run with score {game_data['score']}")
                else:
                    self.log_result('game_integration', f'{game_data["game"]} Game Run', False, 
                                  f"Invalid response format: {data}")
            else:
                status_code = response.status_code if response else "No response"
                error_msg = ""
                if response:
                    try:
                        error_data = response.json()
                        error_msg = f" - {error_data.get('error', '')}"
                    except:
                        pass
                self.log_result('game_integration', f'{game_data["game"]} Game Run', False, 
                              f"HTTP {status_code}{error_msg}")

        # Test game runs retrieval
        response = self.make_request('GET', '/gameRuns', params={'user_id': TEST_USER_ID})
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result('game_integration', 'Game Runs Retrieval', True, 
                              f"Retrieved {len(data)} game runs")
            else:
                self.log_result('game_integration', 'Game Runs Retrieval', False, 
                              f"Expected array, got: {type(data)}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('game_integration', 'Game Runs Retrieval', False, 
                          f"HTTP {status_code}")

    def test_ai_integration(self):
        """Test 3: AI/LLM Integration with Emergent LLM Key"""
        self.log("\n=== 3. AI/LLM INTEGRATION ===")
        
        # Test AI Summarize endpoint
        summarize_data = {
            'docId': TEST_DOC_ID,
            'locale': 'es',
            'userId': TEST_USER_ID
        }
        
        response = self.make_request('POST', '/ai/summarize', summarize_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'bullets' in data and 'abstract' in data:
                fallback_used = data.get('fallback', False)
                cached = data.get('cached', False)
                self.log_result('ai_integration', 'AI Summarize', True, 
                              f"Generated summary (fallback: {fallback_used}, cached: {cached})")
            else:
                self.log_result('ai_integration', 'AI Summarize', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('ai_integration', 'AI Summarize', False, 
                          f"HTTP {status_code}")

        # Test AI Questions endpoint
        questions_data = {
            'docId': TEST_DOC_ID,
            'locale': 'es',
            'n': 5,
            'userId': TEST_USER_ID
        }
        
        response = self.make_request('POST', '/ai/questions', questions_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'items' in data and isinstance(data['items'], list) and len(data['items']) > 0:
                fallback_used = data.get('fallback', False)
                cached = data.get('cached', False)
                question_count = len(data['items'])
                self.log_result('ai_integration', 'AI Questions', True, 
                              f"Generated {question_count} questions (fallback: {fallback_used}, cached: {cached})")
            else:
                self.log_result('ai_integration', 'AI Questions', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('ai_integration', 'AI Questions', False, 
                          f"HTTP {status_code}")

        # Test AI Questions with different parameters
        questions_data_en = {
            'docId': TEST_DOC_ID,
            'locale': 'en',
            'n': 3,
            'userId': TEST_USER_ID
        }
        
        response = self.make_request('POST', '/ai/questions', questions_data_en)
        if response and response.status_code == 200:
            data = response.json()
            if 'items' in data and len(data['items']) == 3:
                self.log_result('ai_integration', 'AI Questions (EN, n=3)', True, 
                              f"Generated exactly 3 questions in English")
            else:
                self.log_result('ai_integration', 'AI Questions (EN, n=3)', False, 
                              f"Expected 3 questions, got {len(data.get('items', []))}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('ai_integration', 'AI Questions (EN, n=3)', False, 
                          f"HTTP {status_code}")

    def test_progress_api(self):
        """Test 4: Progress API Endpoints"""
        self.log("\n=== 4. PROGRESS API ENDPOINTS ===")
        
        # Test progress save for different games
        games_progress = [
            {'game': 'running_words', 'progress': {'lastLevel': 8, 'lastBestScore': 220, 'totalRounds': 15}},
            {'game': 'letters_grid', 'progress': {'lastLevel': 6, 'lastBestScore': 190, 'bestAccuracy': 92}},
            {'game': 'word_search', 'progress': {'lastLevel': 10, 'lastBestScore': 240, 'totalWords': 85}},
            {'game': 'anagrams', 'progress': {'lastLevel': 7, 'lastBestScore': 210, 'totalSolved': 45}},
            {'game': 'memory_digits', 'progress': {'lastLevel': 5, 'lastBestScore': 160, 'averageRt': 1200}}
        ]
        
        for game_progress in games_progress:
            save_data = {
                'userId': TEST_USER_ID,
                'game': game_progress['game'],
                'progress': game_progress['progress']
            }
            
            response = self.make_request('POST', '/progress/save', save_data)
            if response and response.status_code == 200:
                data = response.json()
                if data.get('success') and 'progress' in data:
                    self.log_result('progress_api', f'Save Progress - {game_progress["game"]}', True, 
                                  f"Level {game_progress['progress']['lastLevel']}, Score {game_progress['progress']['lastBestScore']}")
                else:
                    self.log_result('progress_api', f'Save Progress - {game_progress["game"]}', False, 
                                  f"Invalid response: {data}")
            else:
                status_code = response.status_code if response else "No response"
                error_msg = ""
                if response:
                    try:
                        error_data = response.json()
                        error_msg = f" - {error_data.get('error', '')}"
                    except:
                        pass
                self.log_result('progress_api', f'Save Progress - {game_progress["game"]}', False, 
                              f"HTTP {status_code}{error_msg}")

        # Test progress retrieval
        response = self.make_request('GET', '/progress/get', params={'userId': TEST_USER_ID})
        if response and response.status_code == 200:
            data = response.json()
            if 'progress' in data and isinstance(data['progress'], dict):
                game_count = len(data['progress'])
                self.log_result('progress_api', 'Get All Progress', True, 
                              f"Retrieved progress for {game_count} games")
            else:
                self.log_result('progress_api', 'Get All Progress', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('progress_api', 'Get All Progress', False, 
                          f"HTTP {status_code}")

        # Test specific game progress retrieval
        response = self.make_request('GET', '/progress/get', 
                                   params={'userId': TEST_USER_ID, 'game': 'running_words'})
        if response and response.status_code == 200:
            data = response.json()
            if 'progress' in data and 'running_words' in data['progress']:
                progress = data['progress']['running_words']
                self.log_result('progress_api', 'Get Specific Game Progress', True, 
                              f"Running Words - Level {progress.get('lastLevel', 'N/A')}")
            else:
                self.log_result('progress_api', 'Get Specific Game Progress', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('progress_api', 'Get Specific Game Progress', False, 
                          f"HTTP {status_code}")

    def test_session_runner(self):
        """Test 5: Session Runner 2.0 Enhanced Functionality"""
        self.log("\n=== 5. SESSION RUNNER 2.0 ===")
        
        # Test session schedules creation
        session_data = {
            'userId': TEST_USER_ID,
            'template': '30min',
            'totalDurationMs': 1800000,  # 30 minutes
            'blocks': [
                {
                    'game': 'running_words',
                    'durationMs': 300000,  # 5 minutes
                    'difficultyLevel': 5,
                    'score': 220,
                    'completed': True
                },
                {
                    'game': 'letters_grid', 
                    'durationMs': 300000,
                    'difficultyLevel': 6,
                    'score': 190,
                    'completed': True
                },
                {
                    'game': 'word_search',
                    'durationMs': 300000,
                    'difficultyLevel': 8,
                    'score': 240,
                    'completed': True
                }
            ]
        }
        
        response = self.make_request('POST', '/session_schedules', session_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'template' in data and data['template'] == '30min':
                self.log_result('session_runner', 'Create Session Schedule', True, 
                              f"30min template with {len(session_data['blocks'])} blocks")
            else:
                self.log_result('session_runner', 'Create Session Schedule', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - {error_data.get('error', '')}"
                except:
                    pass
            self.log_result('session_runner', 'Create Session Schedule', False, 
                          f"HTTP {status_code}{error_msg}")

        # Test session schedules retrieval
        response = self.make_request('GET', '/session_schedules', 
                                   params={'user_id': TEST_USER_ID})
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result('session_runner', 'Get Session Schedules', True, 
                              f"Retrieved {len(data)} session schedules")
            else:
                self.log_result('session_runner', 'Get Session Schedules', False, 
                              f"Expected array, got: {type(data)}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('session_runner', 'Get Session Schedules', False, 
                          f"HTTP {status_code}")

        # Test different session templates
        templates = ['15min', '60min']
        for template in templates:
            template_data = {
                'userId': TEST_USER_ID,
                'template': template,
                'totalDurationMs': 900000 if template == '15min' else 3600000,
                'blocks': [
                    {
                        'game': 'anagrams',
                        'durationMs': 300000,
                        'difficultyLevel': 4,
                        'score': 180,
                        'completed': True
                    }
                ]
            }
            
            response = self.make_request('POST', '/session_schedules', template_data)
            if response and response.status_code == 200:
                self.log_result('session_runner', f'Session Template - {template}', True, 
                              f"Successfully created {template} session")
            else:
                status_code = response.status_code if response else "No response"
                self.log_result('session_runner', f'Session Template - {template}', False, 
                              f"HTTP {status_code}")

    def test_database_operations(self):
        """Test 6: Database Schema & Operations"""
        self.log("\n=== 6. DATABASE SCHEMA & OPERATIONS ===")
        
        # Test sessions table operations
        session_data = {
            'user_id': TEST_USER_ID,
            'wpm_start': 200,
            'wpm_end': 280,
            'comprehension_score': 85,
            'exercise_type': 'rsvp',
            'duration_seconds': 120,
            'text_length': 500
        }
        
        response = self.make_request('POST', '/sessions', session_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'user_id' in data and data['user_id'] == TEST_USER_ID:
                self.log_result('database_operations', 'Sessions Table Insert', True, 
                              f"WPM: {session_data['wpm_start']} → {session_data['wpm_end']}")
            else:
                self.log_result('database_operations', 'Sessions Table Insert', False, 
                              f"Invalid response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - {error_data.get('error', '')}"
                except:
                    pass
            self.log_result('database_operations', 'Sessions Table Insert', False, 
                          f"HTTP {status_code}{error_msg}")

        # Test settings table operations
        settings_data = {
            'user_id': TEST_USER_ID,
            'wpm_target': 400,
            'chunk_size': 5,
            'theme': 'dark',
            'language': 'es',
            'font_size': 16,
            'sound_enabled': True,
            'show_instructions': False
        }
        
        response = self.make_request('POST', '/settings', settings_data)
        if response and response.status_code == 200:
            data = response.json()
            if 'user_id' in data and data['user_id'] == TEST_USER_ID:
                self.log_result('database_operations', 'Settings Table Upsert', True, 
                              f"WPM Target: {settings_data['wpm_target']}, Language: {settings_data['language']}")
            else:
                self.log_result('database_operations', 'Settings Table Upsert', False, 
                              f"Invalid response: {data}")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - {error_data.get('error', '')}"
                except:
                    pass
            self.log_result('database_operations', 'Settings Table Upsert', False, 
                          f"HTTP {status_code}{error_msg}")

        # Test data retrieval operations
        response = self.make_request('GET', '/sessions', params={'user_id': TEST_USER_ID})
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result('database_operations', 'Sessions Table Query', True, 
                              f"Retrieved {len(data)} sessions")
            else:
                self.log_result('database_operations', 'Sessions Table Query', False, 
                              f"Expected array, got: {type(data)}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('database_operations', 'Sessions Table Query', False, 
                          f"HTTP {status_code}")

        response = self.make_request('GET', '/settings', params={'user_id': TEST_USER_ID})
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and ('user_id' in data or len(data) == 0):
                self.log_result('database_operations', 'Settings Table Query', True, 
                              f"Retrieved settings for user")
            else:
                self.log_result('database_operations', 'Settings Table Query', False, 
                              f"Invalid response format: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('database_operations', 'Settings Table Query', False, 
                          f"HTTP {status_code}")

    def test_gamification_backend(self):
        """Test 7: Gamification Backend Integration"""
        self.log("\n=== 7. GAMIFICATION BACKEND INTEGRATION ===")
        
        # Note: Based on test_result.md, gamification is currently client-side only
        # Testing if backend endpoints integrate with gamification functions
        
        # Test if game runs trigger gamification updates
        high_score_game = {
            'userId': TEST_USER_ID,
            'game': 'running_words',
            'difficultyLevel': 10,  # Should trigger achievement
            'durationMs': 60000,
            'score': 280,  # High score for XP calculation
            'metrics': {
                'wordsPerLine': 7,
                'wordExposureMs': 200,
                'accuracy': 95,
                'meanRT': 1000
            }
        }
        
        response = self.make_request('POST', '/gameRuns', high_score_game)
        if response and response.status_code == 200:
            data = response.json()
            # Check if response includes gamification data (XP, level, achievements)
            has_gamification = any(key in data for key in ['xp', 'level', 'achievements', 'streak'])
            if has_gamification:
                self.log_result('gamification', 'Backend Gamification Integration', True, 
                              "Game run includes gamification data")
            else:
                self.log_result('gamification', 'Backend Gamification Integration', False, 
                              "Game run does not include gamification data - client-side only")
        else:
            status_code = response.status_code if response else "No response"
            self.log_result('gamification', 'Backend Gamification Integration', False, 
                          f"HTTP {status_code}")

        # Test if there are dedicated gamification endpoints
        gamification_endpoints = [
            '/profiles',
            '/streaks', 
            '/achievements',
            '/gamification/profile',
            '/gamification/stats'
        ]
        
        for endpoint in gamification_endpoints:
            response = self.make_request('GET', endpoint, params={'user_id': TEST_USER_ID})
            if response and response.status_code == 200:
                self.log_result('gamification', f'Gamification Endpoint - {endpoint}', True, 
                              "Endpoint exists and responds")
            elif response and response.status_code == 400:
                self.log_result('gamification', f'Gamification Endpoint - {endpoint}', True, 
                              "Endpoint exists with validation")
            else:
                status_code = response.status_code if response else "No response"
                self.log_result('gamification', f'Gamification Endpoint - {endpoint}', False, 
                              f"HTTP {status_code} - Endpoint may not exist")

    def print_summary(self):
        """Print comprehensive test summary"""
        self.log("\n" + "="*80)
        self.log("COMPREHENSIVE BACKEND TEST SUMMARY")
        self.log("="*80)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            status = "✅ WORKING" if failed == 0 else "❌ ISSUES FOUND" if passed > 0 else "❌ CRITICAL FAILURE"
            self.log(f"\n{category.upper().replace('_', ' ')}: {status}")
            self.log(f"  Passed: {passed}, Failed: {failed}")
            
            # Show details for failed tests
            if failed > 0:
                self.log("  Issues:")
                for detail in results['details']:
                    if "❌ FAIL" in detail:
                        self.log(f"    {detail}")
        
        self.log(f"\nOVERALL RESULTS:")
        self.log(f"  Total Tests: {total_passed + total_failed}")
        self.log(f"  Passed: {total_passed}")
        self.log(f"  Failed: {total_failed}")
        
        if total_failed == 0:
            self.log(f"  Status: ✅ ALL SYSTEMS OPERATIONAL")
        elif total_passed > total_failed:
            self.log(f"  Status: ⚠️  MOSTLY WORKING - SOME ISSUES")
        else:
            self.log(f"  Status: ❌ CRITICAL ISSUES FOUND")
            
        self.log("\nTesting completed at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        
        # Return summary for test_result.md update
        return {
            'total_passed': total_passed,
            'total_failed': total_failed,
            'categories': self.results,
            'status': 'working' if total_failed == 0 else 'issues' if total_passed > total_failed else 'critical'
        }

    def run_comprehensive_test(self):
        """Run all test suites"""
        self.log("SPIREAD BACKEND COMPREHENSIVE TESTING")
        self.log("=====================================")
        self.log(f"Testing Phase 1 Hotfix Implementation")
        self.log(f"URL: {self.base_url}")
        self.log(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all test suites
        self.test_health_endpoints()
        self.test_game_integration()
        self.test_ai_integration()
        self.test_progress_api()
        self.test_session_runner()
        self.test_database_operations()
        self.test_gamification_backend()
        
        # Print comprehensive summary
        return self.print_summary()

def main():
    """Main test execution"""
    # Test both external URL and local (if external fails)
    print(f"Testing External URL: {BASE_URL}")
    tester = SpireadBackendTester(use_local=False)
    summary = tester.run_comprehensive_test()
    
    # If external URL has issues, also test locally
    if summary['total_failed'] > 0:
        print(f"\n" + "="*80)
        print("TESTING LOCAL URL FOR COMPARISON")
        print("="*80)
        print(f"Testing Local URL: {LOCAL_URL}")
        
        local_tester = SpireadBackendTester(use_local=True)
        local_summary = local_tester.run_comprehensive_test()
        
        print(f"\n" + "="*80)
        print("COMPARISON SUMMARY")
        print("="*80)
        print(f"External URL ({BASE_URL}):")
        print(f"  Passed: {summary['total_passed']}, Failed: {summary['total_failed']}")
        print(f"Local URL ({LOCAL_URL}):")
        print(f"  Passed: {local_summary['total_passed']}, Failed: {local_summary['total_failed']}")
        
        if local_summary['total_failed'] < summary['total_failed']:
            print("\n🔍 DIAGNOSIS: External URL routing issues detected (likely Kubernetes ingress)")
            print("   Local testing shows better results, indicating infrastructure problems")
        elif local_summary['total_failed'] == summary['total_failed']:
            print("\n🔍 DIAGNOSIS: Issues are consistent across both URLs")
            print("   Problems likely in application code or database schema")
        else:
            print("\n🔍 DIAGNOSIS: Local environment has additional issues")

if __name__ == "__main__":
    main()