from django.shortcuts import render
from django.http import JsonResponse
from django.http import JsonResponse
from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField, Q
from django.db.models.functions import TruncMonth, TruncHour, ExtractYear, TruncDate
from django.utils import timezone
from django.db.models import OuterRef, Subquery
from decimal import Decimal
import datetime
import calendar

from sales_monitor.models import Sale, SaleItem, Expense, SaleTarget
from product.models import Inventory, Category
from reports.models import Expense as ReportExpense
# Create your views here.

# ─────────────────────────────────────────────
# HELPER: calculate profit from SaleItems queryset
# profit = itemTotal - (quantity × cost)
# We annotate each SaleItem with its profit then aggregate
# ─────────────────────────────────────────────
def get_profit_for_queryset(sale_items_qs):
    """
    Given a SaleItem queryset, returns total profit as a Decimal.
    Joins to Pricing via product__pricing to get cost.
    """
    result = sale_items_qs.annotate(
        item_profit=ExpressionWrapper(
            F('itemTotal') - F('quantity') * F('product__pricing__cost'),
            output_field=DecimalField(max_digits=12, decimal_places=2)
        )
    ).aggregate(total_profit=Sum('item_profit'))
    return result['total_profit'] or Decimal('0.00')


def selected_month_range(request):
    """Return the selected calendar-month range; invalid input falls back to today."""
    raw_month = request.GET.get('month', '')
    try:
        selected = datetime.datetime.strptime(raw_month, '%Y-%m').date() if raw_month else timezone.localdate()
    except ValueError:
        selected = timezone.localdate()
    start = selected.replace(day=1)
    end = (start.replace(day=calendar.monthrange(start.year, start.month)[1]) + datetime.timedelta(days=1))
    previous_end = start
    previous_start = (start - datetime.timedelta(days=1)).replace(day=1)
    return start, end, previous_start, previous_end


def report_expenses_between(start, end):
    """Combine the legacy expense ledger with Daily Report expenses without double-counting either source."""
    legacy = Expense.objects.filter(date__gte=start, date__lt=end).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    reports = ReportExpense.objects.filter(report__created_at__date__gte=start, report__created_at__date__lt=end, report__is_deleted=False).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    return legacy + reports
def weekly_revenue(request):
    today = timezone.now().date()
    this_week_start = today - datetime.timedelta(days=today.weekday())
    last_week_start = this_week_start - datetime.timedelta(days=7)
    last_week_end = this_week_start - datetime.timedelta(days=1)

    def daily_breakdown(start, end):
        rows = (
            Sale.objects
            .filter(date__date__gte=start, date__date__lte=end)
            .annotate(day=TruncDate('date'))
            .values('day')
            .annotate(total=Sum('total'))
        )
        # Map: date → revenue
        row_map = {row['day']: float(row['total']) for row in rows}
        # Build 7-slot array Mon–Sun, 0 if no sales that day
        result = []
        for i in range(7):
            day = start + datetime.timedelta(days=i)
            result.append(row_map.get(day, 0))
        return result

    this_week_data = daily_breakdown(this_week_start, today)
    last_week_data = daily_breakdown(last_week_start, last_week_end)

    this_week_total = sum(this_week_data)
    last_week_total = sum(last_week_data)

    if last_week_total > 0:
        change_pct = ((this_week_total - last_week_total) / last_week_total) * 100
    else:
        change_pct = 100.0 if this_week_total > 0 else 0.0

    return JsonResponse({
        'this_week': this_week_data,
        'last_week': last_week_data,
        'this_week_total': this_week_total,
        'last_week_total': last_week_total,
        'change_pct': round(change_pct, 2),
        'trend': 'up' if change_pct >= 0 else 'down',
    })
