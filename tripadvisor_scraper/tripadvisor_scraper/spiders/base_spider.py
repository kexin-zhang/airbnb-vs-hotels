import scrapy
from time import time
import json, csv

class BaseSpider(scrapy.Spider):
    """
    This spider get the autocomplete URLs necessary for searching TripAdvisor hotel pages
    """
    name = "urls"

    def start_requests(self):
        BASE_URL = 'https://www.tripadvisor.com/TypeAheadJson?action=API&startTime='+str(int(time()))+'&uiOrigin=GEOSCOPE&source=GEOSCOPE&interleaved=true&types=geo,theme_park&neighborhood_geos=true&link_type=hotel&details=true&max=12&injectNeighborhoods=true&query='
        cities = [
            'san francisco'
        ]
        urls = [BASE_URL + city for city in cities]

        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        resp = json.loads(response.body_as_unicode())
        url = resp['results'][0]['url']
        geo = resp['results'][0]['value']
        with open("intermediate/urls.csv", "a") as out:
            writer = csv.writer(out)
            writer.writerow([url, geo])
