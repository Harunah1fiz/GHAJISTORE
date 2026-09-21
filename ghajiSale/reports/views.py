from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta

from django.http import JsonResponse
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum

from accounts.decorators import login_required_json, group_required
from .models import (
    Report,
    Expense,
    StockAdjustment,
    CashDifference,
    Incident,
    EndShift,
    Notification,
)
from sales_monitor.models import Sale, SaleItem
from product.models import Product, Inventory
from analytics.views import get_profit_for_queryset
from .services import report_to_summary, log_activity, create_notification
import json

EXPENSE_CATEGORY_CHOICES = {choice[0] for choice in Expense.CATEGORY_CHOICES}
INCIDENT_SEVERITY_CHOICES = {choice[0] for choice in Incident.SEVERITY_CHOICES}
DEFAULT_STOCK_ADJUSTMENT_TYPE = "deducted"


def _parse_selected_date(request):
    date_str = request.GET.get('date')
    if not date_str:
        return None, JsonResponse({'error': 'Missing date parameter'}, status=400)

    selected_date = parse_date(date_str)
    if not selected_date:
        return None, JsonResponse({'error': 'Invalid date'}, status=400)

    return selected_date, None


def _create_datetime_for_date(date):
    now = timezone.localtime()
    if date == now.date():
        return now

    created_at = datetime.combine(date, now.timetz())
    if timezone.is_naive(created_at):
        created_at = timezone.make_aware(created_at, timezone.get_current_timezone())

    return created_at


def _format_validation_error(message):
    return JsonResponse({'error': message}, status=400)


def _create_notification(report, message, user=None, icon='bell'):
    create_notification(
        title=f"New {report.get_report_type_display()}",
        message=message,
        user=user,
        icon=icon,
        report=report,
    )


def _create_system_notification(title, message, user=None, icon='bell'):
    create_notification(title=title, message=message, user=user, icon=icon, report=None)


def _collect_reports_for_date(selected_date):
    expense_reports = Expense.objects.select_related('report').filter(report__created_at__date=selected_date, report__is_deleted=False)
    stock_reports = StockAdjustment.objects.select_related('report', 'product').filter(report__created_at__date=selected_date, report__is_deleted=False)
    cash_reports = CashDifference.objects.select_related('report').filter(report__created_at__date=selected_date, report__is_deleted=False)
    incident_reports = Incident.objects.select_related('report').filter(report__created_at__date=selected_date, report__is_deleted=False)
    

    reports = [
        report_to_summary('expense', expense)
        for expense in expense_reports
    ]
    reports.extend(report_to_summary('stock', stock) for stock in stock_reports)
    reports.extend(report_to_summary('cash', cash) for cash in cash_reports)
    reports.extend(report_to_summary('incident', incident) for incident in incident_reports)

    reports.sort(key=lambda report: report['created_at'], reverse=True)
    
    for report in reports:
        report.pop('created_at', None)

    return reports


def daily_report_data(request):
    selected_date, error = _parse_selected_date(request)
    if error:
        return error

    sales = Sale.objects.filter(date__date=selected_date)
    cash_sales = sales.filter(method='cash').aggregate(total=Sum('total'))['total'] or Decimal('0')
    cardtransfer_sales = sales.filter(method__in=['card', 'transfer']).aggregate(total=Sum('total'))['total'] or Decimal('0')
    total_sales = sales.aggregate(total=Sum('total'))['total'] or Decimal('0')
    num_transactions = sales.count()
    items = SaleItem.objects.filter(sale__date__date=selected_date)
    items_sold = items.aggregate(total=Sum('quantity'))['total'] or 0
    profit = get_profit_for_queryset(items) or Decimal('0')

    yesterday_sales = Sale.objects.filter(date__date=selected_date - timedelta(days=1)).aggregate(total=Sum('total'))['total'] or Decimal('0')
    total_expenses = Expense.objects.filter(report__created_at__date=selected_date, report__is_deleted=False).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    expected_cash = yesterday_sales + cash_sales - total_expenses
    total_stock_adjustments = StockAdjustment.objects.filter(report__created_at__date=selected_date, report__is_deleted=False).count()
    total_cash_differences = CashDifference.objects.filter(report__created_at__date=selected_date, report__is_deleted=False).count()
    total_incidents = Incident.objects.filter(report__created_at__date=selected_date, report__is_deleted=False).count()

    return JsonResponse({
        'summary': {
            'total_sales': float(total_sales),
            'cash_sales': float(cash_sales),
            'card_transfer': float(cardtransfer_sales),
            'num_transactions': num_transactions,
            'items_sold': items_sold,
            'profit': float(profit),
            'expected_cash': float(expected_cash),
            'total_expenses': float(total_expenses),
            'stock_adjustments': total_stock_adjustments,
            'cash_differences': total_cash_differences,
            'incidents': total_incidents,
            'opening_balance': float(yesterday_sales),
        },
        'reports': _collect_reports_for_date(selected_date),
    })


