from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
def index(request):
    context = {
        'active_page': 'pos'
    }
    return render(request,'dashboard/index.html',context)



def staffSale(request):
    context = {
        'active_page': 'Staff Report'
    }
    return render(request,'dashboard/staff_profit.html',context)

def monthlyReport(request):
    context = {
        'active_page': 'Monthly Report'
    }
    return render(request,'dashboard/monthly_report.html',context)

