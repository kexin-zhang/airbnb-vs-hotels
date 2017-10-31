# CX4242 project: Airbnb vs Hotels

## Installation
```
pip3 install -r requirements.txt
```

## Running the scraper
### TripAdvisor
* `base_spider.py` - This spider gets the necessary URLs (through TripAdvisor's autocomplete) for each city that we are searching for. This only needs to be run once, and it outputs to `intermediate/urls.csv`
* `listings_spider.py` - Uses the URLs from the previous part to crawl for listings. Run with `scrapy crawl listings -o listings.json`
* `hotels_spider.py` - Scrapes hotel amenities for each listing. Run with `scrapy crawl hotels -o amenities.json` 
* `listings.json` and `amenities.json` contain price, amenities, and some other basic information for the TripAdvisor search results. 