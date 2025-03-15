from django.contrib import admin
from .models import BitcoinCandle
import gdax
from datetime import datetime  # used to convert unix time to a date/time string
import time #used to convert string times back to unix timestamps - why tf isn't this in datetime? dont ask me
import sys #used to make a loading bar in console

# Register your models here.

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

def populate_table(pc, granularity, start_iso, end_iso):

    currency_pair = "BTC-USD"

    #convert iso inputs to unix so math can be done on them
    start_unix = iso8601_to_unix(start_iso)
    end_unix = iso8601_to_unix(end_iso)
    distance = end_unix - start_unix #used for displaying % done
    duplicate_entries = 0
    total_entry_attempts = 0

    REQUEST_LENGTH = 250  # maximum number of intervals that can be requested in one call - is technically 350, but we go lower for safety

    while(start_unix < end_unix):
        time.sleep(.7)  #If we call GDAX too many times too quickly, they stop returning data.

        # each element of the array returned by get_product_historic_rates is an array in this format:
        # [unix time, lowest price, highest price, open price, close price, trading volume]
        temp_data = pc.get_product_historic_rates(currency_pair, granularity=granularity, start=(unix_to_iso8601(start_unix)), end=(unix_to_iso8601(start_unix + (REQUEST_LENGTH * granularity))))
        start_unix += (REQUEST_LENGTH * granularity)

        if(type(temp_data) == dict):  #check if GDAX chose not to return data
            print("Error: " + str(temp_data))
        elif((type(temp_data) == list) and (len(temp_data) == 0)):
            raise ValueError("GDAX has no data for that timeframe.")  #GDAX will only send you data from the last three months.
        elif(type(temp_data) == list):
            for candle in temp_data:
                duplicate_entries += new_btc_candle(candle)
                total_entry_attempts += 1
        #update the status of data loading
        sys.stdout.write("\rPopulating database with GDAX price history: %d%%" % (100 - (end_unix - start_unix) / distance * 100))
        sys.stdout.flush()

    print("\n" + str(duplicate_entries) + "/" + str(total_entry_attempts) + " duplicate entry attempts.")

class BitcoinCandleAdmin(admin.ModelAdmin):
    actions = ['get_candles_from_gdax']

    def get_candles_from_gdax(self, request, queryset):
        start_iso = date_to_iso8601(year=2018, month=10, day=20, hour=00, minute=0, second=0) #earliest time that GDAX has data for BCH-USD.
        end_iso = date_to_iso8601(year=2018, month=11, day=20, hour=00, minute=0, second=0)

        pc = gdax.PublicClient()

        populate_table(pc=pc, granularity=60, start_iso=start_iso, end_iso=end_iso)



admin.site.register(BitcoinCandle, BitcoinCandleAdmin)