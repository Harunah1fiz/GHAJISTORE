from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
# Create your views here.
@login_required
def index(request):
    context = {
        'active_page': 'pos'
    }
    return render(request,'dashboard/sale.html',context)


@login_required
def staffSale(request):
    context = {
        'active_page': 'Staff Report'
    }
    return render(request,'dashboard/staff_profit.html',context)
@login_required
def monthlyReport(request):
    context = {
        'active_page': 'Monthly Report'
    }
    return render(request,'dashboard/monthly_report.html',context)

