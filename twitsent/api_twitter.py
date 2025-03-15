import tweepy
from tweepy import OAuthHandler

from ml_business import SentimentPredictor

from pprint import pprint
from datetime import datetime

class TwitterClient():

    def __init__(self):
        CONSUMER_KEY = ''
        CONSUMER_SECRET = ''
        ACCESS_TOKEN_KEY = ''
        ACCESS_TOKEN_SECRET = ''

        try:
            self.auth = OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
            self.auth.set_access_token(ACCESS_TOKEN_KEY, ACCESS_TOKEN_SECRET)
            self.api = tweepy.API(self.auth)
        except:
            print("Error: Authentication Failed")

    def tweet_search(self, query, count):
        """
        The maximum tweets the Twitter API allows you to retrieve in a search
        is 100.

        They also restrict you to only 18 requests every 15 minutes.
        """
        try:
            # without the tweet_mode="extended" flag, the API doesn't retrieve
            # the full tweet text, it is truncated
            return self.clean_tweets(self.api.search(q=query, count=count, tweet_mode="extended"))
        except tweepy.TweepError as e:
            raise Exception("Error fetching from Twitter API: " + str(e))

    def get_tweet_by_id(self, id):
        try:
            # without the tweet_mode="extended" flag, the API doesn't retrieve
            # the full tweet text, it is truncated
            cleaned = self.clean_tweets(self.api.statuses_lookup([id]))
            if len(cleaned) == 0:
                # Couldn't find a tweet with that ID.
                return None
            else:
                return cleaned[0]
        except tweepy.TweepError as e:
            raise Exception("Error fetching from Twitter API: " + str(e))

    def clean_tweets(self, tweet_objects):
        """
        Parse off only the fields that our app needs off of each tweet:
        - URL of tweet
        - person's handle
        - person's username
        - tweet content
        - tweet date

        Tweet URLs can be constructed like so: f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}"
        """

        cleaned_tweets = []
        for tweet in tweet_objects:
            # Do we want to filter out retweets? For now, no.
            # is_retweet = ("retweeted_status" in tweet._json)
            cleaned_tweets.append({
                "url": f"https://twitter.com/{tweet.user.screen_name}/status/{tweet.id}",
                "datetime_created": tweet.created_at.strftime("%B %d, %Y"),
                "author_handle": tweet.user.name,
                "author_username": tweet.user.screen_name,
                "text": tweet._json.get("full_text", tweet._json.get("text", None))
            })
        return cleaned_tweets
