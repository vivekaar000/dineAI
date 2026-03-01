from app.config import settings
from firecrawl import FirecrawlApp

url = "https://cafe.hardrock.com/nashville/"
api_key = settings.firecrawl_api_key
app = FirecrawlApp(api_key=api_key)

try:
    res = app.scrape(url, formats=['markdown'])
    print(type(res))
    if hasattr(res, 'markdown'):
        print("has markdown block")
        print(res.markdown[:100])
    elif isinstance(res, dict):
        print("is dict")
        print(res.keys())
    else:
        print(dir(res))
except Exception as e:
    print(e)
