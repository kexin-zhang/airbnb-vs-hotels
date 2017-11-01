import scrapy
import json
from six.moves.urllib.parse import urljoin

class HotelSpider(scrapy.Spider):
    name = "hotels"

    def start_requests(self):
        with open("nyc_listings1.json") as f:
            listings = json.load(f)

        for listing in listings:
            if listing['url']:
                url = urljoin('http://www.tripadvisor.com', listing['url'])
                yield scrapy.Request(url=url, callback=self.parse, meta={'url': listing['url']})

    def parse(self, response):
        div = response.xpath('.//div[@class="top_content"]')
        amenities = div.xpath('.//li[@class="item"]//text()').extract() 

        yield {
            'url': response.request.meta['url'],
            'amenities': amenities
        }