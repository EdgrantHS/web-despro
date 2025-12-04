"""
Playwright Performance Testing Script
Tests page load times and API response times for the web application

This script runs multiple iterations of performance tests to provide statistically reliable results.
It tests both page load times and API response times using valid test credentials where needed.

Note: Some API endpoints require authentication, so we focus on testing publicly accessible
endpoints and the login API with both valid and invalid credentials to measure response times.
"""

import asyncio
import csv
import time
from datetime import datetime
from playwright.async_api import async_playwright
import requests
import json
import statistics
import numpy as np
import os

# Configuration
NUM_ITERATIONS = 30  # Number of test iterations to run for statistical reliability
DELAY_BETWEEN_ITERATIONS = 2  # Seconds to wait between full test cycles
DELAY_BETWEEN_TESTS = 0.5  # Seconds to wait between individual tests
REQUEST_TIMEOUT = 10  # Timeout for all HTTP requests and browser operations (seconds)
BASE_URL = "http://localhost:3001"
RESULTS_DIR = "results"

class PerformanceTester:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.results = []
        if not os.path.exists(RESULTS_DIR):
            os.makedirs(RESULTS_DIR)
        
    async def test_page_load_times(self, iteration=1):
        """Test page load times for key pages with multiple iterations"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Pages to test (based on the report requirements)
            pages_to_test = [
                {"name": "Login Page", "path": "/login"},
                {"name": "Dashboard Admin Pusat", "path": "/super-admin"},
                {"name": "Daftar Item (Table)", "path": "/super-admin/item-instances"},
                {"name": "QR Scanner Page", "path": "/qr-scan"},
                {"name": "Halaman Manajemen User (Super Admin)", "path": "/super-admin/users"},
                {"name": "Halaman Manajemen Node (Super Admin)", "path": "/super-admin/nodes"},
                {"name": "Halaman Generate QR", "path": "/qr-create"},
                {"name": "Node Admin Dashboard", "path": "/node-admin"},
                {"name": "Node Admin Item Instances", "path": "/node-admin/item-instances"},
            ]
            
            for page_info in pages_to_test:
                try:
                    if iteration == 1:  # Only print on first iteration to reduce noise
                        print(f"Testing page: {page_info['name']}")
                    
                    # Start timing
                    start_time = time.time()
                    
                    # Navigate to page
                    response = await page.goto(f"{self.base_url}{page_info['path']}", timeout=REQUEST_TIMEOUT * 1000)
                    
                    # Wait for page to load completely
                    await page.wait_for_load_state("networkidle", timeout=REQUEST_TIMEOUT * 1000)
                    
                    # End timing
                    end_time = time.time()
                    load_time_ms = (end_time - start_time) * 1000
                    
                    # Get page size (approximate) - only on first iteration for efficiency
                    if iteration == 1:
                        content = await page.content()
                        page_size_kb = len(content.encode('utf-8')) / 1024
                    else:
                        page_size_kb = 0  # Will be filled from first iteration
                    
                    self.results.append({
                        "Type": "Page",
                        "Name": page_info["name"],
                        "Load Time (ms)": round(load_time_ms, 2),
                        "Size (KB)": round(page_size_kb, 2),
                        "Status": "OK" if response.status < 400 else "Error",
                        "Timestamp": datetime.now().isoformat(),
                        "Iteration": iteration
                    })
                    
                    if iteration == 1:
                        print(f"  - Load time: {load_time_ms:.2f}ms")
                    
                    # Small delay between tests
                    await asyncio.sleep(DELAY_BETWEEN_TESTS)
                    
                except Exception as e:
                    if iteration == 1:
                        print(f"  - Error testing {page_info['name']}: {str(e)}")
                    self.results.append({
                        "Type": "Page",
                        "Name": page_info["name"],
                        "Load Time (ms)": -1,
                        "Size (KB)": -1,
                        "Status": f"Error: {str(e)}",
                        "Timestamp": datetime.now().isoformat(),
                        "Iteration": iteration
                    })
            
            await browser.close()
    
    def test_api_response_times(self, iteration=1):
        """Test API response times for key endpoints with multiple iterations"""
        # Create a session to maintain authentication
        session = requests.Session()
        
        # First, authenticate to get session cookies
        auth_success = False
        if iteration == 1:
            print("  🔐 Authenticating for protected API tests...")
        
        try:
            auth_response = session.post(f"{self.base_url}/api/login", 
                                       json={"email": "admin.pusat@despro.com", "password": "admin123"}, 
                                       timeout=REQUEST_TIMEOUT)
            if auth_response.status_code in [200, 201]:
                auth_success = True
                if iteration == 1:
                    print("  ✅ Authentication successful!")
            else:
                if iteration == 1:
                    print(f"  ❌ Authentication failed: {auth_response.status_code}")
        except Exception as e:
            if iteration == 1:
                print(f"  ❌ Authentication error: {str(e)[:30]}")
        
        # API endpoints to test (including authenticated ones)
        api_endpoints = [
            {"name": "Login API (Valid Credentials)", "method": "POST", "endpoint": "/api/login", 
             "data": {"email": "admin.pusat@despro.com", "password": "admin123"}, "auth_required": False},
            {"name": "Login API (Invalid Credentials)", "method": "POST", "endpoint": "/api/login", 
             "data": {"email": "test@invalid.com", "password": "wrongpassword"}, "auth_required": False},
            {"name": "Register API", "method": "POST", "endpoint": "/api/register",
             "data": {"username": "perftest", "email": "perftest@example.com", "password": "test123", "role": "node_admin"}, "auth_required": False},
            
            # Authenticated endpoints (only test if auth successful)
            {"name": "Nodes API", "method": "GET", "endpoint": "/api/nodes", "auth_required": True},
            {"name": "Item Types API", "method": "GET", "endpoint": "/api/item-types", "auth_required": True},
            {"name": "Item Instances API", "method": "GET", "endpoint": "/api/item-instances", "auth_required": True},
            {"name": "Item Transits API", "method": "GET", "endpoint": "/api/item-transits", "auth_required": True},
            {"name": "Users API", "method": "GET", "endpoint": "/api/user", "auth_required": True},
            {"name": "Reports API", "method": "GET", "endpoint": "/api/reports", "auth_required": True},
            {"name": "Recipes API", "method": "GET", "endpoint": "/api/recipes", "auth_required": True},
        ]
        
        for api_info in api_endpoints:
            # Skip authenticated endpoints if authentication failed
            if api_info.get("auth_required", False) and not auth_success:
                if iteration == 1:
                    print(f"⏭️  Skipping {api_info['name']} (authentication failed)")
                continue
                
            try:
                if iteration == 1:  # Only print on first iteration to reduce noise
                    print(f"Testing API: {api_info['name']}")
                
                url = f"{self.base_url}{api_info['endpoint']}"
                start_time = time.time()
                
                # Use session for authenticated requests, regular requests for others
                if api_info.get("auth_required", False):
                    if api_info['method'] == 'GET':
                        response = session.get(url, timeout=REQUEST_TIMEOUT)
                    elif api_info['method'] == 'POST':
                        data = api_info.get('data', {})
                        response = session.post(url, json=data, timeout=REQUEST_TIMEOUT)
                else:
                    # Use regular requests for non-authenticated endpoints
                    if api_info['method'] == 'GET':
                        response = requests.get(url, timeout=REQUEST_TIMEOUT)
                    elif api_info['method'] == 'POST':
                        data = api_info.get('data', {})
                        response = requests.post(url, json=data, timeout=REQUEST_TIMEOUT)
                
                end_time = time.time()
                response_time_ms = (end_time - start_time) * 1000
                
                # Calculate response size (only on first iteration for efficiency)
                if iteration == 1:
                    response_size_kb = len(response.content) / 1024 if response.content else 0
                else:
                    response_size_kb = 0  # Will be filled from first iteration
                
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
                elif api_info.get("auth_required", False) and response.status_code == 403:
                    status = "Forbidden (403)"  # Permission issue
                elif response.status_code < 400:
                    status = "OK"
                elif response.status_code == 404:
                    status = "Not Found (404)"  # API might not exist, but response time is still valid
                else:
                    status = f"Error {response.status_code}"
                
                self.results.append({
                    "Type": "API",
                    "Name": api_info["name"],
                    "Load Time (ms)": round(response_time_ms, 2),
                    "Size (KB)": round(response_size_kb, 2),
                    "Status": status,
                    "Timestamp": datetime.now().isoformat(),
                    "Iteration": iteration
                })
                
                if iteration == 1:
                    print(f"  - Response time: {response_time_ms:.2f}ms (Status: {status})")
                
                # Small delay between tests
                time.sleep(DELAY_BETWEEN_TESTS)
                
            except Exception as e:
                if iteration == 1:
                    print(f"  - Error testing {api_info['name']}: {str(e)}")
                self.results.append({
                    "Type": "API",
                    "Name": api_info["name"],
                    "Load Time (ms)": -1,
                    "Size (KB)": -1,
                    "Status": f"Error: {str(e)}",
                    "Timestamp": datetime.now().isoformat(),
                    "Iteration": iteration
                })
    
    def save_results(self, filename="performance_test_results.csv"):
        """Save test results to CSV file"""
        filepath = f"results/{filename}"
        
        if not self.results:
            print("No results to save!")
            return
        
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ["Type", "Name", "Load Time (ms)", "Size (KB)", "Status", "Iteration", "Timestamp"]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for result in self.results:
                writer.writerow(result)
        
        print(f"Results saved to {filepath}")
        return filepath
    
    def calculate_statistics(self):
        """Calculate comprehensive statistics from multiple iterations"""
        if not self.results:
            return {}
        
        # Group results by name and type
        grouped_results = {}
        for result in self.results:
            if result["Load Time (ms)"] > 0:  # Exclude errors
                key = f"{result['Type']}_{result['Name']}"
                if key not in grouped_results:
                    grouped_results[key] = {
                        'name': result['Name'],
                        'type': result['Type'],
                        'times': [],
                        'size': result['Size (KB)']
                    }
                grouped_results[key]['times'].append(result["Load Time (ms)"])
        
        # Calculate statistics for each test
        statistics_results = {}
        for key, data in grouped_results.items():
            if len(data['times']) > 0:
                times = data['times']
                statistics_results[key] = {
                    'name': data['name'],
                    'type': data['type'],
                    'size': data['size'],
                    'iterations': len(times),
                    'mean': statistics.mean(times),
                    'median': statistics.median(times),
                    'std_dev': statistics.stdev(times) if len(times) > 1 else 0,
                    'min': min(times),
                    'max': max(times),
                    'percentile_95': np.percentile(times, 95) if len(times) > 1 else times[0]
                }
        
        return statistics_results
    
    def print_summary(self):
        """Print a comprehensive summary with statistics from multiple iterations"""
        if not self.results:
            print("No results to summarize!")
            return
        
        print("\n" + "="*80)
        print("PERFORMANCE TEST SUMMARY (MULTIPLE ITERATIONS)")
        print("="*80)
        
        stats = self.calculate_statistics()
        
        if not stats:
            print("No valid results for statistical analysis")
            return
        
        page_stats = {k: v for k, v in stats.items() if v['type'] == 'Page'}
        api_stats = {k: v for k, v in stats.items() if v['type'] == 'API'}
        
        if page_stats:
            print(f"\n🌐 PAGE LOAD TIMES ({len(page_stats)} pages, {NUM_ITERATIONS} iterations each):")
            print("-" * 78)
            print(f"{'Page Name':<30} {'Mean':<8} {'Median':<8} {'Std Dev':<8} {'Min':<8} {'Max':<8} {'95th %':<8}")
            print("-" * 78)
            
            for key in sorted(page_stats.keys(), key=lambda x: page_stats[x]['mean']):
                stat = page_stats[key]
                print(f"{stat['name'][:29]:<30} {stat['mean']:<8.1f} {stat['median']:<8.1f} {stat['std_dev']:<8.1f} {stat['min']:<8.1f} {stat['max']:<8.1f} {stat['percentile_95']:<8.1f}")
        
        if api_stats:
            print(f"\n🚀 API RESPONSE TIMES ({len(api_stats)} endpoints, {NUM_ITERATIONS} iterations each):")
            print("-" * 78)
            print(f"{'API Name':<30} {'Mean':<8} {'Median':<8} {'Std Dev':<8} {'Min':<8} {'Max':<8} {'95th %':<8}")
            print("-" * 78)
            
            for key in sorted(api_stats.keys(), key=lambda x: api_stats[x]['mean']):
                stat = api_stats[key]
                print(f"{stat['name'][:29]:<30} {stat['mean']:<8.1f} {stat['median']:<8.1f} {stat['std_dev']:<8.1f} {stat['min']:<8.1f} {stat['max']:<8.1f} {stat['percentile_95']:<8.1f}")
        
        # Overall averages
        all_means = [stat['mean'] for stat in stats.values()]
        if all_means:
            print(f"\n📊 OVERALL STATISTICS:")
            print(f"  Total Tests: {len(stats)} unique tests × {NUM_ITERATIONS} iterations = {len(stats) * NUM_ITERATIONS} total measurements")
            print(f"  Average Response Time: {statistics.mean(all_means):.2f}ms")
            print(f"  Median Response Time: {statistics.median(all_means):.2f}ms")
            
            if page_stats:
                page_means = [stat['mean'] for stat in page_stats.values()]
                print(f"  Average Page Load Time: {statistics.mean(page_means):.2f}ms")
            
            if api_stats:
                api_means = [stat['mean'] for stat in api_stats.values()]
                print(f"  Average API Response Time: {statistics.mean(api_means):.2f}ms")

async def main():
    """Main function to run all tests with multiple iterations"""
    print("Starting Performance Testing with Multiple Iterations...")
    print(f"Iterations per test: {NUM_ITERATIONS}")
    print("Make sure your Next.js app is running on port 3001!")
    print("Run: npx next start -p 3001")
    print()
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:3001", timeout=REQUEST_TIMEOUT)
        print("✅ Server is running on port 3001")
    except:
        print("❌ Server is not responding on port 3001")
        print("Please start your Next.js app with: npx next start -p 3001")
        return
    
    tester = PerformanceTester()
    
    # Run multiple iterations
    print(f"\n🔄 Running {NUM_ITERATIONS} iterations of performance tests...")
    for i in range(1, NUM_ITERATIONS + 1):
        print(f"\n🔍 Iteration {i}/{NUM_ITERATIONS}...")
        
        await tester.test_page_load_times(iteration=i)
        
        tester.test_api_response_times(iteration=i)
        
        # Delay between iterations (except last one)
        if i < NUM_ITERATIONS:
            time.sleep(DELAY_BETWEEN_ITERATIONS)
    
    print(f"\n✅ Completed {NUM_ITERATIONS} iterations!")
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"performance_test_results_{NUM_ITERATIONS}iterations_{timestamp}.csv"
    tester.save_results(filename)
    
    # Print comprehensive summary with statistics
    tester.print_summary()
    
    print(f"\n✅ Testing completed! Results saved to results/{filename}")
    print(f"📊 Total measurements: {len(tester.results)}")

if __name__ == "__main__":
    asyncio.run(main())