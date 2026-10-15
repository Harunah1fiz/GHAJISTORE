from django.contrib.auth.models import Group
from django.db.models import Q
from reports.models import Notification


def navigation_permissions(request):
    if not request.user.is_authenticated:
        return {}

    user_groups = set(request.user.groups.values_list('name', flat=True))
    if request.user.is_superuser:
        user_groups.update(['Admin', 'Manager', 'Hybrid', 'Cashier'])

    role = 'Cashier'
    if 'Admin' in user_groups:
        role = 'Admin'
    elif 'Manager' in user_groups:
        role = 'Manager'
    elif 'Hybrid' in user_groups:
        role = 'Hybrid'

    return {
        'user_role': role,
        'show_pos': True,
        'show_reports': True,
        'show_staff_report': True,
        'show_monthly_report': role in ('Admin', 'Manager'),
        'show_product_management': role in ('Admin', 'Manager', 'Hybrid'),
        'show_staff_management': role in ('Admin', 'Manager'),
        'show_business_reports': role in ('Admin', 'Manager'),
        'show_notifications': True,
        'unread_notifications_count': Notification.objects.filter(
            is_read=False,
        ).filter(Q(user=request.user) | Q(user__isnull=True)).count(),
    }
