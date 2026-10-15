import json
import logging
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.core import signing
from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import ensure_csrf_cookie

from accounts.decorators import login_required_json, role_required
from product.models import Inventory, Product, StockMovement
from .models import Sale, SaleItem

logger = logging.getLogger(__name__)
OFFLINE_TICKET_SALT = 'sales_monitor.offline-attribution'
OFFLINE_TICKET_MAX_AGE = 60 * 60 * 24 * 90
User = get_user_model()


def issue_offline_attribution_ticket(user):
    return signing.dumps({'user_id': user.pk}, salt=OFFLINE_TICKET_SALT)


@login_required_json
@role_required('Admin', 'Manager', 'Hybrid', 'Cashier')
@ensure_csrf_cookie
def sale(request):
    return render(request, 'dashboard/sale.html', {
        'active_page': 'Sales Monitor',
        'offline_attribution_ticket': issue_offline_attribution_ticket(request.user),
    })


@login_required_json
@role_required('Admin', 'Manager', 'Hybrid', 'Cashier')
def checkout(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    offline_ticket = data.get('offlineAttributionTicket')
    if data.get('offlineSync') and not offline_ticket:
        return JsonResponse({'error': 'Offline attribution ticket is required'}, status=403)

    cashier = request.user
    if offline_ticket:
        try:
            payload = signing.loads(
                offline_ticket,
                salt=OFFLINE_TICKET_SALT,
                max_age=OFFLINE_TICKET_MAX_AGE,
            )
            ticket_user = User.objects.get(pk=payload['user_id'], is_active=True)
        except (signing.BadSignature, User.DoesNotExist, KeyError, TypeError, ValueError):
            return JsonResponse({'error': 'Invalid or expired offline attribution ticket'}, status=403)
        if data.get('offlineSync'):
            cashier = ticket_user

    transaction_id = data.get('transactionId')
    if transaction_id:
        existing_sale = Sale.objects.filter(transaction_id=transaction_id).first()
        if existing_sale:
            return JsonResponse({
                'message': 'sale already processed (idempotent)',
                'cashier_id': existing_sale.cashier_id,
            })

    try:
        date_value = data.get('date') or data.get('createdAt')
        parsed_date = parse_datetime(date_value) if isinstance(date_value, str) else None
        if not parsed_date:
            parsed_date = timezone.now()
        if timezone.is_naive(parsed_date):
            parsed_date = timezone.make_aware(parsed_date, timezone.get_current_timezone())

        total = Decimal(str(data['total']))
        received = Decimal(str(data['received']))
        items = data['items']
        if not isinstance(items, list) or not items:
            return JsonResponse({'error': 'At least one sale item is required'}, status=400)

        with transaction.atomic():
            sale = Sale.objects.create(
                cashier=cashier,
                total=total,
                received=received,
                date=parsed_date,
                method=data.get('method', 'cash'),
                transaction_id=transaction_id,
                device_id=data.get('deviceId'),
            )

            product_ids = [int(item['id']) for item in items]
            inventories = {
                inventory.product_id: inventory
                for inventory in Inventory.objects.filter(product_id__in=product_ids).select_for_update()
            }

            for item in items:
                product = Product.objects.get(id=int(item['id']))
                sale_quantity = int(item.get('quantityUnits') or item.get('qty') or 0)
                unit_price = Decimal(str(item.get('price') or 0))
                line_total = Decimal(str(item.get('total') or 0))
                if sale_quantity <= 0:
                    raise ValueError(f'Invalid quantity for {product.name}')

                inventory = inventories.get(product.id)
                if inventory is None:
                    raise ValueError(f'Inventory record missing for {product.name}')
                if inventory.quantity < sale_quantity:
                    raise ValueError(f'Insufficient stock for {product.name}: only {inventory.quantity} left')

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=sale_quantity,
                    price=unit_price,
                    itemTotal=line_total,
                )
                inventory.quantity = F('quantity') - sale_quantity
                inventory.save(update_fields=['quantity'])
                inventory.refresh_from_db(fields=['quantity'])

                StockMovement.objects.create(
                    product=product,
                    quantity_change=-sale_quantity,
                    movement_type='sold',
                )

        return JsonResponse({'message': 'sale Saved successfully', 'cashier_id': cashier.pk})
    except (KeyError, TypeError, ValueError, InvalidOperation, Product.DoesNotExist) as error:
        logger.warning('Checkout payload rejected: %s', error)
        return JsonResponse({'error': 'Invalid sale data or insufficient inventory'}, status=400)
    except Exception:
        logger.exception('Checkout request failed')
        return JsonResponse({'error': 'Sale could not be saved; retry using the same transaction ID'}, status=500)


def health_check(request):
    return JsonResponse({'status': 'ok'})
