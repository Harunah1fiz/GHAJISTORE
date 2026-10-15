from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from accounts.decorators import role_required
from sales_monitor.views import issue_offline_attribution_ticket
# Create your views here.
@login_required
@role_required('Admin', 'Manager', 'Hybrid', 'Cashier')
@ensure_csrf_cookie
def index(request):
    context = {
        'active_page': 'pos',
        'offline_attribution_ticket': issue_offline_attribution_ticket(request.user),
    }
    return render(request,'dashboard/sale.html',context)


@login_required
@role_required('Admin', 'Manager', 'Hybrid', 'Cashier')
@ensure_csrf_cookie
def staffSale(request):
    context = {
        'active_page': 'Staff Report',
        'cashier_name': request.user.get_full_name() or request.user.username,
    }
    return render(request,'dashboard/staff_profit.html',context)


@login_required
@role_required('Admin', 'Manager')
def monthlyReport(request):
    context = {
        'active_page': 'Monthly Report'
    }
    return render(request,'dashboard/monthly_report.html',context)
