import sqlite3 # used to store historical price data instead of querying the
               # server repeatedly
from utility import *
import sys #used to make a loading bar in console

###################################################################
#######            DATABASE OPERATION FUNCTIONS             #######
###################################################################


def select_last_test_data(c, tableName):
    single_data_size = 780

    c.execute('SELECT lowestPrice, highestPrice, openPrice, closePrice, volume FROM {} ORDER BY date DESC LIMIT {}'.format(table_name, single_data_size))

    last_interval = list(reverse(c.fetchall()))

    last_candle_in_data = last_interval[720]

    if last_candle_in_data[4] - 10 > candle_in_one_hour[4]:
        data_y = [0, 0, 1]
    elif last_candle_in_data[4] + 10 < candle_in_one_hour[4]:
        data_y = [1, 0, 0]
    else:
        data_y = [0, 1, 0]

    return last_interval[0:720], data_y

'''
    select_table returns a cursor after having selected a given table.
    accepts:
        c, the database cursor
        the name of the table as a string.
'''
def select_table(c, tableName):
    #get ALL data from the given table
    c.execute('SELECT * FROM ' + tableName)

    # perform filters on your query. can also use >, <
    # you can replace '*' with a column name to get only those columns
    #c.execute('SELECT * FROM intervalData WHERE date="45345345" AND openPrice = "1621"')

def select_from_table_with_limit_offset(c, table_name, limit, offset):

    c.execute('SELECT lowestPrice, highestPrice, openPrice, closePrice, volume FROM {} ORDER BY date LIMIT {} OFFSET {}'.format(table_name, limit, offset))

    return c.fetchall()

def get_num_candles_in_table(c, table_name):
    c.execute('SELECT count(*) FROM {}'.format(table_name))
    return c.fetchall()[0][0] / 20000


def next_batch_btc(c, batch_size, batch_counter):
    """
    Pull the next batch_size training batch.
    One 'training sample' is defined as 720 candles, each representing a minute,
    aka, the last 12 hours of data, and the goal is to use the last 12 hours
    of data to predict the price in exactly one hour.
    """
    single_data_size = 720

    mass_data_x = []
    mass_data_y = []
    for i in range(batch_size):
        print("loading batch {}/{}".format(i, batch_size))
        interval = select_from_table_with_limit_offset(c, "BTC_USD", limit=780, offset=((i * single_data_size) + (batch_counter * batch_size * single_data_size)))
        mass_data_x.append(interval[0:720])

        last_candle_in_data = interval[720]

        candle_in_one_hour = interval[-1]

        if last_candle_in_data[4] - 10 > candle_in_one_hour[4]:
            data_y = [0, 0, 1]
        elif last_candle_in_data[4] + 10 < candle_in_one_hour[4]:
            data_y = [1, 0, 0]
        else:
            data_y = [0, 1, 0]

        mass_data_y.append(data_y)

    batch_counter += 1
    return mass_data_x, mass_data_y


'''
    select_table_timeframe returns a cursor after having selected rows in a given table over a given timeframe.
    accepts:
        c, the database cursor
        the name of the table as a string.
        unix_start, the start time in unix
        unix_end, the end time in unix
'''
def get_table_ordered(c, tableName):
    #get ALL data from the given table
    c.execute('SELECT * FROM ' + tableName + ' ORDER BY date')
    return c.fetchall()

'''
    select_table_column returns a cursor after having selected a given column in a table.
    accepts:
        c, the database cursor
        the name of the table as a string.
        the name of the column in the table as a string.
'''
def select_table_column(c, tableName, columnName):
    #get ALL data from the given table
    c.execute('SELECT ' + columnName + ' FROM ' + tableName)

'''
    select_table_column_ordered returns a cursor after having selected a given column, ordered, in a table.
    accepts:
        c, the database cursor
        the name of the table as a string.
        the name of the column in the table as a string.
        orderBy, the name of the column by which the results should be ordered
'''
def select_table_column_ordered(c, tableName, columnName, orderBy):
    #get ALL data from the given table
    c.execute('SELECT ' + columnName + ' FROM ' + tableName + ' ORDER BY ' + orderBy)

'''
    create_table creates a table named 'BCH_USD' in the database if one does
    not already exist.

    it accepts one argument: c, the database cursor, which is used to write to the database.
'''
def create_tables_old(c):
    # gdax returns data in this format:
    # [unix time, lowest price, highest price, open price, close price, trading volume]

    #create the table for BCH-USD
    c.execute('CREATE TABLE IF NOT EXISTS BCH_USD(date INTEGER, lowestPrice REAL, highestPrice REAL, openPrice REAL, closePrice REAL, volume REAL)')
    c.execute('CREATE UNIQUE INDEX IF NOT EXISTS date ON BCH_USD(date)')
    #create the table for BTC-USD
    c.execute('CREATE TABLE IF NOT EXISTS BTC_USD(date INTEGER, lowestPrice REAL, highestPrice REAL, openPrice REAL, closePrice REAL, volume REAL)')
    c.execute('CREATE UNIQUE INDEX IF NOT EXISTS date ON BTC_USD(date)')