# Summary cards
def summary_cards(request):
    month_start, month_end, lastmonth_start, _ = selected_month_range(request)
    sales_this_month = Sale.objects.filter(date__date__gte=month_start, date__date__lt=month_end).aggregate(total_sales=Sum('total'))['total_sales'] or Decimal('0.00')
    sales_last_month = Sale.objects.filter(date__date__gte=lastmonth_start, date__date__lt=month_start).aggregate(total_sales=Sum('total'))['total_sales'] or Decimal('0.00')
    sales_growth = ((sales_this_month - sales_last_month) / sales_last_month * 100) if sales_last_month else (100.0 if sales_this_month else 0.0)
    net_profit = get_profit_for_queryset(SaleItem.objects.filter(sale__date__date__gte=month_start, sale__date__date__lt=month_end))
    last_profit = get_profit_for_queryset(SaleItem.objects.filter(sale__date__date__gte=lastmonth_start, sale__date__date__lt=month_start))
    expenses_this_month = report_expenses_between(month_start, month_end)
    expenses_last_month = report_expenses_between(lastmonth_start, month_start)
    inventory_value = Inventory.objects.aggregate(
        total=Sum(
            ExpressionWrapper(
                F('quantity') * F('product__pricing__cost'),
                output_field=DecimalField(
                    max_digits=14,
                    decimal_places=2
                )
            )
        )
    )['total'] or Decimal('0.00')
    # const profitMargin = (netProfit / salesThisMonth) * 100;
    profit_margin = (net_profit/sales_this_month * 100) if sales_this_month > 0 else 0.0
    # const expenseChange =((expensesThisMonth - expensesLastMonth) / expensesLastMonth) * 100;
    expense_change = ((expenses_this_month - expenses_last_month) / expenses_last_month * 100) if expenses_last_month > 0 else (100.0 if expenses_this_month > 0 else 0.0)
    return JsonResponse({
        'sales_this_month': float(sales_this_month),
        'net_profit': float(net_profit),
        'expenses_this_month': float(expenses_this_month),
        'inventory_value': float(inventory_value),
        'tiny_label': {
            'sales_growth':sales_growth,
            'profit_margin': profit_margin,
            'expense_change': expense_change,
            'profit_change': float(((net_profit - last_profit) / last_profit * 100) if last_profit else (100 if net_profit else 0)),
            'inventory_change': 0,

        }
    })

# 3. MONTHLY EARNINGS — all available months this year
def monthly_earnings(request):
    year = timezone.now().year

    results = (
        Sale.objects
        .filter(date__year=year)
        .annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(revenue=Sum('total'))
        .order_by('month')
    )
    labels = []
    data = []
    month_names = ['Jan','Feb','Mar','Apr','May','Jun',
                'Jul','Aug','Sep','Oct','Nov','Dec']
    
    for row in results:
        month_index = row['month'].month - 1  # month is 1-indexed
        labels.append(month_names[month_index])
        data.append(float(row['revenue'] or 0))

    return JsonResponse({
        'labels': labels,
        'data': data,
        'total_revenue': float(sum(data)),
    })

# ─────────────────────────────────────────────
# 4. PROFIT COMPARE — this month vs same month last year
# ─────────────────────────────────────────────
def profit_monthly_compare(request):
    today = timezone.now()

    this_month_start = today.replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )
    
    if this_month_start.month == 12:
        this_month_end = this_month_start.replace(
            year=this_month_start.year + 1,
            month=1
        )
    else:
        this_month_end = this_month_start.replace(
            month=this_month_start.month + 1
        )

    last_year_month_start = this_month_start.replace(
        year=this_month_start.year - 1
    )

    last_year_month_end = this_month_end.replace(
        year=this_month_end.year - 1
    )
    this_month_profit = get_profit_for_queryset(
    SaleItem.objects.filter(
        sale__date__gte=this_month_start,
        sale__date__lt=this_month_end
    )
)

    last_year_profit = get_profit_for_queryset(
        SaleItem.objects.filter(
            sale__date__gte=last_year_month_start,
            sale__date__lt=last_year_month_end
        )
    )
    if last_year_profit > 0 :
        change_pct = ((this_month_profit - last_year_profit)/this_month_profit )*100
    else:
        change_pct = 100.0 if this_month_profit > 0 else 0.0
    print(this_month_profit, last_year_profit, change_pct)
    
    return JsonResponse({
        'this_month': float(this_month_profit),
        'same_month_last_year': float(last_year_profit),
        'change_percent': round(float(change_pct), 2),
        'trend': '+' if change_pct >= 0 else '-',
    })


