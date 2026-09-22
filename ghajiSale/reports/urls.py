from django.urls import path
from . import views
from sales_monitor.views import checkout

urlpatterns = [
    path('api/daily-report/', views.daily_report_data, name='daily_report_data'),
    
    # Notifications API
    path('api/notifications/', views.notifications_list, name='notifications_list'),
    path('api/notifications/<int:notification_id>/mark-read/', views.notification_mark_read, name='notification_mark_read'),
    path('api/notifications/<int:notification_id>/delete/', views.notification_delete, name='notification_delete'),
    path('api/notifications/mark-all-read/', views.notification_mark_all_read, name='notification_mark_all_read'),
    path('api/notifications/clear-all/', views.notification_clear_all, name='notification_clear_all'),

    path('api/reports/', views.report_list_create, name='report_list_create'),
    path('api/reports/expense/', views.create_expense, name='create_expense'),
    path('api/reports/stock/', views.create_stock_adjustment, name='create_stock_adjustment'),
    path('api/reports/cash/', views.create_cash_difference, name='create_cash_difference'),
    path('api/reports/incident/', views.create_incident, name='create_incident'),
    path('api/reports/<str:report_type>/<int:report_id>/', views.update_report, name='update_report'),
    path('api/reports/<str:report_type>/<int:report_id>/delete/', views.delete_report, name='delete_report'),
    path('api/end-shift/', views.end_shift, name='end_shift'),
]
