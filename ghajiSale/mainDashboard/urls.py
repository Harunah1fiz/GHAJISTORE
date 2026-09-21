from django.urls import path
from . import views
urlpatterns = [
    path('', views.index, name='main_dashboard'),
    path('staff-report/', views.staffSale, name='staff_report_page'),
    path('monthly-report/', views.monthlyReport, name='monthly_report_page'),
]