# ─────────────────────────────────────────────
# 5. MONTH AT A GLANCE — performance summary with color grade
# ─────────────────────────────────────────────
def month_at_a_glance(request):
    today = timezone.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Last month range
    last_month_end = month_start - datetime.timedelta(seconds=1)
    last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # ── Current month data ──
    revenue = Sale.objects.filter(date__gte=month_start).aggregate(t=Sum('total'))['t'] or Decimal('0.00')
    expenses = Expense.objects.filter(date__gte=month_start.date()).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
    transaction_count = Sale.objects.filter(date__gte=month_start).count()
    profit = get_profit_for_queryset(SaleItem.objects.filter(sale__date__gte=month_start))

    # ── Last month data ──
    last_revenue = Sale.objects.filter(date__gte=last_month_start, date__lt=month_start).aggregate(t=Sum('total'))['t'] or Decimal('0.00')
    last_expenses = Expense.objects.filter(date__gte=last_month_start.date(), date__lt=month_start.date()).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
    last_profit = get_profit_for_queryset(SaleItem.objects.filter(sale__date__gte=last_month_start, sale__date__lt=month_start))

    # ── Top category this month ──
    top_category = (
        SaleItem.objects
        .filter(sale__date__gte=month_start)
        .values('product__category__name')
        .annotate(total=Sum('itemTotal'))
        .order_by('-total')
        .first()
    )

    # ── Worst category this month ──
    worst_category = (
        SaleItem.objects
        .filter(sale__date__gte=month_start)
        .values('product__category__name')
        .annotate(total=Sum('itemTotal'))
        .order_by('total')
        .first()
    )

    # ── Low stock count ──
    low_stock_count = Inventory.objects.filter(quantity__lte=F('low_stock_threshold')).count()

    # ── Target ──
    target_obj = SaleTarget.objects.filter(month__year=today.year, month__month=today.month).first()
    target = target_obj.target if target_obj else None
    target_pct = float((revenue / target) * 100) if target and target > 0 else None

    # ── Grade ──
    profit_margin = float((profit / revenue) * 100) if revenue > 0 else 0
    if profit_margin >= 20:
        grade, color = 'excellent', 'green'
    elif profit_margin >= 10:
        grade, color = 'good', 'blue'
    elif profit_margin >= 5:
        grade, color = 'average', 'yellow'
    else:
        grade, color = 'poor', 'red'

    # ── Generate insights ──
    insights = []

    # 1. Revenue vs last month
    if last_revenue > 0:
        rev_change = float(((revenue - last_revenue) / last_revenue) * 100)
        if rev_change > 0:
            insights.append({
                'type': 'success',
                'text': f'Revenue grew by {rev_change:.1f}% compared to last month, up from ₦{last_revenue:,.0f} to ₦{revenue:,.0f}.'
            })
        else:
            insights.append({
                'type': 'danger',
                'text': f'Revenue dropped by {abs(rev_change):.1f}% compared to last month — down from ₦{last_revenue:,.0f} to ₦{revenue:,.0f}.'
            })

    # 2. Profit vs last month
    if last_profit > 0:
        profit_change = float(((profit - last_profit) / last_profit) * 100)
        if profit_change > 0:
            insights.append({
                'type': 'success',
                'text': f'Net profit improved by {profit_change:.1f}% vs last month. Margin is currently {profit_margin:.1f}%.'
            })
        else:
            insights.append({
                'type': 'warning',
                'text': f'Net profit fell by {abs(profit_change):.1f}% vs last month. Current margin: {profit_margin:.1f}%.'
            })
    else:
        insights.append({
            'type': 'info',
            'text': f'Profit margin this month is {profit_margin:.1f}% — grade: {grade.upper()}.'
        })

    # 3. Expenses vs last month
    if last_expenses > 0:
        exp_change = float(((expenses - last_expenses) / last_expenses) * 100)
        if exp_change > 10:
            insights.append({
                'type': 'warning',
                'text': f'Expenses rose by {exp_change:.1f}% compared to last month. Review your cost categories.'
            })
        elif exp_change < 0:
            insights.append({
                'type': 'success',
                'text': f'Expenses reduced by {abs(exp_change):.1f}% vs last month — good cost control.'
            })

    # 4. Top performing category
    if top_category and top_category['product__category__name']:
        insights.append({
            'type': 'info',
            'text': f'{top_category["product__category__name"]} was your highest-revenue category this month at ₦{top_category["total"]:,.0f}.'
        })

    # 5. Worst performing category
    if worst_category and worst_category['product__category__name']:
        insights.append({
            'type': 'danger',
            'text': f'{worst_category["product__category__name"]} had the lowest revenue this month — consider a promotion or stock review.'
        })

    # 6. Sales target progress
    if target_pct is not None:
        if target_pct >= 100:
            insights.append({
                'type': 'success',
                'text': f'Sales target hit! You reached {target_pct:.1f}% of the ₦{target:,.0f} target.'
            })
        elif target_pct >= 75:
            insights.append({
                'type': 'warning',
                'text': f'You are at {target_pct:.1f}% of your ₦{target:,.0f} monthly target. Strong push needed to close it.'
            })
        else:
            insights.append({
                'type': 'danger',
                'text': f'Only {target_pct:.1f}% of the ₦{target:,.0f} target reached. Significant gap remaining.'
            })

    # 7. Low stock alert
    if low_stock_count > 0:
        insights.append({
            'type': 'warning',
            'text': f'{low_stock_count} product{"s are" if low_stock_count > 1 else " is"} running low on stock — reorder soon to avoid lost sales.'
        })

    return JsonResponse({
        'month': today.strftime('%B %Y'),
        'grade': grade,
        'color': color,
        'profit_margin_percent': round(profit_margin, 2),
        'insights': insights,  # list of {type, text}
    })
