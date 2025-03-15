import gdax  # used to connect to GDAX to get price data
from datetime import datetime  # used to convert unix time to a date/time string
import time #used to convert string times back to unix timestamps - why tf isn't this in datetime? dont ask me
import sys #used to make a loading bar in console
from matplotlib import pyplot #used for drawing graphs
import matplotlib.dates as mdates #used for graph formatting
import numpy
from utility import *
from database import *

def main():
    # data candles in database are in this format:
    # date, lowestPrice, highestPrice, openPrice, closePrice, volume

    #pc is the PublicClient API used to connect to gdax
    pc = gdax.PublicClient()
    #conn is database connection, c is database cursor
    conn, c = connect_to_database()

    #create the 'BCH_USD' table if it doesn't exist
    create_tables_old(c)

    #define start and end date/times for populating the table
    #start_iso = date_to_iso8601(year=2018, month=8, day=21, hour=00, minute=0, second=0)
    #start_iso = date_to_iso8601(year=2017, month=12, day=21, hour=00, minute=0, second=0) # earliest time that GDAX has data for BCH-USD.

    start_iso = date_to_iso8601(year=2016, month=1, day=1, hour=00, minute=0, second=0) # my chosen starting time for BTC
    end_iso = date_to_iso8601(year=2018, month=12, day=1, hour=00, minute=0, second=0)

    #use those times to populate the table
    populate_table_old(conn, c, pc, "BTC-USD", granularity=60, start_iso=start_iso, end_iso=end_iso, tableName="BTC_USD")

    #close database
    exit_database(conn, c)













































main()
