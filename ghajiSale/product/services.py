from django.db.models import Sum, F, DecimalField, ExpressionWrapper, Q, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from .models import StockMovement, InventoryBatch
from django.utils import timezone


def get_product_profit_stats(product):
    today = timezone.now().date()
    zero = Value(0, output_field=DecimalField(max_digits=12, decimal_places=2))
    
    yesterday = today - timedelta(days=1)

    start_week = today - timedelta(days=today.weekday())
    last_week_start = start_week - timedelta(days=7)
    last_week_end = start_week

    start_month = today.replace(day=1)

    if start_month.month == 1:
        last_month_start = start_month.replace(year=start_month.year - 1, month=12)
    else:
        last_month_start = start_month.replace(month=start_month.month - 1)

    start_year = today.replace(month=1, day=1)
    last_year_start = start_year.replace(year=start_year.year - 1)

    profit_expr = ExpressionWrapper(
        F('itemTotal') - (F('product__pricing__cost') * F('quantity')),
        output_field=DecimalField(max_digits=12, decimal_places=2)
    )

    return product.sale_items.aggregate(
        today=Coalesce(Sum(profit_expr, filter=Q(sale__date__date=today)), zero),
        yesterday=Coalesce(Sum(profit_expr, filter=Q(sale__date__date=yesterday)), zero),
        this_week=Coalesce(Sum(profit_expr, filter=Q(sale__date__date__gte=start_week)), zero),
        last_week=Coalesce(
            Sum(
                profit_expr,
                filter=Q(
                    sale__date__date__gte=last_week_start,
                    sale__date__date__lt=last_week_end
                )
            ),
            zero
        ),
        this_month=Coalesce(Sum(profit_expr, filter=Q(sale__date__date__gte=start_month)), zero),
        last_month=Coalesce(
            Sum(
                profit_expr,
                filter=Q(
                    sale__date__date__gte=last_month_start,
                    sale__date__date__lt=start_month
                )
            ),
            zero
        ),
        this_year=Coalesce(Sum(profit_expr, filter=Q(sale__date__date__gte=start_year)), zero),
        last_year=Coalesce(
            Sum(
                profit_expr,
                filter=Q(
                    sale__date__date__gte=last_year_start,
                    sale__date__date__lt=start_year
                )
            ),
            zero
        ),
    )


def calculate_opening_stock(product, days=30):
    date_from = timezone.now() - timedelta(days=days)

    movements = StockMovement.objects.filter(
        product = product,
        timestamp__gte = date_from
    )
    sold = movements.filter(
        movement_type = 'sale'
    ).aggregate(
        total = Coalesce(Sum('quantity_change'), 0)
    )['total']

    restocked = movements.filter(
        movement_type = 'restock'
    ).aggregate(
        total=Coalesce(Sum('quantity_change'), 0)
    )['total']

    current_stock = product.inventory.quantity

    opening_stock = current_stock + sold - restocked

    return opening_stock

def calculate_turnover(product, days=30):
    date_from = timezone.now() - timedelta(days=days)

    sold = StockMovement.objects.filter(
        product=product,
        movement_type='sale',
        timestamp__gte=date_from
    ).aggregate(
        total=Coalesce(Sum('quantity_change'), 0)
    )['total']

    opening_stock = calculate_opening_stock(product, days)

    current_stock = product.inventory.quantity

    average_inventory = (
        opening_stock + current_stock
    ) / 2

    if average_inventory == 0:
        return 0

    turnover = sold / average_inventory

    return round(turnover, 2)

def calculate_sales_velocity(product, days=30):
    date_from = timezone.now() - timedelta(days=days)

    sold = StockMovement.objects.filter(
        product=product,
        movement_type='sale',
        timestamp__gte=date_from
    ).aggregate(
        total=Coalesce(Sum('quantity'), 0)
    )['total']

    velocity = sold / days

    return round(velocity, 2)

def generate_batch_number():
        today = timezone.now().strftime('%Y%m%d')
        last_batch = InventoryBatch.objects.filter(
            batch_number__startswith= f'BATCH-{today}'
        ).order_by('-id').first()

        if last_batch:
            last_number = int(last_batch.batch_number.split('-')[-1])
            new_number = last_number + 1
        else:
            new_number = 1

        return f'BATCH-{today}-{new_number:04d}'


def movement_builder(move_type, query_row):
    match move_type:

        case "added":
            return {
                "title":"New product added",
                "icon": "plus",
                "color": "emerald",
                "summary": f"{query_row.product.name} • {query_row.product.category.name}",
                
            }

        case "sold":
            summary = f"{abs(query_row.quantity_change)} unit{'s' if abs(query_row.quantity_change) != 1 else ''} sold"

            # if query_row.cashier:
            #     summary += f" • {query_row.cashier.name}"

            return {
                "title":f'{query_row.product.name} sold',
                "icon": "shopping-cart",
                "color": "blue",
                "summary": summary,
                
            }

        case "restocked":
            summary = f"{query_row.quantity_change} unit{'s' if query_row.quantity_change != 1 else ''} added"

            # if query_row.cashier:
            #     summary += f" • {query_row.cashier.name}"

            return {
                "title":f'{query_row.product.name} restocked',
                "icon": "package-plus",
                "color": "emerald",
                "summary": summary,
                
            }

        case "active":
            return {
                "title":f'{query_row.product.name} marked active',
                "icon": "badge-check",
                "color": "green",
                "summary": "Product activated",
                "timestamp": query_row.timestamp,
            }

        case "inactive":
            return {
                "title":f'{query_row.product.name} marked active',
                "icon": "circle-off",
                "color": "gray",
                "summary": "Product deactivated",
                
            }

        case _:
            return {
                "icon": "boxes",
                "color": "gray",
                "summary": "",
            }