def report_list_create(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Only GET is allowed on this endpoint.'}, status=405)

    selected_date, error = _parse_selected_date(request)
    if error:
        return error

    return JsonResponse({'reports': _collect_reports_for_date(selected_date)})


def _get_request_body(request):
    try:
        return json.loads(request.body)
    except json.JSONDecodeError:
        return None


def _create_report(report_type, selected_date):
    report = Report.objects.create(report_type=report_type)
    report.created_at = _create_datetime_for_date(selected_date)
    report.save(update_fields=['created_at'])
    return report


def create_expense(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    selected_date, error = _parse_selected_date(request)
    if error:
        return error

    body = _get_request_body(request)
    if body is None:
        return _format_validation_error('JSON body is required')

    category = str(body.get('category', '')).strip().lower()
    amount = body.get('amount')
    description = str(body.get('description', '')).strip()

    if not category or category not in EXPENSE_CATEGORY_CHOICES:
        return _format_validation_error('Select a valid expense category')

    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, TypeError):
        return _format_validation_error('Amount must be a valid number')

    if amount <= 0:
        return _format_validation_error('Amount must be greater than zero')

    if not description:
        return _format_validation_error('Description is required')

    report = _create_report('expense', selected_date)
    expense = Expense.objects.create(
        report=report,
        category=category,
        amount=amount,
        description=description,
    )
    _create_notification(report, f"Expense report created: {category.title()} ₦{amount}", user=request.user, icon='receipt')
    log_activity(request.user, 'Expense created', f'{category.title()} expense of ₦{amount} created.')

    return JsonResponse({'success': True, 'report': report_to_summary('expense', expense)}, status=201)


def create_stock_adjustment(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    selected_date, error = _parse_selected_date(request)
    if error:
        return error

    body = _get_request_body(request)
    if body is None:
        return _format_validation_error('JSON body is required')

    product_id = body.get('product_id')
    quantity = body.get('quantity')
    reason = str(body.get('reason', '')).strip()

    if not product_id:
        return _format_validation_error('Product is required')

    try:
        product = Product.objects.get(id=int(product_id), is_active=True)
    except (Product.DoesNotExist, ValueError, TypeError):
        return _format_validation_error('Selected product does not exist')

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return _format_validation_error('Quantity must be a whole number')

    if quantity <= 0:
        return _format_validation_error('Quantity must be greater than zero')

    if not reason:
        return _format_validation_error('Reason is required')

    report = _create_report('stock', selected_date)
    stock_report = StockAdjustment.objects.create(
        report=report,
        product=product,
        quantity=quantity,
        adjustment_type=DEFAULT_STOCK_ADJUSTMENT_TYPE,
        reason=reason,
    )

    inventory, _ = Inventory.objects.get_or_create(product=product)
    inventory.quantity = max(inventory.quantity - quantity, 0)
    inventory.save()

    _create_notification(report, f"Stock adjusted for {product.name}: {quantity} units", user=request.user, icon='package')
    log_activity(request.user, 'Stock adjusted', f'{quantity} units of {product.name} adjusted from inventory.')

    return JsonResponse({'success': True, 'report': report_to_summary('stock', stock_report)}, status=201)


def create_cash_difference(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    selected_date, error = _parse_selected_date(request)
    if error:
        return error

    body = _get_request_body(request)
    if body is None:
        return _format_validation_error('JSON body is required')

    expected = body.get('expected')
    counted = body.get('counted')
    reason = str(body.get('reason', '')).strip()

    try:
        expected = Decimal(str(expected))
        counted = Decimal(str(counted))
    except (InvalidOperation, TypeError):
        return _format_validation_error('Expected cash and counted cash must be valid numbers')

    if expected < 0 or counted < 0:
        return _format_validation_error('Cash values cannot be negative')

    if not reason:
        return _format_validation_error('Reason is required')

    difference = counted - expected
    report = _create_report('cash', selected_date)
    cash_report = CashDifference.objects.create(
        report=report,
        expected=expected,
        counted=counted,
        difference=difference,
        reason=reason,
    )
    _create_notification(report, f"Cash difference recorded: {difference:+.2f}", user=request.user, icon='wallet')
    log_activity(request.user, 'Cash difference reported', f'Cash difference of {difference:+.2f} recorded.')

    return JsonResponse({'success': True, 'report': report_to_summary('cash', cash_report)}, status=201)


def create_incident(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    selected_date, error = _parse_selected_date(request)
    if error:
        return error

    body = _get_request_body(request)
    if body is None:
        return _format_validation_error('JSON body is required')

    title = str(body.get('title', '')).strip()
    severity = str(body.get('severity', '')).strip().lower()
    description = str(body.get('description', '')).strip()

    if not title:
        return _format_validation_error('Title is required')

    if severity not in INCIDENT_SEVERITY_CHOICES:
        return _format_validation_error('Select a valid severity level')

    if not description:
        return _format_validation_error('Description is required')

    report = _create_report('incident', selected_date)
    incident = Incident.objects.create(
        report=report,
        title=title,
        severity=severity,
        description=description,
    )
    _create_notification(report, f"Incident reported: {title}", user=request.user, icon='shield-exclamation')
    log_activity(request.user, 'Incident reported', f'Incident "{title}" reported with severity "{severity}".')

    return JsonResponse({'success': True, 'report': report_to_summary('incident', incident)}, status=201)


REPORT_MODELS = {'expense': Expense, 'stock': StockAdjustment, 'cash': CashDifference, 'incident': Incident}


def _get_report_item(report_type, report_id):
    model = REPORT_MODELS.get(report_type)
    if not model:
        return None
    try:
        return model.objects.select_related('report').get(id=report_id, report__is_deleted=False)
    except model.DoesNotExist:
        return None


def _validate_update_payload(report_type, body):
    if report_type == 'expense':
        category = str(body.get('category', '')).strip().lower()
        description = str(body.get('description', '')).strip()
        try: amount = Decimal(str(body.get('amount')))
        except (InvalidOperation, TypeError): return None, 'Amount must be a valid number'
        if category not in EXPENSE_CATEGORY_CHOICES: return None, 'Select a valid expense category'
        if amount <= 0: return None, 'Amount must be greater than zero'
        if not description: return None, 'Description is required'
        return {'category': category, 'amount': amount, 'description': description}, None
    if report_type == 'stock':
        reason = str(body.get('reason', '')).strip()
        try: product = Product.objects.get(id=int(body.get('product_id')), is_active=True)
        except (Product.DoesNotExist, ValueError, TypeError): return None, 'Selected product does not exist'
        try: quantity = int(body.get('quantity'))
        except (TypeError, ValueError): return None, 'Quantity must be a whole number'
        if quantity <= 0: return None, 'Quantity must be greater than zero'
        if not reason: return None, 'Reason is required'
        return {'product': product, 'quantity': quantity, 'reason': reason}, None
    if report_type == 'cash':
        reason = str(body.get('reason', '')).strip()
        try: expected, counted = Decimal(str(body.get('expected'))), Decimal(str(body.get('counted')))
        except (InvalidOperation, TypeError): return None, 'Expected cash and counted cash must be valid numbers'
        if expected < 0 or counted < 0: return None, 'Cash values cannot be negative'
        if not reason: return None, 'Reason is required'
        return {'expected': expected, 'counted': counted, 'difference': counted - expected, 'reason': reason}, None
    if report_type == 'incident':
        title, severity, description = str(body.get('title', '')).strip(), str(body.get('severity', '')).strip().lower(), str(body.get('description', '')).strip()
        if not title: return None, 'Title is required'
        if severity not in INCIDENT_SEVERITY_CHOICES: return None, 'Select a valid severity level'
        if not description: return None, 'Description is required'
        return {'title': title, 'severity': severity, 'description': description}, None
    return None, 'Unknown report type'


def update_report(request, report_type, report_id):
    if request.method not in ('PUT', 'PATCH'):
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    item = _get_report_item(report_type, report_id)
    if not item:
        return JsonResponse({'error': 'Report not found'}, status=404)
    body = _get_request_body(request)
    if body is None: return _format_validation_error('JSON body is required')
    values, error = _validate_update_payload(report_type, body)
    if error: return _format_validation_error(error)
    with transaction.atomic():
        if report_type == 'stock':
            old_inventory, _ = Inventory.objects.get_or_create(product=item.product)
            old_inventory.quantity += item.quantity
            old_inventory.save()
            new_inventory, _ = Inventory.objects.get_or_create(product=values['product'])
            new_inventory.quantity = max(new_inventory.quantity - values['quantity'], 0)
            new_inventory.save()
        for field, value in values.items(): setattr(item, field, value)
        item.save()
    return JsonResponse({'success': True, 'report': report_to_summary(report_type, item)})


def delete_report(request, report_type, report_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    item = _get_report_item(report_type, report_id)
    if not item: return JsonResponse({'error': 'Report not found'}, status=404)
    item.report.is_deleted = True
    item.report.save(update_fields=['is_deleted'])
    log_activity(request.user, 'Report deleted', f'{report_type.title()} report #{report_id} deleted.')
    _create_system_notification(
        title='Report deleted',
        message=f'{report_type.title()} report #{report_id} was deleted.',
        user=request.user,
        icon='trash'
    )
    return JsonResponse({'success': True})


def end_shift(request):
    if request.method != 'POST': return JsonResponse({'error': 'Method not allowed'}, status=405)
    selected_date, error = _parse_selected_date(request)
    if error: return error
    body = _get_request_body(request)
    if body is None: return _format_validation_error('JSON body is required')
    try: counted = Decimal(str(body.get('counted_cash')))
    except (InvalidOperation, TypeError): return _format_validation_error('Counted cash must be a valid number')
    notes = str(body.get('notes', '')).strip()
    if counted < 0: return _format_validation_error('Counted cash cannot be negative')
    if not notes: return _format_validation_error('Notes are required')
    if EndShift.objects.filter(report__created_at__date=selected_date, report__is_deleted=False).exists():
        return JsonResponse({'error': 'An end-of-shift report already exists for this day'}, status=409)
    opening_balance = Sale.objects.filter(date__date=selected_date - timedelta(days=1)).aggregate(total=Sum('total'))['total'] or Decimal('0')
    sales = Sale.objects.filter(date__date=selected_date)
    expected = opening_balance + (sales.filter(method='cash').aggregate(total=Sum('total'))['total'] or Decimal('0')) - (Expense.objects.filter(report__created_at__date=selected_date, report__is_deleted=False).aggregate(total=Sum('amount'))['total'] or Decimal('0'))
    difference = counted - expected
    with transaction.atomic():
        report = _create_report('cash', selected_date)
        cash = CashDifference.objects.create(report=report, expected=expected, counted=counted, difference=difference, reason=notes)
        EndShift.objects.create(report=report, user=request.user if request.user.is_authenticated else None, opening_balance=opening_balance, expected_cash=expected, counted_cash=counted, difference=difference, notes=notes)
    _create_system_notification(
        title='Shift ended',
        message=f'End of shift completed for {selected_date.isoformat()} with {difference:+.2f} cash difference.',
        user=request.user,
        icon='clock'
    )
    log_activity(request.user, 'Shift ended', f'End of shift completed for {selected_date.isoformat()}, difference {difference:+.2f}.')
    return JsonResponse({'success': True, 'report': report_to_summary('cash', cash)}, status=201)
