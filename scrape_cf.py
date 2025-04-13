import cloudscraper
from bs4 import BeautifulSoup

scraper = cloudscraper.create_scraper()

# Set contest ID and problem index
contest_id = 1900
problem_index = "A"
problem = str(contest_id) + problem_index
problem_url = f"https://codeforces.com/problemset/problem/{contest_id}/{problem_index}"

# Step 1: Fetch the problem page
response = scraper.get(problem_url)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, "html.parser")

    # Step 2: Extract problem statement
    problem_statement = soup.find("div", class_="problem-statement")
    if problem_statement:
        statement_text = problem_statement.find("div", class_=None).text.strip()
        input_text = problem_statement.find("div", class_='input-specification').text.strip()
        output_text = problem_statement.find("div", class_='output-specification').text.strip()
        print("\nProblem Statement:\n", statement_text)
        print("\nInput:\n", input_text)
        print("\nOutput:\n", output_text)

    # Step 3: Extract test cases
    input_cases = soup.find_all("div", class_="input")
    output_cases = soup.find_all("div", class_="output")

    print("\nTest Cases:")
    for i in range(len(input_cases)):
        input_text = input_cases[i].find("pre").text.strip()
        output_text = output_cases[i].find("pre").text.strip()
        print(f"\nTest {i+1}:")
        print("Input:\n", input_text)
        print("Output:\n", output_text)

    # Step 4: Extract tutorial/editorial URL
    editorial_box = soup.find('div', class_='roundbox sidebox sidebar-menu borderTopRound')
    tutorial_url = None

    if editorial_box:
        for link in editorial_box.find_all("a"):
            href = link.get('href', '')
            link_text = link.get_text(strip=True).lower()
            if "/blog/entry/" in href and ("tutorial" in link_text or "editorial" in link_text):
                tutorial_url = "https://codeforces.com" + href
                break

    if not tutorial_url:
        print("\nNo proper tutorial/editorial link found.")
    else:
        print("\nFound Tutorial URL:", tutorial_url)

        # Step 5: Fetch full tutorial page
        tutorial_response = scraper.get(tutorial_url)
        if tutorial_response.status_code != 200:
            print("Failed to load tutorial page.")
            exit()

        tutorial_soup = BeautifulSoup(tutorial_response.text, "html.parser")

        # Step 6: Extract full tutorial content
        entry_div = tutorial_soup.find("div", class_="ttypography")
        if not entry_div:
            print("Tutorial content not found.")
            exit()

        # Output full tutorial text
        tutorial_text = entry_div.get_text(separator="\n", strip=True)
        print(f"\n--- 📘 Full Tutorial Content for {problem} ---\n")
        print(tutorial_text)

else:
    print(f"Failed to retrieve the problem page. Status Code: {response.status_code}")
