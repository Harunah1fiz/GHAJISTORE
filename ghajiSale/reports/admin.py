from django.contrib import admin
from .models import CashDifference, EndShift, Expense, Incident, Notification, Report, StockAdjustment

# Register your models here.
admin.site.register(Expense)
admin.site.register(Notification)
admin.site.register(StockAdjustment)
admin.site.register(CashDifference)
admin.site.register(Incident)
admin.site.register(Report)
admin.site.register(EndShift)