# ─────────────────────────────────────────────
# 6. REVENUE VS EXPENSE — full year chart
# ─────────────────────────────────────────────

def revenue_vs_expense_yearly(request):
    year = timezone.now().year
    month_names = ['Jan','Feb','Mar','Apr','May','Jun',
                'Jul','Aug','Sep','Oct','Nov','Dec']
    today = timezone.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    this_month_profit = get_profit_for_queryset(
    SaleItem.objects.filter(sale__date__gte=month_start)
)
    print(this_month_profit)
    revenue_lines= (
        Sale.objects
        .filter(date__year=year)
        .annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(revenue=Sum('total'))
        .order_by('month')
    )
    revenue_map = {row['month'].month: float(row['revenue'] ) for row in revenue_lines}

    expense_rows = (
        Expense.objects
        .filter(date__year=year)
        .annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )
    expense_map = {row['month'].month: float(row['total']) for row in expense_rows}

    # Only include months that have any data
    active_months = sorted(set(list(revenue_map.keys()) + list(expense_map.keys())))

    labels = [month_names[m - 1] for m in active_months]
    revenue_data = [revenue_map.get(m, 0) for m in active_months]
    expense_data = [expense_map.get(m, 0) for m in active_months]

    return JsonResponse({
        'labels': labels,
        'revenue': revenue_data,
        'expenses': expense_data,
        'this_month_profit': this_month_profit
    })

