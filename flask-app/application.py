from flask import Flask, jsonify, render_template
import requests, os, json
from aws_requests_auth.aws_auth import AWSRequestsAuth

application = Flask(__name__)
auth = AWSRequestsAuth(aws_access_key=os.environ['ES_KEY'],
                       aws_secret_access_key=os.environ['ES_SECRET'],
                       aws_host="search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com",
                       aws_region="us-east-1",
                       aws_service="es")


@application.route("/")
def index():
    return render_template("index.html")

@application.route("/api/<location_cell>", methods=['GET'])
def esBasic(location_cell):
    payload = {
            "_source": ["tripadvisor_name", "name", "2017-11-16.rates.price", "2017-11-26.rates.price", "2017-12-06.rates.price", "2017-12-16.rates.price", "2017-12-26.rates.price", "price", "listing_url", "tripadvisor_url", "location.lat", "location.lon", "lat", "lon", "beds", "2017-11-16.room_type_info.number_of_beds", "2017-11-26.room_type_info.number_of_beds", "2017-12-06.room_type_info.number_of_beds", "2017-12-16.room_type_info.number_of_beds", "2017-12-26..room_type_info.number_of_beds"],
            "size": 4000,
            "query": {
              "match": {
                "location_cell": location_cell
              }
            }
          }
    headers = {'content-type': 'application/json'}
    response = requests.post('https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/hotels,airbnb/_search',
                            auth=auth, data=json.dumps(payload), headers=headers)
    return jsonify(json.loads(response.text))

@application.route("/api/prices/<location_cell>", methods=['GET'])
def esPrices(location_cell):
    payload = {
          "size": 4000,
          "query": {
            "match": {
                "location_cell": location_cell
            }
          }
        }
    headers = {'content-type': 'application/json'}
    response = requests.post('https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/airbnb_prices/_search',
                            auth=auth, data=json.dumps(payload), headers=headers)
    return jsonify(json.loads(response.text))

@application.route("/api/search/<location>", methods=['GET'])
def esSearch(location):
    location = location.split(",")
    lat = float(location[0])
    lon = float(location[1])
    payload = {
      "query": {
        "bool": {
          "must": {
            "match_all": {}
          },
          "filter": {
            "geo_distance": {
              "distance": "1km",
              "location": {
                "lat": lat,
                "lon": lon
              }
            }
          }
        }
      },
      "sort": [
        {
          "_geo_distance": {
            "location": {
              "lat": lat,
              "lon": lon
            },
            "order": "asc",
            "unit": "km",
            "distance_type": "plane"
          }
        }
      ]
    }
    headers = {'content-type': 'application/json'}
    response = requests.post('https://search-cx4242-airbnb-vs-hotels-lxzlxz6rpewpzksb46papky6he.us-east-1.es.amazonaws.com/hotels,airbnb/_search',
                            auth=auth, headers=headers, data=json.dumps(payload))
    return jsonify(json.loads(response.text))

if __name__ == "__main__":
    #application.debug = True
    application.run()