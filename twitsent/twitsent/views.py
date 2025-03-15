from django.views.generic import View, TemplateView
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.http import HttpResponse

import json
import re
from datetime import datetime

from api_twitter import TwitterClient
from ml_business import SentimentPredictor, convert_sentiment_score_to_prediction

api = TwitterClient()
# Takes a few seconds to initially load, so we do it on runserver
predictor = SentimentPredictor()

class Home(View):
    """
    Render the homepage of the website.
    """

    def get(self, request, *args, **kwargs):
        return render(request, "home.html")

    def post(self, request, *args, **kwargs):

        body = json.loads(request.body)
        request_type = body["request_type"]

        if request_type == "SEARCH":
            return self.search_query(request, body["search_query"])
        elif request_type == "SINGLE":
            return self.single_tweet_sentiment(request, body["tweet_url"])
        elif request_type == "CUSTOM":
            return self.custom_text_sentiment(request, body["custom_text"])

    def search_query(self, request, search_query):
        """
        Resolve a POST request for a search query.
        """
        api = TwitterClient()
        tweets = api.tweet_search(search_query, 100)

        positive_count = 0
        negative_count = 0
        average_confidence = 0
        for tweet in tweets:
            sentiment_score = predictor.predict_sentiment(tweet["text"])
            prediction, confidence_percent = convert_sentiment_score_to_prediction(sentiment_score)
            tweet["prediction"] = prediction
            tweet["confidence_percent"] = "{:2.2f}".format(confidence_percent)
            average_confidence += confidence_percent
            if prediction == "Positive":
                positive_count += 1
            elif prediction == "Negative":
                negative_count += 1

        example_tweets = tweets[:3]
        total_count = positive_count + negative_count
        if total_count != 0:
            average_confidence = average_confidence / total_count
        else:
            average_confidence = 0
        average_confidence = "{:2.2f}".format(average_confidence)

        tweet_results_html = render_to_string("tweet_results.html", { "example_tweets": example_tweets })

        context = {
            "tweet_results_html": tweet_results_html,
            "positive_count": positive_count,
            "negative_count": negative_count,
            "total_count": total_count,
            "average_confidence": average_confidence,
            "search_query": search_query
        }

        return render(request, "bulk_tweet_result_content.html", context)

    def single_tweet_sentiment(self, request, tweet_url):
        """
        Example valid tweet_url:

        https://twitter.com/NickJFuentes/status/1202326406614650880
        """
        # Find the last full number in the string.
        matched_numbers = re.findall(r'\d+', tweet_url)

        if len(matched_numbers) == 0:
            return HttpResponse("Sorry, I couldn't parse that URL.")

        tweet_id = matched_numbers[-1]
        tweet = api.get_tweet_by_id(tweet_id)

        if not tweet:
            return HttpResponse("Sorry, I couldn't find a tweet matching that URL.")

        sentiment_score = predictor.predict_sentiment(tweet["text"])
        prediction, confidence_percent = convert_sentiment_score_to_prediction(sentiment_score)
        tweet["prediction"] = prediction
        tweet["confidence_percent"] = "{:2.2f}".format(confidence_percent)

        return render(request, "tweet_results.html", { "example_tweets": [ tweet ]})

    def custom_text_sentiment(self, request, custom_text):
        """
        Pretend that the user input is a tweet.
        """
        sentiment_score = predictor.predict_sentiment(custom_text)
        prediction, confidence_percent = convert_sentiment_score_to_prediction(sentiment_score)

        pretend_tweet = {
            "url": None,
            "datetime_created": datetime.now().strftime("%B %d, %Y"),
            "author_handle": "You,",
            "author_username": None,
            "text": custom_text,
            "prediction": prediction,
            "confidence_percent": "{:2.2f}".format(confidence_percent)
        }

        return render(request, "tweet_results.html", { "example_tweets": [ pretend_tweet ]})
