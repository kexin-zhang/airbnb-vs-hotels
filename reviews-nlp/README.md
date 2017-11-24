# Review Analysis

Uses the [Stanford CoreNLP](https://github.com/stanfordnlp/CoreNLP) library to extract sentiment scores for reviews.

## Usage
1. Install and build the CoreNLP library. This code was written using [this commit.](https://github.com/stanfordnlp/CoreNLP/commit/adc17b44835a3eb00c1d3e8e870dd88319522974)
2. Run (providing CoreNLP its dependencies on the classpath) `Sentiment.java`. This takes two command line arguments, a source filename and an output filename. 

The pipeline considers each line of the source file to be a single document, consisting of one or more sentences.
For each sentence, I obtain a tagged sentiment tree from CoreNLP. I traverse the tree, extracting phrases and their individual sentiment scores,
along with their probability. 
Output takes the following form:
```
tokens|sentiment|probability|phrase
```
Tokens is the number of tokens from the parser pipeline.

Sentiment ranges from -2 to 2, with -2 being the most negative and 2 being the most positive. 

Results are filtered to exclude single token phrases, neutral sentiment phrases, and low probability results. 

## Sample Results
### Input
```
The food was great, but the staff was very rude.
Great location, conveient access to the subway.
I hated the room. This is not a good hotel.
The room seemed nice at first, but we found out that the bed was dusty and smelled bad.
Perfect for seeing all the sights in the city, but very expensive.
```
### Output
```
4|1|0.601|The food was great
5|1|0.637|The food was great ,
2|-1|0.628|very rude
3|-1|0.719|was very rude
5|-1|0.657|the staff was very rude
11|-1|0.568|The food was great , but the staff was very rude
12|-1|0.537|The food was great , but the staff was very rude .
=<sentence>=
=<sentence>=
===<doc>===
3|1|0.640|Great location ,
8|1|0.626|Great location , conveient access to the subway
9|1|0.712|Great location , conveient access to the subway .
=<sentence>=
===<doc>===
3|-1|0.608|hated the room
4|-1|0.636|hated the room .
5|-1|0.651|I hated the room .
=<sentence>=
2|-1|0.632|is not
2|1|0.731|good hotel
3|1|0.696|a good hotel
5|-1|0.599|is not a good hotel
6|-1|0.678|is not a good hotel .
7|-1|0.662|This is not a good hotel .
=<sentence>=
===<doc>===
8|-1|0.565|that the bed was dusty and smelled bad
10|-1|0.636|found out that the bed was dusty and smelled bad
11|-1|0.552|we found out that the bed was dusty and smelled bad
19|-1|0.557|The room seemed nice at first , but we found out that the bed was dusty and smelled bad
20|-1|0.564|The room seemed nice at first , but we found out that the bed was dusty and smelled bad .
=<sentence>=
===<doc>===
13|-1|0.558|Perfect for seeing all the sights in the city , but very expensive
14|-1|0.597|Perfect for seeing all the sights in the city , but very expensive .
=<sentence>=
===<doc>===
```
Notice how phrases in a single sentence can have opposite sentiment towards different aspects.
While the results may sometimes be incorrect for a single phrase, the high level aggregation and volume of data lets us assess listings effectively.
