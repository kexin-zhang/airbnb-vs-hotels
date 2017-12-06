# Data Description

Data was obtained by merging collected data from TripAdvisor and the AmadeusAPI.

`hotel_identifiers.csv`: Basic identifying information for the 265 hotels in our dataset.
* tripadvisor_name: name displayed on TripAdvisor
* amadeus_name: name displayed on Amadeus
* tripadvisor_url: acts as a unique identifier to associate hotels with TripAdvisor information
* amadeus_code: property code from Amadeus. Also acts as a unique identifier

`hotel_features_tagged.json`: More features about each of the hotels
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

`hotels<check in date>_to_<check out date>.json`: Pricing information for each hotel for the check in and check out date. All data was scraped on 2017-11-16. 
List of hotel dictionaries with the following attributes:
* rooms: list of dictionaries with information about the room type and the price of the room
* property_code: this corresponds with the amadeus_code field in the other files

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