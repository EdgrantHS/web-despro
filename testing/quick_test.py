"""
Quick Performance Test - Simplified Version
Tests core endpoints using actual existing API routes
"""

import asyncio
import csv
import time
import requests
from datetime import datetime
from playwright.async_api import async_playwright
import os

# Configuration
NUM_ITERATIONS = 5  # Reduced for quick testing
BASE_URL = "http://localhost:3001"
RESULTS_DIR = "results"
REQUEST_TIMEOUT = 10  # Timeout for all HTTP requests and browser operations (seconds)

class QuickPerformanceTester:
    def __init__(self):
        self.results = []
        if not os.path.exists(RESULTS_DIR):
            os.makedirs(RESULTS_DIR)
    
    async def test_pages(self):
        """Test key page load times"""
        pages = [
            {"name": "Login Page", "path": "/login"},
            {"name": "QR Scanner", "path": "/qr-scan"},
            {"name": "Register Page", "path": "/register"},
        ]
        
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            for page_info in pages:
                for iteration in range(1, NUM_ITERATIONS + 1):
                    try:
                        start_time = time.time()
                        await page.goto(f"{BASE_URL}{page_info['path']}", wait_until="networkidle", timeout=REQUEST_TIMEOUT * 1000)
                        load_time = (time.time() - start_time) * 1000
                        
                        # Get page size
                        content = await page.content()
                        page_size_kb = len(content.encode('utf-8')) / 1024
                        
                        self.results.append({
                            "Type": "Page",
                            "Name": page_info["name"],
                            "Load Time (ms)": round(load_time, 2),
                            "Size (KB)": round(page_size_kb, 2),
                            "Status": "OK",
                            "Iteration": iteration,
                            "Timestamp": datetime.now().isoformat()
                        })
                        
                        if iteration == 1:
                            print(f"✅ {page_info['name']}: {load_time:.1f}ms ({page_size_kb:.1f}KB)")
                        
                    except Exception as e:
                        print(f"❌ {page_info['name']}: Error")
                        self.results.append({
                            "Type": "Page",
                            "Name": page_info["name"],
                            "Load Time (ms)": -1,
                            "Size (KB)": -1,
                            "Status": f"Error: {str(e)[:30]}",
                            "Iteration": iteration,
                            "Timestamp": datetime.now().isoformat()
                        })
                        
            await browser.close()
    
    def test_apis(self):
        """Test API response times using actual existing endpoints including authenticated ones"""
        
        # Create session and authenticate
        session = requests.Session()
        auth_success = False
        
        print("  🔐 Authenticating...")
        try:
            auth_response = session.post(f"{BASE_URL}/api/login", 
                                       json={"email": "admin.pusat@despro.com", "password": "admin123"}, 
                                       timeout=REQUEST_TIMEOUT)
            if auth_response.status_code in [200, 201]:
                auth_success = True
                print("  ✅ Authentication successful!")
            else:
                print(f"  ❌ Authentication failed: {auth_response.status_code}")
        except Exception as e:
            print(f"  ❌ Authentication error: {str(e)[:30]}")
        
        apis = [
            # Public endpoints
            {"name": "Login API (Valid)", "method": "POST", "endpoint": "/api/login", 
             "data": {"email": "admin.pusat@despro.com", "password": "admin123"}, "auth_required": False},
            {"name": "Login API (Invalid)", "method": "POST", "endpoint": "/api/login",
             "data": {"email": "test@test.com", "password": "wrong"}, "auth_required": False},
            {"name": "Register API (Test)", "method": "POST", "endpoint": "/api/register",
             "data": {"username": "quicktest", "email": "quick@test.com", "password": "test123", "role": "node_admin"}, "auth_required": False},
            
            # Authenticated endpoints
            {"name": "Nodes API", "method": "GET", "endpoint": "/api/nodes", "auth_required": True},
            {"name": "Item Types API", "method": "GET", "endpoint": "/api/item-types", "auth_required": True},
            {"name": "Users API", "method": "GET", "endpoint": "/api/user", "auth_required": True},
        ]
        
        for api_info in apis:
            # Skip authenticated endpoints if authentication failed
            if api_info.get("auth_required", False) and not auth_success:
                print(f"⏭️  Skipping {api_info['name']} (authentication failed)")
                continue
                
            for iteration in range(1, NUM_ITERATIONS + 1):
                try:
                    start_time = time.time()
                    
                    # Use session for authenticated requests
                    if api_info.get("auth_required", False):
                        if api_info.get('method', 'GET') == 'GET':
                            response = session.get(f"{BASE_URL}{api_info['endpoint']}", timeout=REQUEST_TIMEOUT)
                        else:
                            response = session.post(f"{BASE_URL}{api_info['endpoint']}", 
                                                  json=api_info.get('data', {}), timeout=REQUEST_TIMEOUT)
                    else:
                        # Regular requests for public endpoints
                        if api_info.get('method', 'GET') == 'GET':
                            response = requests.get(f"{BASE_URL}{api_info['endpoint']}", timeout=REQUEST_TIMEOUT)
                        else:
                            response = requests.post(f"{BASE_URL}{api_info['endpoint']}", 
                                                   json=api_info.get('data', {}), timeout=REQUEST_TIMEOUT)
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    # Calculate response size
                    response_size_kb = len(response.content) / 1024 if response.content else 0
                    
                    # Determine expected status
                    if "Invalid" in api_info["name"] and response.status_code == 400:
                        status = "Expected 400"
                    elif "Valid" in api_info["name"] and response.status_code in [200, 201]:
                        status = "OK"
                    elif "Register" in api_info["name"] and response.status_code in [400, 409, 201]:
                        status = "Expected Response"  # Could be user exists or created
                    elif api_info.get("auth_required", False) and response.status_code in [200, 201]:
                        status = "OK"
                    elif api_info.get("auth_required", False) and response.status_code in [401, 403]:
                        status = f"Auth Issue ({response.status_code})"
                    elif response.status_code < 400:
                        status = "OK"
                    else:
                        status = f"Status {response.status_code}"
                    
                    self.results.append({
                        "Type": "API",
                        "Name": api_info["name"],
                        "Load Time (ms)": round(response_time, 2),
                        "Size (KB)": round(response_size_kb, 2),
                        "Status": status,
                        "Iteration": iteration,
                        "Timestamp": datetime.now().isoformat()
                    })
                    
                    if iteration == 1:
                        print(f"✅ {api_info['name']}: {response_time:.1f}ms ({response_size_kb:.1f}KB) ({status})")
                        
                except Exception as e:
                    print(f"❌ {api_info['name']}: Error - {str(e)[:30]}")
                    self.results.append({
                        "Type": "API",
                        "Name": api_info["name"],
                        "Load Time (ms)": -1,
                        "Size (KB)": -1,
                        "Status": f"Error: {str(e)[:30]}",
                        "Iteration": iteration,
                        "Timestamp": datetime.now().isoformat()
                    })
    
    def save_results(self):
        """Save results to CSV"""
        if not self.results:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"quick_test_results_{timestamp}.csv"
        filepath = os.path.join(RESULTS_DIR, filename)
        
        # Define consistent fieldnames
        fieldnames = ["Type", "Name", "Load Time (ms)", "Size (KB)", "Status", "Iteration", "Timestamp"]
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.results)
        
        print(f"\n💾 Results saved: {filename}")
        return filepath
    
    def print_summary(self):
        """Print performance summary"""
        if not self.results:
            return
        
        print(f"\n📊 Performance Summary ({NUM_ITERATIONS} iterations each):")
        print("="*60)
        
        # Group by name and calculate averages
        groups = {}
        for result in self.results:
            name = result["Name"]
            if name not in groups:
                groups[name] = []
            groups[name].append(result["Load Time (ms)"])
        
        for name, times in groups.items():
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            print(f"{name:<30} Avg: {avg_time:6.1f}ms  Min: {min_time:6.1f}ms  Max: {max_time:6.1f}ms")

async def main():
    print("🚀 Quick Performance Test Starting...")
    print(f"Testing {NUM_ITERATIONS} iterations each")
    print("Using actual API endpoints from the application")
    
    # Check server
    try:
        requests.get(BASE_URL, timeout=REQUEST_TIMEOUT)
        print("✅ Server running on port 3001")
    except:
        print("❌ Server not running! Start with: npx next start -p 3001")
        return
    
    tester = QuickPerformanceTester()
    
    print("\n📄 Testing Pages...")
    await tester.test_pages()
    
    print("\n🔌 Testing APIs...")
    tester.test_apis()
    
    tester.save_results()
    tester.print_summary()
    
    print("\n✅ Quick test completed!")
    print("Note: Some API errors are expected (e.g., user already exists for register)")

if __name__ == "__main__":
    asyncio.run(main())