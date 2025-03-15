from django.db import models

# Create your models here.


class BitcoinCandle(models.Model):
    """
    Object representing a single Bitcoin candle.
    """
    unix_date = models.IntegerField(unique=True)
    lowest_price = models.FloatField()
    highest_price = models.FloatField()
    open_price = models.FloatField()
    close_price = models.FloatField()
    volume = models.FloatField()

