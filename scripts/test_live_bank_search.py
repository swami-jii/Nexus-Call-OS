import urllib.request
import urllib.parse
import ssl
import re

def test_ifsc_search(bank_name, state_name, district_name, keyword=''):
    ctx = ssl._create_unverified_context()
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    # 1. Fetch homepage of ifscswiftcodes.com
    req = urllib.request.Request('https://www.ifscswiftcodes.com/', headers=headers)
    html = urllib.request.urlopen(req, context=ctx, timeout=10).read().decode(errors='replace')
    
    # Extract all bank options
    options = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', html)
    bank_url = None
    for val, name in options:
        if bank_name.lower() in name.lower() or name.lower() in bank_name.lower():
            bank_url = val
            print(f"Found Bank: {name} -> {val}")
            break
            
    if not bank_url:
        return None
        
    # 2. Fetch State page
    req2 = urllib.request.Request(f"https://www.ifscswiftcodes.com/{bank_url}", headers=headers)
    html2 = urllib.request.urlopen(req2, context=ctx, timeout=10).read().decode(errors='replace')
    state_options = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', html2)
    state_url = None
    for val, name in state_options:
        if state_name.lower() in name.lower() or name.lower() in state_name.lower():
            state_url = val
            print(f"Found State: {name} -> {val}")
            break
            
    if not state_url:
        return None
        
    # 3. Fetch District page
    req3 = urllib.request.Request(f"https://www.ifscswiftcodes.com/{state_url}", headers=headers)
    html3 = urllib.request.urlopen(req3, context=ctx, timeout=10).read().decode(errors='replace')
    dist_options = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', html3)
    dist_url = None
    for val, name in dist_options:
        if district_name.lower() in name.lower() or name.lower() in district_name.lower() or 'delhi' in name.lower():
            dist_url = val
            print(f"Found District: {name} -> {val}")
            break
            
    if not dist_url:
        return None
        
    # 4. Fetch Branch page
    parent_path = state_url.rsplit('/', 1)[0]
    req4 = urllib.request.Request(f"https://www.ifscswiftcodes.com/{parent_path}/{dist_url}", headers=headers)
    html4 = urllib.request.urlopen(req4, context=ctx, timeout=10).read().decode(errors='replace')
    branch_options = re.findall(r'<option\s+value="([^"]+)"[^>]*>([^<]+)</option>', html4)
    print(f"Found {len(branch_options)} branches in {district_name}.")
    
    # Search for matching branch
    matched_branch = None
    for val, name in branch_options:
        if keyword and keyword.lower() in name.lower():
            matched_branch = (val, name)
            print(f"Keyword match '{keyword}': {name} -> {val}")
            break
            
    if not matched_branch and branch_options:
        # Take first valid branch
        for val, name in branch_options:
            if val.endswith('.htm') and 'select' not in name.lower():
                matched_branch = (val, name)
                print(f"Default first branch: {name} -> {val}")
                break
                
    if matched_branch:
        val, name = matched_branch
        branch_page_url = f"https://www.ifscswiftcodes.com/{parent_path}/{dist_url.rsplit('/', 1)[0]}/{val}"
        print("Branch Page URL:", branch_page_url)
        req5 = urllib.request.Request(branch_page_url, headers=headers)
        html5 = urllib.request.urlopen(req5, context=ctx, timeout=10).read().decode(errors='replace')
        
        # Extract IFSC, MICR, Address
        ifsc_m = re.search(r'IFSC Code\s*[:\s]*([A-Z]{4}0[A-Z0-9]{6})', html5, re.IGNORECASE)
        micr_m = re.search(r'MICR(?:\s*No| Code)?\s*[:\s]*(\d{9})', html5, re.IGNORECASE)
        pin_m = re.search(r'PIN Code\s*[:\s]*(\d{6})', html5, re.IGNORECASE)
        addr_m = re.search(r'Address\s*:\s*&nbsp;&nbsp;([^<\n]+)', html5, re.IGNORECASE)
        
        print("Extracted Results:")
        print("IFSC:", ifsc_m.group(1) if ifsc_m else None)
        print("MICR:", micr_m.group(1) if micr_m else None)
        print("PIN:", pin_m.group(1) if pin_m else None)
        print("Address:", addr_m.group(1).strip() if addr_m else None)

if __name__ == '__main__':
    test_ifsc_search('Bank of India', 'Delhi', 'Delhi', 'Bawana')
