from iexfinance import Stock
from iexfinance import get_historical_data
from iexfinance import get_available_symbols

from datetime import datetime
from utility import *
from database import *

from functools import reduce

"""
Gameplan:


Problem: I don't know if the IEX Finance API can serve us minute-by-minute data.

If it can't, we have to find a new API and start all over.

Starting over TODO:
1. Get a list of all available symbols.
2. Create a table in the database for each one.
3. For each symbol, get minute-by-minute data for the last 10 years for it.
 
"""

def main():

    #tsla = Stock('TSLA')
    #tsla.get_open()
    #print(tsla.get_price())

    start = datetime(2017, 2, 9, 0, 0, 0)
    end = datetime(2017, 5, 24, 0, 0, 0)

    df = get_historical_data("AAPL", start=start, end=end, output_format='pandas')
    print(df.head())

    """

    conn, c = connect_to_database()

    stocks = get_available_symbols(output_format='pandas')

    symbols = list(map((lambda stock: stock['symbol']), stocks))

    #create tables in database for all above stocks if they don't exist
    create_tables(c, symbols)

    #TODO:
    # Implement the populate_all_stocks method. Figure out what granularity the iexfinance returns by default?

    #define start and end date/times for populating the table
    start_iso = date_to_iso8601(year=2018, month=8, day=21, hour=00, minute=0, second=0)
    #start_iso = date_to_iso8601(year=2017, month=12, day=21, hour=00, minute=0, second=0) # earliest time that GDAX has data for BCH-USD.
    end_iso = date_to_iso8601(year=2018, month=9, day=7, hour=00, minute=0, second=0)

    #use those times to populate the table
    #populate_all_stocks(c, granularity=60, start_iso=start_iso, end_iso=end_iso)

    #close database
    exit_database(conn, c)


    """















































main()