# ─────────────────────────────────────────────
# 7. EXPENSES — total + breakdown by category
# ─────────────────────────────────────────────
def expenses_breakdown(request):
    month_start, month_end, _, _ = selected_month_range(request)

    breakdown = (
        Expense.objects
        .filter(date__gte=month_start, date__lt=month_end)
        .values('category')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )

    report_breakdown = ReportExpense.objects.filter(report__created_at__date__gte=month_start, report__created_at__date__lt=month_end, report__is_deleted=False).values('category').annotate(total=Sum('amount'), count=Count('id'))
    merged = {}
    for row in list(breakdown) + list(report_breakdown):
        entry = merged.setdefault(row['category'], {'total': Decimal('0'), 'count': 0})
        entry['total'] += row['total']
        entry['count'] += row['count']
    total = sum((row['total'] for row in merged.values()), Decimal('0'))

    categories = []
    for category, row in sorted(merged.items(), key=lambda item: item[1]['total'], reverse=True):
        pct = float((row['total'] / total) * 100) if total > 0 else 0
        categories.append({
            'category': category.replace('_', ' ').title(),
            'amount': float(row['total']),
            'count': row['count'],
            'percent': round(pct, 2),
        })

    return JsonResponse({
        'total_expenses': float(total),
        'breakdown': categories,
    })

    # ─────────────────────────────────────────────
# 8. OPERATIONAL KPIs
# ─────────────────────────────────────────────
def operational_kpis(request):
    today = timezone.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    sales_qs = Sale.objects.filter(date__gte=month_start)
    transaction_count = sales_qs.count()
    total_revenue = sales_qs.aggregate(t=Sum('total'))['t'] or Decimal('0.00')
    avg_transaction = total_revenue / transaction_count if transaction_count > 0 else Decimal('0.00')

    # Units sold this month
    units_sold = SaleItem.objects.filter(
        sale__date__gte=month_start
    ).aggregate(total=Sum('quantity'))['total'] or 0

    # Low stock count
    low_stock_count = Inventory.objects.filter(
        quantity__lte=F('low_stock_threshold')
    ).count()

    # Top payment method
    top_method = (
        sales_qs.values('method')
        .annotate(count=Count('id'))
        .order_by('-count')
        .first()
    )

    return JsonResponse({
        'transactions_this_month': transaction_count,
        'avg_transaction_value': float(avg_transaction),
        'units_sold_this_month': units_sold,
        'low_stock_products': low_stock_count,
        'top_payment_method': top_method['method'] if top_method else None,
    })

# ─────────────────────────────────────────────
# 9. PEAK SALES HOURS — 6am to 8pm
# ─────────────────────────────────────────────
def peak_hours(request):
    today = timezone.now()
    # Default: last 30 days
    since = today - datetime.timedelta(days=30)

    results = (
        Sale.objects.filter(
            date__gte=since,
        ).annotate(hour=TruncHour('date'))
        .values('hour')
        .annotate(transaction_count = Count('id'), total_revenue=Sum('total'))
        .order_by('hour')
    )

    # Build a map: hour_int → data, filtered to 8–20
    hour_map = {}
    for row in results:
        h = row['hour'].hour
        if 8 <= h <= 20:
            hour_map[h] = {
                'transactions': row['transaction_count'],
                'revenue': float(row['total_revenue'])
            }

    labels = []
    transactions = []
    revenue = []

    for h in range(8, 21):
        suffix = 'AM' if h < 12 else 'PM'
        display_h = h if h <= 12 else h - 12
        labels.append(f'{display_h}{suffix}')
        data = hour_map.get(h, {'transactions': 0, 'revenue': 0})
        transactions.append(data['transactions'])
        revenue.append(data['revenue'])

    return JsonResponse({
        'labels': labels,
        'transactions': transactions,
        'revenue': revenue,
    })
    

