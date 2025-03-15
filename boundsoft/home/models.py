from django.db import models

class ContactUs(models.Model):
    class Meta:
        verbose_name_plural = "Contact us"
    email = models.CharField(max_length=1000)
    message = models.TextField()

class DevApplication(models.Model):
    name = models.CharField(max_length=1000)
    email = models.CharField(max_length=1000)
    is_student = models.CharField(max_length=10)
    why_hire = models.TextField()
    school = models.CharField(max_length=1000)
    major = models.CharField(max_length=1000)
    graduation_date = models.CharField(max_length=1000)
