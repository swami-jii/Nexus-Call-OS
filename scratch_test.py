import urllib.request, re, ssl, urllib.parse

ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
base_url = "https://www.ifscswiftcodes.com/"

def get_soup(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, context=ctx) as resp:
        return resp.read().decode('utf-8', errors='replace')

home_html = get_soup(base_url)
bank_opts = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', home_html)

target_bank = "Bank of India"
bank_url = None
for val, name in bank_opts:
    if target_bank.lower() in name.lower() and not name.lower().startswith('central') and not name.lower().startswith('state') and not name.lower().startswith('union'):
        bank_url = urllib.parse.urljoin(base_url, val)
        print(f"Matched Bank: {name} -> {bank_url}")
        break

state_html = get_soup(bank_url)
state_opts = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', state_html)
state_url = None
for val, name in state_opts:
    if 'delhi' in name.lower():
        state_url = urllib.parse.urljoin(bank_url, val)
        print(f"Matched State: {name} -> {state_url}")
        break

dist_html = get_soup(state_url)
dist_opts = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', dist_html)
dist_url = None
for val, name in dist_opts:
    if 'delhi' in name.lower() or val.endswith('.htm'):
        dist_url = urllib.parse.urljoin(state_url, val)
        print(f"Matched Dist: {name} -> {dist_url}")
        break

branch_html = get_soup(dist_url)
branch_opts = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', branch_html)
print(f"Total branches found: {len(branch_opts)}")
for val, name in branch_opts:
    if any(k in name.lower() for k in ['narela', 'alipur', 'bawana', 'bankner', 'rohini', 'delhi']):
        b_url = urllib.parse.urljoin(dist_url, val)
        print(f"\nFetching branch '{name}': {b_url}")
        b_html = get_soup(b_url)
        ifsc_m = re.search(r'IFSC Code\s*[:\s]*([A-Z]{4}0[A-Z0-9]{6})', b_html, re.IGNORECASE)
        micr_m = re.search(r'MICR(?:\s*No| Code)?\s*[:\s]*(\d{9})', b_html, re.IGNORECASE)
        addr_m = re.search(r'Address\s*:\s*&nbsp;&nbsp;([^<\n]+)', b_html, re.IGNORECASE)
        print(f"  -> IFSC: {ifsc_m.group(1) if ifsc_m else 'None'}")
        print(f"  -> MICR: {micr_m.group(1) if micr_m else 'None'}")
        print(f"  -> ADDR: {addr_m.group(1).strip() if addr_m else 'None'}")
