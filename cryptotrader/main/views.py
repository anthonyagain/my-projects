from django.shortcuts import render
from django.views.generic import TemplateView
from django.views import View
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers

from .models import BitcoinCandle

from datetime import datetime  # used to convert unix time to a date/time string
import time #used to convert string times back to unix timestamps - why tf isn't this in datetime? dont ask me

import sys

# Create your views here.

class HomeView(View):

    def get(self, request):
        return render(request, "home.html")

    @csrf_exempt
    def post(self, request):
        candles = serializers.serialize("json", BitcoinCandle.objects.all().order_by('unix_date'))

        return JsonResponse({"candles": candles})

class NeuralNetworkView(View):

    def get(self, request):
        return render(request, "neuralnetwork.html")

    @csrf_exempt
    def post(self, request):
        candles = serializers.serialize("json", BitcoinCandle.objects.all().order_by('unix_date'))

        return JsonResponse({"candles": candles})

class LoginView(View):
    def get(self, request):
        return render(request, "login.html")

    def post(self, request):
        if request.POST.get('username') == "macka1aj":
            return HttpResponseRedirect("/home")
        else:
            print(request.POST)
            return HttpResponseRedirect("/")

class AboutView(View):
    def get(self, request):
        return render(request, "about.html")

class CustomAlgoView(View):

    def get(self, request):
        return render(request, "customD3.html")

    @csrf_exempt
    def post(self, request):
        candles = serializers.serialize("json", BitcoinCandle.objects.all().order_by('unix_date'))

        sim1 = Simulator(starting_money=300.0, starting_crypto=0, trade_func=make_trades_algo1, num_visible_candles=13)

        end_value, trades = sim1.run_simulation()
        print(trades)

        return JsonResponse({"candles": candles,
                            "end_value": end_value,
                            "trades": trades})

class Simulator:
    def __init__(self, starting_money, starting_crypto, trade_func, num_visible_candles):
        self.starting_money = starting_money
        self.starting_crypto = starting_crypto
        self.money = starting_money
        self.crypto = starting_crypto
        self.trade_array = []
        self.trade_func = trade_func
        self.num_visible_candles = num_visible_candles

    def run_simulation(self):
        """
            Runs a trading simulation on a given table.
            Arguments:
                c, the database cursor to perform database operations
                starting_money, the desired money to run the simulation with
                table_name, the name of the table to run the simulation on

            This method's process is as follows:
                - get the first and last data from the table, verify that data exists
                - get all of the data that exists from the table
                - create a loop, pass the dataset up to the "current time" into the trade function
                    to decide if we want to make trades or not
                - after all the time has passed, print the results

        """
        # Get full price data
        full_price_data = BitcoinCandle.objects.all().order_by("unix_date")

        # Perform trading loop over timespan
        data_length = len(full_price_data)
        print("Performing simulation on {} candles.".format(str(data_length)))

        for i in range(data_length):
            first_visible_candle = i - self.num_visible_candles
            if first_visible_candle < 0:
                first_visible_candle = 0
            self.money, self.crypto = self.trade_func(full_price_data[first_visible_candle:i], self.money, self.crypto, self.trade_array)
            sys.stdout.write("\rRunning trade simulation: %d%%" % (i / data_length * 100))
            sys.stdout.flush()

        # Print the results of this simulation
        return self.print_results(), self.trade_array

    def print_results(self):
        # Get start price and end price
        start_candle = BitcoinCandle.objects.first()
        start_unix = start_candle.unix_date
        start_price = start_candle.close_price # pull close_price off candle

        end_candle = BitcoinCandle.objects.last()
        end_unix = end_candle.unix_date
        end_price = end_candle.close_price  # pull close_price off candle

        # Convert start and end time from unix to iso8601
        start_iso = unix_to_iso8601(start_unix)
        end_iso = unix_to_iso8601(end_unix)

        end_value = self.money + (self.crypto * end_price)

        print("")
        print("Start:")
        print("    {} USD".format(str(self.starting_money)))
        print("    {} crypto.".format(str(self.starting_crypto)))
        print("Time: " + str((end_unix - start_unix) / 60) + " minutes, or %.2f days." % ((end_unix - start_unix) / 86400))
        print("End Holdings: %.2f" % end_value)
        print("Made {} trades.".format(len(self.trade_array)))
        print("During the simulation time, the value of Bitcoin changed by %.2f" % (end_price - start_price))

        return end_value