# ─────────────────────────────────────────────
# 10. CATEGORY PERFORMANCE — revenue, profit, weekly revenue
# ─────────────────────────────────────────────
def category_performance(request):
    month_start, month_end, _, _ = selected_month_range(request)
    today = month_end - datetime.timedelta(days=1)
    week_start = month_start
    week_one_start = month_start
    week_one_end   = month_start + datetime.timedelta(days=6)

    week_two_start = week_one_end + datetime.timedelta(days=1)
    week_two_end   = month_start + datetime.timedelta(days=13)

    week_three_start = week_two_end + datetime.timedelta(days=1)
    week_three_end   = month_start + datetime.timedelta(days=20)

    week_four_start = week_three_end + datetime.timedelta(days=1)
    # Extend week 4 to actual end of month
    import calendar
    last_day = calendar.monthrange(today.year, today.month)[1]
    week_four_end = month_start.replace(day=last_day)
    
    print(f'todays date is {week_one_end}')
    categories = Category.objects.all()
    result = []

    for cat in categories:
        # All-time revenue for this category
        cat_items = SaleItem.objects.filter(product__category=cat, sale__date__date__gte=month_start, sale__date__date__lt=month_end)
        revenue = cat_items.aggregate(t=Sum('itemTotal'))['t'] or Decimal('0.00')
        profit = get_profit_for_queryset(cat_items)

        # Weekly revenue
        weekly_items = cat_items.filter(sale__date__date__gte=week_start)
        weekly_revenue = weekly_items.aggregate(t=Sum('itemTotal'))['t'] or Decimal('0.00')

        # Monthly revenue for the selected year, through the selected month.
        monthly_rows = (
            cat_items
            .filter(sale__date__year=month_start.year, sale__date__month__lte=month_start.month)
            .annotate(month=TruncMonth('sale__date'))
            .values('month')
            .annotate(total=Sum('itemTotal'))
            .order_by('month')
        )
        monthly_chart = [
            {'month': row['month'].strftime('%b'), 'revenue': float(row['total'])}
            for row in monthly_rows
        ]

        result.append({
            'category': cat.name,
            'revenue': float(revenue),
            'profit': float(profit),
            'quantity_sold': cat_items.aggregate(total=Sum('quantity'))['total'] or 0,
            'weekly_revenue': float(weekly_revenue),
            'monthly_chart': monthly_chart,
        })

    # Sort by revenue descending
    result.sort(key=lambda x: x['revenue'], reverse=True)

    total_revenue = sum((Decimal(str(row['revenue'])) for row in result), Decimal('0'))
    for row in result:
        row['percentage_contribution'] = round(float(Decimal(str(row['revenue'])) / total_revenue * 100), 2) if total_revenue else 0
    return JsonResponse({'categories': result})


# ─────────────────────────────────────────────
# 11. TOP PRODUCTS — top 10 with search + filter
# ─────────────────────────────────────────────
def top_products(request):
    search = request.GET.get('search', '').strip()
    category_id = request.GET.get('category', None)
    limit = int(request.GET.get('limit', 10))

    month_start, month_end, _, _ = selected_month_range(request)
    items_qs = SaleItem.objects.select_related('product__pricing', 'product__category').filter(sale__date__date__gte=month_start, sale__date__date__lt=month_end)

    if search:
        items_qs = items_qs.filter(product__name__icontains=search)
    if category_id:
        items_qs = items_qs.filter(product__category_id=category_id)

    results = (
        items_qs
        .values(
            'product__id',
            'product__name',
            'product__category__name',
        )
        .annotate(
            total_revenue=Sum('itemTotal'),
            units_sold=Sum('quantity'),
        )
        .order_by('-total_revenue')[:limit]
    )

    products = []
    for row in results:
        # Get profit separately per product
        product_items = items_qs.filter(product_id=row['product__id'])
        profit = get_profit_for_queryset(product_items)

        products.append({
            'id': row['product__id'],
            'name': row['product__name'],
            'category': row['product__category__name'],
            'revenue': float(row['total_revenue']),
            'units_sold': row['units_sold'],
            'profit': float(profit),
        })

    return JsonResponse({'products': products})


