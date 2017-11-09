import csv
from collections import defaultdict
from pprint import pprint

import datetime
import time
import pandas
import gensim

def get_timestamp():
    ts = time.time()
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

# Read dataset
print(get_timestamp(), 'Reading dataset from file...')
dataset = pandas.read_csv('reviews.csv', quotechar='\"')
documents = pandas.Series.tolist(dataset['comments'])

# Read stopwords from file
print(get_timestamp(), 'Reading stopwords from file...')
stoplist = []
with open('stopwords.txt') as stopwordfile:
    file_reader = csv.reader(stopwordfile, delimiter='\n')
    for row in file_reader:
        stoplist.append(row[0])

# Remove stopwords
print(get_timestamp(), 'Removing stop words...')
texts = [[word for word in str(document).lower().split() if word not in stoplist] for document in documents]

print(get_timestamp(), 'Counting word frequencies...')
frequency = defaultdict(int)
for text in texts:
    for token in text:
        frequency[token] += 1

print(get_timestamp(), 'Removing words that only appear once...')
texts = [[token for token in text if frequency[token] > 1] for text in texts]

print(get_timestamp(), 'Generating corpus...')
dictionary = gensim.corpora.Dictionary(texts)
corpus = [dictionary.doc2bow(text) for text in texts]

print(get_timestamp(), 'Generating LDA model...')
lda = gensim.models.ldamodel.LdaModel(corpus=corpus)

print(get_timestamp(), 'Finished.')
lda.print_topics(20)