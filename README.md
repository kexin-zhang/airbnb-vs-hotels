# CX4242 project: Airbnb vs Hotels

## Description
Our CX4242 project focuses on quantifying differences between Airbnb listings and hotels in the city of New York. The entire project consists of several different components:
1. Data collection and scraping: We collected data from several sources, notably Airbnb, Amadeus (a travel IT company with an API for booking/pricing information), TripAdvisor, and OpenStreetMap. 
2. NLP analysis on reviews: We used the Stanford Core NLP library to segment reviews and perform sentiment analysis.
3. Search engine: We compiled all Airbnb and hotel data into an ElasticSearch instance hosted on AWS, to be able to search across both datasets at once.
4. Visualization UI: We summarized all of the data and analyses through an interactive webpage. 

Our finalized datasets are stored in an AWS ElasticSearch instance, and [our site](http://airbnb-vs-hotels.mgejdapexj.us-east-1.elasticbeanstalk.com/) is hosted with AWS ElasticBeanstalk.

## Installation
To install all Python dependencies used in this project, run
```
pip3 install -r requirements.txt
```

## Execution - Instructions for Recreating our Project

### Running the TripAdvisor scraper
First, use the appropriate repository by doing `cd tripadvisor_scraper`.
* `base_spider.py` - This spider gets the necessary URLs (through TripAdvisor's autocomplete) for each city that we are searching for. This only needs to be run once, and it outputs to `intermediate/urls.csv`
* `listings_spider.py` - Uses the URLs from the previous part to crawl for listings. Run with `scrapy crawl listings -o listings.json`
* `hotels_spider.py` - Scrapes hotel amenities for each listing. Run with `scrapy crawl hotels -o amenities.json` 
* `listings.json` and `amenities.json` contain price, amenities, and some other basic information for the TripAdvisor search results. 
* `reviews_spider.py` - Scrapes review text for each listing obtained from the listings spider. Run with `scrapy crawl reviews -a filename=<filename>`, where the file is a CSV with TripAdvisor URLs for each hotel. 

### Running scripts to collect data from Amadeus
In order to access the Amadeus API, [sign for an API key](https://sandbox.amadeus.com/api-catalog). Then, set an environment variable for this key. 
```
\\ On Unix-based systems:
export AMADEUS_KEY='your api key here'
\\ On Windows:
setx AMADEUS_KEY "your api key here"
``` 
We wanted to merge data from both TripAdvisor and Amadeus.
* search.py - This script searches for hotels in Amadeus based off of the coordinates of hotels we've already scraped from TripAdvisor. 
* recordPrices.py - This script searches each hotel for prices across a range of dates. 
```
cd amadeus-api
python3 search.py
python3 recordPrices.py
```

### Downloading Basic Airbnb Listing and Reviews Data
The Airbnb listings are from [Inside Airbnb](http://insideairbnb.com/get-the-data.html).

### Scraping Airbnb prices over time

### Sample Data
To see some example data that we scraped/collected/merged, see the [data folder](https://github.com/kexin-zhang/airbnb-vs-hotels/tree/master/data).

### Add data to ElasticSearch
In AWS, create a new [ElasticSearch instance](https://aws.amazon.com/elasticsearch-service/), with indices for `hotels` (all hotel data), `airbnbs` (Airbnb listing data), and `airbnb_prices` (Airbnb temporal data). See the [data folder](https://github.com/kexin-zhang/airbnb-vs-hotels/tree/master/data) for more details about uploading.

### Sentiment Analysis on Reviews
See the [reviews analysis folder](https://github.com/kexin-zhang/airbnb-vs-hotels/tree/master/reviews-nlp) for more details.

### Running the Web App
To run the web application, first set environment variables for ElasticSearch access keys:
```
export ES_KEY='your key ID here' // or setx ES_KEY "key ID" in Windows
export ES_SECRET='your secret here' // or setx ES_SECRET "secret" in Windows
```

Then, start the web application.
```
cd flask-app
python3 application.py
```
Navigate to `localhost:8000` in your browser to see the site. 

