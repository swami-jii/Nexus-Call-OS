import asyncio
import httpx
import urllib.parse
import re

async def test_geo(q):
    stop_words = r'(?i)\b(what|what\'s|whats|is|the|live|current|realtime|real-time|tell|me|about|how|forecast|weather|temperature|climate|mausam|mosam|temp|garmi|sardi|thand|barish|rain|in|of|for|at|today|now|kaisa|kese|kaise|hai|batao|bataiye|kya|hoga|shehar|city|please|ka|ki|ke|me|mein|par|ko|se)\b'
    clean = re.sub(stop_words, '', q).strip()
    clean = re.sub(r'[^\w\s]', '', clean).strip()
    
    # Common aliases
    aliases = {
        "bangalore": "bengaluru",
        "calcutta": "kolkata",
        "bombay": "mumbai",
        "madras": "chennai"
    }
    cand = aliases.get(clean.lower(), clean)
    
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(cand)}&count=10&language=en&format=json"
    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.get(url)
        results = res.json().get('results', [])
        # Prefer higher population
        results.sort(key=lambda x: x.get('population', 0), reverse=True)
        if results:
            top = results[0]
            print(f"'{q}' -> Clean '{clean}' -> Resolved: {top['name']}, {top.get('country')} (pop: {top.get('population', 0)})")
        else:
            print(f"'{q}' -> No results found for '{clean}'")

async def main():
    await test_geo("What is the live weather in Delhi?")
    await test_geo("Mumbai ka mausam kaisa hai")
    await test_geo("London weather today")
    await test_geo("Tokyo weather")
    await test_geo("Bangalore temperature")
    await test_geo("New York weather")

if __name__ == "__main__":
    asyncio.run(main())
