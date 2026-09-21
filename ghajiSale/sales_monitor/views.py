from time import timezone

from django.shortcuts import render
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.db.models import F
from .models import Sale, SaleItem

from product.models import Product, StockMovement
from django.utils import timezone
# Create your views here.
def sale(request):
    context = {
        'active_page': 'Sales Monitor',
    }
    return render(request,'dashboard/sale.html',context)

@csrf_exempt
def checkout(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'invalid Method'}, status = 405)
    
    try:
        data = json.loads(request.body)
        print(f"Received data: {data}")

        parsed_date = parse_datetime(data.get('date') or data.get('createdAt'))
        print(f"Parsed date: {parsed_date}")
        if not parsed_date:
            parsed_date = timezone.now()

        with transaction.atomic():
            sale = Sale.objects.create(
            total = float(data['total']),
            received = float(data['received']),
            date = parsed_date,
            method = data['method']
            )
            print(f"{data}")
            for item in data['items']:
                product = Product.objects.get(id=item['id'])
                SaleItem.objects.create(
                    sale = sale,
                    product = product,
                    quantity = int(item['qty']),
                    price = float(item['price']),
                    itemTotal = float(item['total'])
                )
                inventory = product.inventory
                inventory.quantity = F('quantity') - int(item['qty'])
                inventory.save()
                inventory.refresh_from_db()
                StockMovement.objects.create(
                    product = product,
                    quantity_change = int(item['qty']),
                    movement_type = 'sold',

                    
                )
                print(f"Updated inventory for {product.name}: {inventory.quantity} remaining")
        return JsonResponse({'message': 'sale Saved successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    # traceback.print_exc()
    # return JsonResponse({
    #     "error": str(e),
    #     "type": type(e).__name__
    # }, status=400)
    


#saver healthcheck endpoint
def health_check(request):
    return JsonResponse({"status": "ok"})


