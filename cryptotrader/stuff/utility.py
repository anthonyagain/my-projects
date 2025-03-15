from datetime import datetime  # used to convert unix time to a date/time string
import time #used to convert string times back to unix timestamps - why tf isn't this in datetime? dont ask me

###################################################################
#######                  UTILITY FUNCTIONS                  #######
###################################################################

def sample_gdax_call_test(pc):
    print("SAMPLE TEST REQUEST, starts with 2018-01-05T22:00:00+00:00")
    temp = pc.get_product_historic_rates('BCH-USD', granularity=60, start="2018-01-05T22:00:00+00:00", end="2018-01-05T22:05:00+00:00")
    for i in temp:
        print(i)
    print("END SAMPLE TEST REQUEST, ends with 2018-01-05T22:05:00+00:00")

'''
    unix_to_string converts a unix date/time stamp to a readable date/time string.

    Accepts a UNIX date/time stamp string.
'''
def unix_to_iso8601(unix_string):
    return datetime.utcfromtimestamp(unix_string).isoformat() + "+00:00"

'''
    date_to_iso8601 converts individual pieces of a date/time stamp to iso8601 format,
    which looks like 2018-01-05T22:00:00+00:00. Year, month, day, T for time,
    hours, minutes, seconds, and then time zone shift (after the +).
'''
def date_to_iso8601(year, month, day, hour="00", minute="00", second="00"):
    #2018-01-05T22:00:00+00:00
    return str(year) + "-" + str(month) + "-" + str(day) + "T" + str(hour) + ":" + str(minute) + ":" + str(second) + "+00:00"

'''
    date_to_unix converts individual pieces of a date/time stamp to unix format,
    which is just a very large integer. Unix format is nice because adding 60 to it
    takes you 60 seconds ahead in time consistently.
'''
def date_to_unix(year, month, day, hour, minute, second):
    return int(time.mktime(time.strptime(str(datetime(year=year, month=month, day=day, hour=hour,
    minute=minute, second=second)), '%Y-%m-%d %H:%M:%S'))) - time.timezone

'''
    iso8601_to_unix converts an iso8601 timestamp to unix format.
'''
def iso8601_to_unix(iso8601_string):
    #get rid of the + timezone crap
    plus = iso8601_string.index("+")
    iso8601_string = iso8601_string[:plus]

    datetime_object = datetime.strptime(iso8601_string, "%Y-%m-%dT%H:%M:%S")

    return date_to_unix(datetime_object.year, datetime_object.month, datetime_object.day,
    datetime_object.hour, datetime_object.minute, datetime_object.second)