'''
    create_table creates a table named 'BCH_USD' in the database if one does
    not already exist.

    it accepts one argument: c, the database cursor, which is used to write to the database.
'''
def create_tables(c, table_name_list):

    #create the table for BCH-USD
    for table_name in table_name_list:
        # Lots of invalid characters in table names, but they are all
        # valid inside square brackets.
        table_name = '[' + table_name + ']'
        c.execute('CREATE TABLE IF NOT EXISTS ' + table_name + '(date INTEGER, lowestPrice REAL, highestPrice REAL, openPrice REAL, closePrice REAL, volume REAL)')
        c.execute('CREATE UNIQUE INDEX IF NOT EXISTS date ON ' + table_name + '(date)')

'''
    data_entry inserts an element into a table in the database. If it was successful,
    it returns 0. If it hits a duplicate error, it returns 1.

    ARGUMENTS:
        c is the CURSOR of the database
        unixDateTime is the date/time in unix format of the interval
        price is the price during the interval
'''
def data_entry(c, dataArray, tableName):
    try:
        c.execute("INSERT INTO " + tableName + " (date, lowestPrice, highestPrice, openPrice, closePrice, volume) VALUES (?, ?, ?, ?, ?, ?)",
        (dataArray[0], dataArray[1], dataArray[2], dataArray[3], dataArray[4], dataArray[5]))
        return 0
    except sqlite3.IntegrityError as e:
        return 1

'''
    actually_get_data gets the actual pricing data for a start and end time of
    your choice.

    ARGUMENTS:
        c is the database cursor that is used to write to the database
        pc is the public client that is used to connect to the API
        currency_pair must be a valid string for a currency pair, IE, 'BCH-USD'
        granularity is the amount of seconds before the next interval, and must be one
        of the following: 60, 300, 900, 3600, 21600, 86400
        start_time and end_time are both times in unix. see unix conversion method
        start_time must be a number that is ____ than end time.
        tableName is the name of the table in the database we are inserting into.

    HOW DOES THIS METHOD WORK?
        The GDAX api will only return 350 intervals of data at a time.
            (I define an interval as price data for a single point in time.)
        Therefore, we take the start time, calculate the time 350 intervals ahead,
        and pass that in as the end time. Set the start time equal to the end time
        plus one, and repeat.
    1. Define a start time in unix and an end time in unix.
    2.
'''
def populate_table_old(conn, c, pc, currency_pair, granularity, start_iso, end_iso, tableName):

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
        try:
            temp_data = pc.get_product_historic_rates(currency_pair, granularity=granularity, start=(unix_to_iso8601(start_unix)), end=(unix_to_iso8601(start_unix + (REQUEST_LENGTH * granularity))))
            start_unix += (REQUEST_LENGTH * granularity)
        except:
            start_unix += (REQUEST_LENGTH * granularity)
            continue

        if(type(temp_data) == dict):  #check if GDAX chose not to return data
            print("Error: " + str(temp_data))
            #exit_database(conn, c)
            #return
            continue
        elif((type(temp_data) == list) and (len(temp_data) == 0)):
            #exit_database(conn, c)
            print("Error: Data not found for that timeframe.")
            continue
            #raise ValueError("GDAX has no data for that timeframe.")  #GDAX will only send you data from the last three months.
        elif(type(temp_data) == list):
            for interval in temp_data:
                duplicate_entries += data_entry(c, interval, tableName)
                total_entry_attempts += 1
        #update the status of data loading
        sys.stdout.write("\rPopulating database with GDAX price history: %d%%" % (100 - (end_unix - start_unix) / distance * 100))
        sys.stdout.flush()

    print("\n" + str(duplicate_entries) + "/" + str(total_entry_attempts) + " duplicate entry attempts.")

def populate_table(c, start_iso, end_iso, tableName):

    #convert iso inputs to unix so math can be done on them
    #start_unix = iso8601_to_unix(start_iso)
    #end_unix = iso8601_to_unix(end_iso)
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
            for interval in temp_data:
                duplicate_entries += data_entry(c, interval, tableName)
                total_entry_attempts += 1
        #update the status of data loading
        sys.stdout.write("\rPopulating database with GDAX price history: %d%%" % (100 - (end_unix - start_unix) / distance * 100))
        sys.stdout.flush()

    print("\n" + str(duplicate_entries) + "/" + str(total_entry_attempts) + " duplicate entry attempts.")

def connect_to_database():
    # either create or connect to our database
    conn = sqlite3.connect('historicalData.db')
    # get the database "cursor", used for database operations
    c = conn.cursor()

    return conn, c

def exit_database(conn, c):
    conn.commit()  #save the changes
    c.close()     #close the cursor
    conn.close()   #close the connection
