import scrapy
import json
from six.moves.urllib.parse import urljoin
import re

class HotelSpider(scrapy.Spider):
    name = "hotels"

    def start_requests(self):
        with open("additional_listings.json") as f:
            listings = json.load(f)

        for listing in listings:
            if listing['url']:
                url = urljoin('http://www.tripadvisor.com', listing['url'])
                yield scrapy.Request(url=url, callback=self.parse, meta={'url': listing['url']})

    def parse(self, response):
        div = response.xpath('.//div[@class="top_content"]')
        amenities = div.xpath('.//li[@class="item"]//text()').extract()
        address = response.xpath(".//div[contains(@class, 'address')]/span//text()").extract()
        rank = response.xpath(".//b[@class='rank']//text()").extract_first() 
        stars = response.xpath(".//div[contains(@class, 'starRating')]/div/text()").extract_first() 
        pricerange = response.xpath(".//ul[contains(@class, 'price_range')]/li[@class='item']/text()").extract_first()

        if address:
            address = ', '.join(address)
            address = address.strip()
        if rank:
            rank = rank.replace('#', '').strip()
        if stars:
            stars = stars.strip()
        if pricerange:
            matches = re.findall('\$([\d,]+) - \$([\d,]+)', pricerange)
            if matches:
                pricerange = '-'.join(matches[0])
                pricerange = pricerange.replace(',', '')

        yield {
            'url': response.request.meta['url'],
            'amenities': amenities,
            'address': address,
            'tripadvisor rank': rank,
            'star rating': stars,
            'range': pricerange
        }