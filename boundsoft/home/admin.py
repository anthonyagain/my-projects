from django.contrib import admin

from home.models import ContactUs
from home.models import DevApplication

def message(obj):
    """ Message, but shortened. """
    return obj.message[:100]

class ContactUsAdmin(admin.ModelAdmin):
    list_display = ('email', message)

class DevApplicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'is_student')
    readonly_fields = ['name', 'email', 'is_student', 'why_hire', 'school', 'major', 'graduation_date']

admin.site.register(ContactUs, ContactUsAdmin)
admin.site.register(DevApplication, DevApplicationAdmin)
