import sys
import json
import traceback
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

def scrape_problem(url):
    driver = None
    try:
        print(f"Scraping URL: {url}", file=sys.stderr)
        
        # Enhanced Chrome options for better compatibility
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--start-maximized')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        print("Initializing Chrome driver...", file=sys.stderr)
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        # Set various timeouts
        driver.set_page_load_timeout(30)
        driver.implicitly_wait(20)
        
        print("Loading page...", file=sys.stderr)
        driver.get(url)
        
        # Wait for Cloudflare check to complete
        time.sleep(10)  # Increased wait time for Cloudflare
        
        # Check if we're still on Cloudflare page
        if "Just a moment" in driver.title:
            print("Waiting for Cloudflare check...", file=sys.stderr)
            time.sleep(10)  # Wait longer if still on Cloudflare page
        
        # Wait for problem statement with multiple attempts
        wait = WebDriverWait(driver, 30)
        max_attempts = 3
        attempt = 0
        
        while attempt < max_attempts:
            try:
                print(f"Attempt {attempt + 1} to find problem statement...", file=sys.stderr)
                problem_statement = wait.until(
                    EC.presence_of_element_located((By.CLASS_NAME, "problem-statement"))
                )
                if problem_statement.is_displayed():
                    break
            except:
                attempt += 1
                if attempt < max_attempts:
                    time.sleep(5)
                    driver.refresh()
                else:
                    raise Exception("Could not load problem statement after multiple attempts")
        
        # Extract problem data
        problem_data = {
            'title': '',
            'time_limit': '',
            'memory_limit': '',
            'statement': '',
            'input_spec': '',
            'output_spec': '',
            'example_tests': []
        }
        
        # Get problem components
        header = problem_statement.find_element(By.CLASS_NAME, "header")
        title = header.find_element(By.CLASS_NAME, "title").text.strip()
        time_limit = header.find_element(By.CLASS_NAME, "time-limit").text.strip()
        memory_limit = header.find_element(By.CLASS_NAME, "memory-limit").text.strip()
        
        problem_data.update({
            'title': title,
            'time_limit': time_limit,
            'memory_limit': memory_limit,
            'statement': problem_statement.text.strip()
        })
        
        print("Successfully extracted problem data", file=sys.stderr)
        print(json.dumps(problem_data))
        return
        
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        if driver:
            print("Current URL:", driver.current_url, file=sys.stderr)
            print("Page title:", driver.title, file=sys.stderr)
        print(json.dumps({'error': f"Scraping error: {str(e)}"}))
        sys.exit(1)
        
    finally:
        if driver:
            try:
                driver.quit()
            except:
                pass

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'URL argument is required'}))
        sys.exit(1)
    
    scrape_problem(sys.argv[1])