def make_trades_algo1(date_price_list, money, crypto, trade_array):
    """
    Define a function that handles trades at a given point in time.
    Accepts:
        date_price_list: an array of candles from the start of data up to
            the current point. each candle is in the form:
            # date, lowestPrice, highestPrice, openPrice, closePrice, volume
        money: amount of money available to trade
        crypto: amount of crypto available to trade
        trade_array: history of trades made. Format is:
            ["Bought/Sold", price, unix_date]
    """
    # date, lowestPrice, highestPrice, openPrice, closePrice, volume

    if(len(date_price_list) < 13):
        return money, crypto
    else:
        #take last 13 elements only
        date_price_list = date_price_list[-13:]
        #take the prices only
        price_list = []
        for element in date_price_list:
            #append the closing price
            price_list.append(element.close_price)
        #calculate the average of last 13 elements
        sma_13 = sum(price_list) / 13

        current_price = date_price_list[-1].close_price
        print(current_price)

        #if current price is more than 10% higher than the sma, sell
        if(current_price * .98 > sma_13):
            money, crypto = sell_everything_market(money, crypto, current_price)
            trade_array.append(["Sold", current_price, date_price_list[-1].unix_date])
        #if current price is more than 10% lower than the sma, buy
        elif(current_price * 1.02 < sma_13):
            money, crypto = buy_everything_market(money, crypto, current_price)
            trade_array.append(["Bought", current_price, date_price_list[-1].unix_date])
        #else, do nothing
        return money, crypto

'''
    Convert all of your USD to crypto, pretending that you can buy an unlimited
    amount at the current price. This market trade is subject to a .25% fee.
'''
def buy_everything_market(money, crypto, current_price):
    if((money / current_price) > 0):
        crypto = crypto + (money / current_price)
        crypto = crypto * .9975 #trading fee
        money = 0
    return money, crypto
'''
    Convert all of your crypto to USD, pretending that you can sell an unlimited
    amount at the current price. This market trade is subject to a .25% fee.
'''
def sell_everything_market(money, crypto, current_price):
    if((crypto * current_price) > 0):
        money = money + (crypto * current_price)
        money = money * .9975 #trading fee
        crypto = 0
    return money, crypto

def date_to_unix(year, month, day, hour, minute, second):
    """
    date_to_unix converts individual pieces of a date/time stamp to unix format,
    which is just a very large integer. Unix format is nice because adding 60 to it
    takes you 60 seconds ahead in time consistently.
    """
    return int(time.mktime(time.strptime(str(datetime(year=year, month=month, day=day, hour=hour,
    minute=minute, second=second)), '%Y-%m-%d %H:%M:%S'))) - time.timezone

def iso8601_to_unix(iso8601_string):
    """
    iso8601_to_unix converts an iso8601 timestamp to unix format.
    """
    #get rid of the + timezone crap
    plus = iso8601_string.index("+")
    iso8601_string = iso8601_string[:plus]

    datetime_object = datetime.strptime(iso8601_string, "%Y-%m-%dT%H:%M:%S")

    return date_to_unix(datetime_object.year, datetime_object.month, datetime_object.day,
    datetime_object.hour, datetime_object.minute, datetime_object.second)


def date_to_iso8601(year, month, day, hour="00", minute="00", second="00"):
    """
    date_to_iso8601 converts individual pieces of a date/time stamp to iso8601 format,
    which looks like 2018-01-05T22:00:00+00:00. Year, month, day, T for time,
    hours, minutes, seconds, and then time zone shift (after the +).
    """
    return str(year) + "-" + str(month) + "-" + str(day) + "T" + str(hour) + ":" + str(minute) + ":" + str(second) + "+00:00"

'''
    data_entry inserts an element into a table in the database. If it was successful,
    it returns 0. If it hits a duplicate error, it returns 1.

    ARGUMENTS:
        c is the CURSOR of the database
        unixDateTime is the date/time in unix format of the interval
        price is the price during the interval
'''
def new_btc_candle(dataArray):
    try:
        BitcoinCandle.objects.create(unix_date=dataArray[0],
                                    lowest_price=dataArray[1],
                                    highest_price=dataArray[2],
                                    open_price=dataArray[3],
                                    close_price=dataArray[4],
                                    volume=dataArray[5])
        return 0
    except Exception as e:
        print("Error:" + str(e))
        return 1

def unix_to_iso8601(unix_string):
    return datetime.utcfromtimestamp(unix_string).isoformat() + "+00:00"
