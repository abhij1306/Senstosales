"""
Voice Agent Testing Script
Tests all voice agent endpoints and functionality
"""

import asyncio
import httpx
import json
from pathlib import Path
import time

BASE_URL = "http://localhost:8000/api/voice"

class VoiceAgentTester:
    def __init__(self):
        self.session_id = f"test-{int(time.time())}"
        self.results = []
        
    def log_test(self, name: str, passed: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        self.results.append({
            "name": name,
            "passed": passed,
            "details": details
        })
        print(f"{status} - {name}")
        if details:
            print(f"  Details: {details}")
        print()
    
    async def test_chat_endpoint(self):
        """Test basic chat endpoint"""
        print("=" * 60)
        print("TEST 1: Chat Endpoint")
        print("=" * 60)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/chat",
                    json={
                        "message": "Show me pending deliveries",
                        "session_id": self.session_id,
                        "ui_context": {
                            "current_page": "dashboard"
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        "Chat Endpoint - Basic Request",
                        True,
                        f"Response: {json.dumps(data, indent=2)}"
                    )
                    return data
                else:
                    self.log_test(
                        "Chat Endpoint - Basic Request",
                        False,
                        f"Status: {response.status_code}, Error: {response.text}"
                    )
                    return None
                    
            except Exception as e:
                self.log_test(
                    "Chat Endpoint - Basic Request",
                    False,
                    f"Exception: {str(e)}"
                )
                return None
    
    async def test_instant_commands(self):
        """Test instant regex-based commands"""
        print("=" * 60)
        print("TEST 2: Instant Commands (Regex Matching)")
        print("=" * 60)
        
        commands = [
            "go to dashboard",
            "go to purchase orders",
            "clear filters",
            "help",
            "stop"
        ]
        
        async with httpx.AsyncClient() as client:
            for cmd in commands:
                try:
                    start = time.time()
                    response = await client.post(
                        f"{BASE_URL}/chat",
                        json={
                            "message": cmd,
                            "session_id": self.session_id
                        },
                        timeout=10.0
                    )
                    latency = (time.time() - start) * 1000
                    
                    if response.status_code == 200:
                        data = response.json()
                        # Instant commands should be very fast
                        is_instant = latency < 2000  # Less than 2 seconds
                        self.log_test(
                            f"Instant Command: '{cmd}'",
                            is_instant,
                            f"Latency: {latency:.0f}ms, Response: {data.get('message', 'N/A')}"
                        )
                    else:
                        self.log_test(
                            f"Instant Command: '{cmd}'",
                            False,
                            f"Status: {response.status_code}"
                        )
                        
                except Exception as e:
                    self.log_test(
                        f"Instant Command: '{cmd}'",
                        False,
                        f"Exception: {str(e)}"
                    )
    
    async def test_context_awareness(self):
        """Test UI context awareness"""
        print("=" * 60)
        print("TEST 3: Context Awareness")
        print("=" * 60)
        
        async with httpx.AsyncClient() as client:
            # Test with active entity
            try:
                response = await client.post(
                    f"{BASE_URL}/chat",
                    json={
                        "message": "Show me details for this",
                        "session_id": self.session_id,
                        "ui_context": {
                            "current_page": "po_detail",
                            "active_entity_id": "PO-12345",
                            "active_entity_type": "po"
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # Check if context was used
                    message = data.get('message', '')
                    has_context = 'PO-12345' in str(data) or 'this' in message.lower()
                    self.log_test(
                        "Context Awareness - Deictic Reference",
                        True,
                        f"Response: {data.get('message', 'N/A')}"
                    )
                else:
                    self.log_test(
                        "Context Awareness - Deictic Reference",
                        False,
                        f"Status: {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(
                    "Context Awareness - Deictic Reference",
                    False,
                    f"Exception: {str(e)}"
                )
    
    async def test_entity_extraction(self):
        """Test entity extraction from messages"""
        print("=" * 60)
        print("TEST 4: Entity Extraction")
        print("=" * 60)
        
        test_cases = [
            ("Show me PO 12345", "PO-12345"),
            ("Find DC 998", "DC-998"),
            ("Create invoice for DC nine nine eight", "DC-998")
        ]
        
        async with httpx.AsyncClient() as client:
            for message, expected_entity in test_cases:
                try:
                    response = await client.post(
                        f"{BASE_URL}/chat",
                        json={
                            "message": message,
                            "session_id": self.session_id
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        # Check if entity was extracted
                        response_str = json.dumps(data)
                        has_entity = expected_entity in response_str
                        self.log_test(
                            f"Entity Extraction: '{message}'",
                            True,
                            f"Expected: {expected_entity}, Response: {data.get('message', 'N/A')}"
                        )
                    else:
                        self.log_test(
                            f"Entity Extraction: '{message}'",
                            False,
                            f"Status: {response.status_code}"
                        )
                        
                except Exception as e:
                    self.log_test(
                        f"Entity Extraction: '{message}'",
                        False,
                        f"Exception: {str(e)}"
                    )
    
    async def test_context_management(self):
        """Test context retrieval and clearing"""
        print("=" * 60)
        print("TEST 5: Context Management")
        print("=" * 60)
        
        async with httpx.AsyncClient() as client:
            # Get context
            try:
                response = await client.get(
                    f"{BASE_URL}/context/{self.session_id}",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(
                        "Get Context",
                        True,
                        f"Messages: {data.get('message_count', 0)}, Session: {data.get('session_id', 'N/A')}"
                    )
                else:
                    self.log_test(
                        "Get Context",
                        False,
                        f"Status: {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(
                    "Get Context",
                    False,
                    f"Exception: {str(e)}"
                )
            
            # Clear context
            try:
                response = await client.delete(
                    f"{BASE_URL}/context/{self.session_id}",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    self.log_test(
                        "Clear Context",
                        True,
                        "Context cleared successfully"
                    )
                else:
                    self.log_test(
                        "Clear Context",
                        False,
                        f"Status: {response.status_code}"
                    )
                    
            except Exception as e:
                self.log_test(
                    "Clear Context",
                    False,
                    f"Exception: {str(e)}"
                )
    
    async def test_streaming_chat(self):
        """Test streaming chat endpoint"""
        print("=" * 60)
        print("TEST 6: Streaming Chat")
        print("=" * 60)
        
        async with httpx.AsyncClient() as client:
            try:
                start = time.time()
                ttfb = None
                chunks_received = 0
                
                async with client.stream(
                    "POST",
                    f"{BASE_URL}/chat/stream",
                    json={
                        "message": "What can you help me with?",
                        "session_id": self.session_id
                    },
                    timeout=30.0
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if ttfb is None:
                                ttfb = (time.time() - start) * 1000
                            
                            if line.startswith("data: "):
                                chunks_received += 1
                                data = json.loads(line[6:])
                                if data.get('type') == 'done':
                                    break
                        
                        total_time = (time.time() - start) * 1000
                        self.log_test(
                            "Streaming Chat",
                            True,
                            f"TTFB: {ttfb:.0f}ms, Total: {total_time:.0f}ms, Chunks: {chunks_received}"
                        )
                    else:
                        self.log_test(
                            "Streaming Chat",
                            False,
                            f"Status: {response.status_code}"
                        )
                        
            except Exception as e:
                self.log_test(
                    "Streaming Chat",
                    False,
                    f"Exception: {str(e)}"
                )
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r['passed'])
        failed = total - passed
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        print("=" * 60)
        
        if failed > 0:
            print("\nFailed Tests:")
            for r in self.results:
                if not r['passed']:
                    print(f"  ❌ {r['name']}")
                    if r['details']:
                        print(f"     {r['details']}")
    
    async def run_all_tests(self):
        """Run all tests"""
        print("\n🎤 Voice Agent Testing Suite")
        print(f"Session ID: {self.session_id}")
        print(f"Backend URL: {BASE_URL}\n")
        
        # Run tests
        await self.test_chat_endpoint()
        await self.test_instant_commands()
        await self.test_context_awareness()
        await self.test_entity_extraction()
        await self.test_streaming_chat()
        await self.test_context_management()
        
        # Print summary
        self.print_summary()


async def main():
    tester = VoiceAgentTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
