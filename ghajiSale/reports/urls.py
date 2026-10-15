from django.urls import path
from . import views
from accounts.decorators import role_required

staff_access = role_required('Admin', 'Manager', 'Hybrid', 'Cashier')

urlpatterns = [
    path('api/daily-report/', staff_access(views.daily_report_data), name='daily_report_data'),
    
    # Notifications API
    path('api/notifications/', staff_access(views.notifications_list), name='notifications_list'),
    path('api/notifications/<int:notification_id>/mark-read/', staff_access(views.notification_mark_read), name='notification_mark_read'),
    path('api/notifications/<int:notification_id>/delete/', staff_access(views.notification_delete), name='notification_delete'),
    path('api/notifications/mark-all-read/', staff_access(views.notification_mark_all_read), name='notification_mark_all_read'),
    path('api/notifications/clear-all/', staff_access(views.notification_clear_all), name='notification_clear_all'),

    path('api/reports/', staff_access(views.report_list_create), name='report_list_create'),
    path('api/reports/expense/', role_required('Admin', 'Manager')(views.create_expense), name='create_expense'),
    path('api/reports/stock/', role_required('Admin', 'Manager')(views.create_stock_adjustment), name='create_stock_adjustment'),
    path('api/reports/cash/', staff_access(views.create_cash_difference), name='create_cash_difference'),
    path('api/reports/incident/', staff_access(views.create_incident), name='create_incident'),
    path('api/reports/<str:report_type>/<int:report_id>/', staff_access(views.update_report), name='update_report'),
    path('api/reports/<str:report_type>/<int:report_id>/delete/', staff_access(views.delete_report), name='delete_report'),
    path('api/end-shift/', staff_access(views.end_shift), name='end_shift'),
]
