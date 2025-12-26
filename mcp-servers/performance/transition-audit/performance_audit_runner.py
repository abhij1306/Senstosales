import asyncio
import json
import sys
from playwright.async_api import async_playwright

async def run_trace():
    results = {
        "metrics": {},
        "trace_file": "performance_trace.zip",
        "status": "Running"
    }
    
    # URL to test (assuming local dev server)
    BASE_URL = "http://localhost:3000"

    print(f"Starting Performance Trace on {BASE_URL}...")

    async with async_playwright() as p:
        try:
            # Launch Browser
            browser = await p.chromium.launch()
            context = await browser.new_context()
            
            # Start Tracing
            await context.tracing.start(screenshots=True, snapshots=True, sources=True)
            
            page = await context.new_page()

            # 1. Load Dashboard (Wait for hydration)
            print("1. Loading Dashboard...")
            start_time = asyncio.get_event_loop().time()
            await page.goto(BASE_URL)
            try:
                # Wait for something distinctive on dashboard
                await page.wait_for_selector("text=Purchase Orders", timeout=10000)
            except:
                print("Dashboard load timeout - proceeding anyway")
            
            load_time = (asyncio.get_event_loop().time() - start_time) * 1000
            results["metrics"]["dashboard_load_ms"] = round(load_time, 2)

            # 2. Navigate to PO List
            print("2. Navigating to PO List...")
            start_time = asyncio.get_event_loop().time()
            await page.click("text=Purchase Orders")
            await page.wait_for_selector("text=New PO", timeout=10000)
            nav_time = (asyncio.get_event_loop().time() - start_time) * 1000
            results["metrics"]["po_list_nav_ms"] = round(nav_time, 2)

            # 3. Navigate to PO Detail
            print("3. Navigating to PO Detail...")
            po_link = page.locator("a[href^='/po/']").first
            
            if await po_link.count() > 0:
                start_time = asyncio.get_event_loop().time()
                await po_link.click()
                
                # Check for Skeleton/Content (Wait for "Bill of Materials" which is part of detail content)
                try:
                    await page.wait_for_selector("text=Bill of Materials", timeout=10000)
                except:
                   print("PO Detail load timeout")
                   
                detail_time = (asyncio.get_event_loop().time() - start_time) * 1000
                results["metrics"]["po_detail_transition_ms"] = round(detail_time, 2)
            else:
                results["metrics"]["po_detail_transition_ms"] = "Skipped (No POs found)"

            # 4. Measure CLS
            cls = await page.evaluate("() => { return window.performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0); }")
            results["metrics"]["cumulative_layout_shift"] = cls

            # Stop Tracing
            await context.tracing.stop(path="performance_trace.zip")
            await browser.close()
            
            results["status"] = "Success"
            print("Trace captured successfully.")
            
        except Exception as e:
            results["status"] = "Failed"
            results["error"] = str(e)
            print(f"Error: {e}")

    with open("trace_metrics.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Metrics saved to trace_metrics.json")

if __name__ == "__main__":
    asyncio.run(run_trace())
