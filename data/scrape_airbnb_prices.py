import pandas as pd
from bs4 import BeautifulSoup
from bs4.element import Comment
from selenium import webdriver

# File header: id,name,listing_url,price,beds,amenities,longitude,latitude,summary,state,location_cell
# Given a date range, sample num_samples listings from each location_cell and report prices for range of dates


def tag_visible(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True


def text_from_html(body):
    soup = BeautifulSoup(body, 'html.parser')
    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)
    return u" ".join(t.strip() for t in visible_texts)


if __name__ == "__main__":
    dates = {'2017-12-06': '2017-12-07', '2017-12-16': '2017-12-17', '2017-12-26': '2017-12-27'}
    df = pd.read_csv('listings_tagged.csv', encoding='latin1')
    g = df.groupby(['location_cell'], as_index=False)
    locs = df['location_cell'].unique()
    scraped = []
    num = 0
    for loc in locs:
        curr = g.get_group(loc)
        for _ in range(20):
            try:
                s = curr.sample()
                prices = [loc, s['id'].item()]
                for check_in, check_out in dates.items():
                    url = s['listing_url'].item()
                    url += '?check_in=' + check_in + '&check_out=' + check_out
                    driver = webdriver.PhantomJS()
                    driver.get(url)
                    html = driver.page_source
                    txt = text_from_html(html)
                    if 'This listing is no longer available' in txt:
                        raise Exception()
                    price = txt.split('per night')[0].split('$')[1].strip()
                    prices.append(price)
            except Exception as e:
                continue
            scraped.append(prices)
        print('loc done: ' + str(num))
        num += 1
    df_out = pd.DataFrame(scraped)
    df_out = df_out.drop_duplicates()
    df_out.to_csv('airbnb_price_output.csv', index=False, header=['location_cell', 'id', '2017-12-06 to 2017-12-07', '2017-12-16 to 2017-12-17', '2017-12-26 to 2017-12-27'])
