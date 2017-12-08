# Data Description

Data was obtained by merging collected data from TripAdvisor and the AmadeusAPI.

`hotel_merged.json`: More features about each of the hotels
List of hotel dictionaries with the following attributes:
* tripadvisor_name
* amadeus_name
* tripadvisor_url
* amadeus_code
* tripadvisor_address
* lat
* lon
* tripadvisor_reviews: number of reviews on TripAdvisor
* tripadvisor_rating: average review score 
* tripadvisor_price_range: list with upper and lower bound of average standard daily rate, as seen on Trip Advisor
* tripadvisor_amenities: list of amenities listed on hotel's TripAdvisor page
* tripadvisor_rank: relative rank of hotel (e.g. 1 means ranked 1st of all hotels in NYC)
* tripadvisor_stars: e.g. 4 star hotel
* amadeus_address
* amadeus_amenities: list of hotel amenities from amadeus
* amadeus_awards: list of awards that the hotel has won
* location_cell: the voronoi cell that this hotel belongs to
* 2017-11-16: pricing information list (see below)
* 2017-11-26
* 2017-12-06
* 2017-12-16
* 2017-12-26

Pricing information are lists of dictionaries with the following attributes. Each dictionary has the information for a type of room in the hotel.
* rates: rate of staying at the hotel for a night in that type of room
* descriptions: description of rooms
* room_type_code
* rate_type_code
* booking_code
* rate_plan_code
* room_type_info

`location_cell_centers.csv`: Coordinates for the center of voronoi cells
* location_cell: location cell ID
* lat
* lon

`listings_tagged.csv`: Airbnb listings information (on Dropbox)
* id
* name
* listing_url
* price
* beds
* amenities
* latitude 
* longitude
* summary
* state
* location_cell: ID of the location cell that the listing belongs to, this is the ID of the closest cluster center, or -1 if the closest center is over 1 km away. 

`reviews<x>.jl` TripAdvisor reviews for each hotel (on Dropbox)
Reviews are in json lines format - each line in the file is a JSON with the following review information
* review_username: username of TripAdvisor reviewer
* review_date: date the user wrote the review
* review_location: location of the user that left the review
* rating: scale from 1 - 5
* title: title of review
* text: text content of review
* url: this is the hotel's TripAdvisor url, use this to match up reviews with hotels

# Uploading Data
`es_uploader.py` -  Python script to load data into an Elasticsearch instance.

Requires the elasticsearch package. Install it with pip: `pip install elasticsearch`

Each file can be uploaded individually with a corresponding method call in `es_uploader`.