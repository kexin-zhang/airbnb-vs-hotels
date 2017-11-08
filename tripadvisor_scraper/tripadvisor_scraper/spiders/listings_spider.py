import scrapy
from time import time
import json, csv
from scrapy.utils.python import to_native_str
from six.moves.urllib.parse import urljoin
import re

class ListingsSpider(scrapy.Spider):
    """
    This spider scrapes the TripAdvisor hotel listings
    """
    name = "listings"
    handle_httpstatus_list = [301, 302]

    def start_requests(self):
        ### TODO: figure out what to do about dates
        DATES = '2017_12_09_2017_12_10'
        URL = "https://www.tripadvisor.com/Hotels"

        headers = {
                    'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
                    'Accept-Encoding': 'gzip,deflate',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'Host': 'www.tripadvisor.com',
                    'Pragma': 'no-cache',
                    'Referer': '',
                    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36.',
                    'X-Requested-With': 'XMLHttpRequest'
                }

        form_data = {
                'adults': '2',
                'dateBumped': 'NONE',
                'displayedSortOrder': 'popularity',
                'geo': '',
                'hs': '',
                'isFirstPageLoad': 'false',
                'rad': '0',
                'refineForm': 'true',
                'requestingServlet': 'Hotels',
                'rooms': '1',
                'scid': 'null_coupon',
                'searchAll': 'false',
                'seen': '60',
                'sequence': '7',
                'o':"0",
                'staydates': DATES
            }

        cookies=  {"SetCurrency": "USD"}

        # read from the necessary intermediate URLs
        with open("intermediate/urls.csv") as f:
            reader = csv.reader(f)
            for line in reader:
                url = urljoin('http://www.tripadvisor.com', line[0])
                geo = line[1]
                headers['Referer'] = url
                form_data['geo'] = geo
                
                yield scrapy.FormRequest(url=URL, 
                    method='POST', 
                    formdata=form_data, 
                    cookies=cookies, 
                    headers=headers, 
                    callback=self.parse,
                    meta={'seen': '0', 'url': url}
                )

    def parse(self, response):
        self.logger.info("got response %d for %r" % (response.status, response.url))

        results = 0
        for hotel in response.xpath("//div[@class='listing']"):
            results += 1

            hotel_link = hotel.xpath('.//div[@class="listing_title"]/a/@href').extract_first()
            reviews = hotel.xpath('.//span[contains(@class, "review_count")]//text()').extract_first()
            rating = hotel.xpath('.//span[contains(@class, "ui_bubble_rating")]/@alt').extract_first()
            name = hotel.xpath('.//a[contains(@class,"property_title")]//text()').extract_first()
            price = hotel.xpath('.//div[contains(@class, "available")]/@data-pernight').extract_first()
            provider = hotel.xpath('.//span[contains(@data-sizegroup,"mini-meta-provider")]//text()').extract_first()

            if rating:
                rating = rating.replace(' of 5 bubbles','').strip()
            if reviews:
                reviews = reviews.replace(' reviews', '').strip()
                reviews = reviews.replace(' review', '') # in case there's only 1 review
            if name:
                name = name.strip()
            if price:
                price = price.strip()
            if provider:
                provider = provider.strip()

            yield {
                "url": hotel_link,
                "name": name,
                "reviews": reviews, 
                "rating": rating,
                "provider": provider,
                "price": price
            }

        # handle redirection
        # this is copied/adapted from RedirectMiddleware
        if response.status >= 300 and response.status < 400:

            # HTTP header is ascii or latin1, redirected url will be percent-encoded utf-8
            location = to_native_str(response.headers['location'].decode('latin1'))

            # get the original request
            request = response.request
            # and the URL we got redirected to
            redirected_url = urljoin(request.url, location)

            if response.status in (301, 307) or request.method == 'HEAD':
                redirected = request.replace(url=redirected_url, method='GET')
                yield redirected
            else:
                redirected = request.replace(url=redirected_url, method='GET', body='')
                redirected.headers.pop('Content-Type', None)
                redirected.headers.pop('Content-Length', None)
                yield redirected

        # go to the next page
        if results > 0:
            request = response.request
            seen = int(request.meta['seen'])
            offset = seen + results 
            offset = (offset // 10) * 10
            offset = str(offset)

            form_data = {
                "plSeed": "59513313",
                "showSnippets": "False",
                "sl_location_id": "111434",
                "offset": offset,
                "reqNum": "1",
                "changeSet": "MAIN_META"
            }

            url = request.meta['url']
            next_page = request.replace(url=url, formdata=form_data, method='POST', meta={'seen': offset, 'url': url})
            yield next_page