import scrapy
from time import time
import json, csv
from six.moves.urllib.parse import urljoin
import re

class ReviewsSpider(scrapy.Spider):
    """
    This spider get the reviews for a hotel
    """
    name = "reviews"

    def start_requests(self):       
        with open("output/nyc_listingsv2.json") as f:
            hotels = json.load(f)

        for item in hotels:
            url = urljoin('http://www.tripadvisor.com', item["url"])
            yield scrapy.Request(url=url, callback=self.parse, meta={'url': item['url'], 'currentStart': True})


    def parse(self, response):
        url_start = 'http://www.tripadvisor.com'

        # go to initial review
        if response.request.meta['currentStart']:
            first_review = response.xpath('.//div[contains(@class, "quote")]//a/@href').extract_first() 
            if first_review:
                yield scrapy.Request(urljoin(url_start, first_review), callback=self.parse, meta={'url': response.request.meta['url'], 'currentStart': False})

        else:
            divs = response.xpath(".//div[contains(@class, 'hsx_review')]") 
            for div in divs:
                title = div.xpath(".//div[contains(@class, 'quote')]//text()").extract_first() 
                rating = div.xpath(".//span[contains(@class, 'ui_bubble_rating')]//@class").extract_first()
                if rating:
                    res = re.search('bubble_(\d+)', rating)
                    if res:
                        rating = res.group(1)
                        rating = int(rating) / 10
                text = div.xpath('.//div[contains(@class, "prw_reviews_text_summary_hsx")]//text()').extract()
                if text:
                    text = ' '.join(text)
                review_date = div.xpath('.//span[contains(@class, "ratingDate")]//@title').extract_first()  
                review_username = div.xpath('.//div[contains(@class, "username")]//text()').extract_first() 
                review_location = div.xpath('.//div[contains(@class, "location")]//text()').extract_first() 

                yield {
                    'url': response.request.meta['url'],
                    'title': title,
                    'rating': rating,
                    'text': text,
                    'review_date': review_date,
                    'review_username': review_username,
                    'review_location': review_location
                }

            next_page = response.xpath('.//a[contains(@class, "next")]//@href').extract_first()  
            if next_page:
                yield scrapy.Request(urljoin(url_start, next_page), callback=self.parse, meta={'url': response.request.meta['url'], 'currentStart': False})