# ─────────────────────────────────────────────
# 12. SALES TARGETS — monthly targets vs actual
# ─────────────────────────────────────────────
def sales_targets(request):
    start, end, _, _ = selected_month_range(request)
    target = SaleTarget.objects.filter(month=start).first()
    sales = Sale.objects.filter(date__date__gte=start, date__date__lt=end)
    quarterly_start = start.replace(month=((start.month - 1) // 3) * 3 + 1)
    quarterly_profit = get_profit_for_queryset(SaleItem.objects.filter(sale__date__date__gte=quarterly_start, sale__date__date__lt=end))
    inventory_value = Inventory.objects.aggregate(total=Sum(ExpressionWrapper(F('quantity') * F('product__pricing__cost'), output_field=DecimalField(max_digits=14, decimal_places=2))))['total'] or Decimal('0')
    cost_of_sales = SaleItem.objects.filter(sale__date__date__gte=start, sale__date__date__lt=end).aggregate(total=Sum(ExpressionWrapper(F('quantity') * F('product__pricing__cost'), output_field=DecimalField(max_digits=14, decimal_places=2))))['total'] or Decimal('0')
    metrics = [
        ('Monthly Sales', sales.aggregate(total=Sum('total'))['total'] or Decimal('0'), target.target if target else Decimal('0')),
        ('Quarterly Profit', quarterly_profit, target.quarterly_profit_target if target else Decimal('0')),
        ('New Customers', sales.exclude(device_id__isnull=True).exclude(device_id='').values('device_id').distinct().count(), target.new_customers_target if target else 0),
        ('Inventory Turnover', cost_of_sales / inventory_value if inventory_value else Decimal('0'), target.inventory_turnover_target if target else Decimal('0')),
    ]
    return JsonResponse({'targets': [{'name': name, 'actual': float(actual), 'target': float(goal), 'achieved_percent': round(float(actual / goal * 100), 2) if goal else 0} for name, actual, goal in metrics]})


# ─────────────────────────────────────────────
# 13. YEARLY BREAKDOWN — past 5 years: revenue, expense, profit + growth
# ─────────────────────────────────────────────
def yearly_breakdown(request):
    current_year = selected_month_range(request)[0].year
    years = list(range(current_year - 4, current_year + 1))

    # Only include years that have actual sales data
    years_with_data = set(
        Sale.objects.filter(date__year__in=years)
        .values_list('date__year', flat=True)
        .distinct()
    )

    result = []
    prev_revenue = None

    for year in years:
        if year not in years_with_data:
            continue

        revenue = Sale.objects.filter(
            date__year=year
        ).aggregate(t=Sum('total'))['t'] or Decimal('0.00')

        expenses = report_expenses_between(datetime.date(year, 1, 1), datetime.date(year + 1, 1, 1))

        profit = get_profit_for_queryset(
            SaleItem.objects.filter(sale__date__year=year)
        )

        # Growth vs previous available year
        if prev_revenue is not None and prev_revenue > 0:
            growth_pct = float(((revenue - prev_revenue) / prev_revenue) * 100)
        else:
            growth_pct = None

        result.append({
            'year': year,
            'revenue': float(revenue),
            'expenses': float(expenses),
            'profit': float(profit),
            'growth_percent': round(growth_pct, 2) if growth_pct is not None else None,
            'available': True,
        })

        prev_revenue = revenue

    months = Sale.objects.filter(date__year=current_year).annotate(month=TruncMonth('date')).values('month').annotate(revenue=Sum('total')).order_by('revenue')
    best = months.last()
    worst = months.first()
    previous_year_revenue = Sale.objects.filter(date__year=current_year - 1).aggregate(total=Sum('total'))['total'] or Decimal('0')
    current_revenue = Sale.objects.filter(date__year=current_year).aggregate(total=Sum('total'))['total'] or Decimal('0')
    yoy = float((current_revenue - previous_year_revenue) / previous_year_revenue * 100) if previous_year_revenue else 0
    first_revenue = Decimal(str(result[0]['revenue'])) if result else Decimal('0')
    cagr = float(((current_revenue / first_revenue) ** (Decimal('1') / max(len(result) - 1, 1)) - 1) * 100) if first_revenue and current_revenue else 0
    return JsonResponse({'yearly': result, 'stats': {'best_month': best['month'].strftime('%B') if best else None, 'worst_month': worst['month'].strftime('%B') if worst else None, 'yoy_growth': round(yoy, 2), 'five_year_cagr': round(cagr, 2)}})
