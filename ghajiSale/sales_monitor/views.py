from time import timezone

from django.shortcuts import render
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.utils.dateparse import parse_datetime
from django.db.models import F
from decimal import Decimal
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
    """
    Checkout endpoint with idempotency and row-level locking for inventory.
    Expects JSON payload with transactionId, deviceId, createdAt/date, total, received, items[]

    Behavior:
    - If transactionId is provided and a Sale with that transaction_id already exists, returns success (idempotent).
    - Uses select_for_update on Inventory rows to avoid race conditions when deducting stock.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'invalid Method'}, status=405)

    try:
        data = json.loads(request.body)
        parsed_date = parse_datetime(data.get('date') or data.get('createdAt'))
        if not parsed_date:
            parsed_date = timezone.now()

        transaction_id = data.get('transactionId')
        # Idempotency: if transaction_id provided and already exists, return success
        if transaction_id:
            if Sale.objects.filter(transaction_id=transaction_id).exists():
                return JsonResponse({'message': 'sale already processed (idempotent)'})

        with transaction.atomic():
            # We'll lock involved inventory rows to prevent concurrent deductions
            sale = Sale.objects.create(
                total=Decimal(str(data['total'])),
                received=Decimal(str(data['received'])),
                date=parsed_date,
                method=data.get('method', 'cash'),
                transaction_id=transaction_id,
                device_id=data.get('deviceId'),
            )

            # Collect inventory PKs to lock them all at once
            product_ids = [int(item['id']) for item in data['items']]
            inventories = {inv.product_id: inv for inv in Product.objects.filter(id__in=product_ids).select_related('product').select_for_update()} 

            for item in data['items']:
                product = Product.objects.get(id=item['id'])
                sale_quantity = int(item.get('quantityUnits') or item.get('qty') or 0)
                unit_price = Decimal(str(item.get('price') or 0))
                line_total = Decimal(str(item.get('total') or 0))

                if sale_quantity <= 0:
                    raise ValueError(f"Invalid quantity for {product.name}")

                inventory = inventories.get(product.id) or product.inventory

                if inventory.quantity < sale_quantity:
                    raise ValueError(f"Insufficient stock for {product.name}: only {inventory.quantity} left")

                sale_item = SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=sale_quantity,
                    price=unit_price,
                    itemTotal=line_total,
                )

                # use F expression to avoid race conditions
                inventory.quantity = F('quantity') - sale_quantity
                inventory.save(update_fields=['quantity'])
                inventory.refresh_from_db()

                StockMovement.objects.create(
                    product=product,
                    quantity_change=-sale_quantity,
                    movement_type='sold',
                )

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


