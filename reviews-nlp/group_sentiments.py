import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import json

from collections import defaultdict

#read and merge hotel data
with open('../data/hotels_features_tagged.json', 'r') as f:
    hotels_tagged = json.load(f)

url_map = {}
for hotel in hotels_tagged:
    url_map[hotel['tripadvisor_url']] = hotel['location_cell']

print("Total Tags: " + str(len(url_map)))

hotel_scores = {}

for i in range(1, 8):
    with open('ReviewSentiment/datasets/reviews{}_scores.json'.format(i), 'r') as f:
        hotel_scores.update(json.load(f))

print("Total Hotels: " + str(len(hotel_scores)))

hotel_groups = defaultdict(list)

for hotel_url in hotel_scores:
    if hotel_url not in url_map:
        print("Skipping", hotel_url)
        continue
    group = url_map[hotel_url]
    hotel_groups[group].append(hotel_scores[hotel_url])


#read and merge airbnb data
air_tagged = pd.read_csv('../data/listings_tagged.csv',
                            index_col=None,
                            encoding='latin-1')
listing_id_map = {str(i) : int(g) for i, g in zip(air_tagged.id, air_tagged.location_cell)}

with open('ReviewSentiment/datasets/air_scores.json', 'r') as f:
    air_scores = json.load(f)

air_groups = defaultdict(list)
for listing_id in air_scores:
    group = listing_id_map[listing_id]
    air_groups[group].append(air_scores[listing_id])

def average_scores(groups):
    scores = {}
    for group_id in groups:
        score = {}
        for aspect in ['location', 'hospitality', 'room_quality']:
            s = 0
            c = 0
            for listing in groups[group_id]:
                s += listing[aspect]['sum_sentiment']
                c += listing[aspect]['count']
            score[aspect] = (s / c if c != 0 else 0)
        scores[group_id] = score
    return scores

hotel_scores = average_scores(hotel_groups)
hotel_scores = pd.DataFrame().from_dict(hotel_scores, orient='index')
air_scores = average_scores(air_groups)
air_scores = pd.DataFrame().from_dict(air_scores, orient='index')

location_mean = np.mean(np.concatenate((hotel_scores.location, air_scores.location)))
hospitality_mean = np.mean(np.concatenate((hotel_scores.hospitality, air_scores.hospitality)))
room_quality_mean = np.mean(np.concatenate((hotel_scores.room_quality, air_scores.room_quality)))
print(location_mean, hospitality_mean, room_quality_mean)

hotel_scores['location']        = hotel_scores.location - location_mean
hotel_scores['hospitality']     = hotel_scores.hospitality - hospitality_mean
hotel_scores['room_quality']    = hotel_scores.room_quality - room_quality_mean

air_scores['location']        = air_scores.location - location_mean
air_scores['hospitality']     = air_scores.hospitality - hospitality_mean
air_scores['room_quality']    = air_scores.room_quality - room_quality_mean

hotel_scores.index.name = 'location_tag'
hotel_scores.to_csv('../data/hotel_sentiments.csv')
air_scores.index.name = 'location_tag'
air_scores.to_csv('../data/air_sentiments.csv')

print(hotel_scores.describe())
print(air_scores.describe())
