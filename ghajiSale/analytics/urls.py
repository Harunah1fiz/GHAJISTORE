from django.urls import path
from . import views
from accounts.decorators import role_required

management_report = role_required('Admin', 'Manager')

urlpatterns = [
    # 1. Weekly revenue vs last week
    path('revenue/weekly/', management_report(views.weekly_revenue), name='weekly_revenue'),

    # 2. Summary cards: sales, profit, expense, inventory value
    path('summary/', management_report(views.summary_cards), name='summary_cards'),

    # 3. Monthly earnings for current year + labels
    path('revenue/monthly/', management_report(views.monthly_earnings), name='monthly_earnings'),

    # 4. Profit: this month vs same month last year
    path('profit/monthly-compare/', management_report(views.profit_monthly_compare), name='profit_monthly_compare'),

    # 5. Month at a glance with color grade
    path('month-glance/', management_report(views.month_at_a_glance), name='month_at_a_glance'),

    # 6. Revenue vs expense chart for full year
    path('revenue-expense/yearly/', management_report(views.revenue_vs_expense_yearly), name='revenue_vs_expense_yearly'),

    # 7. Expense total + breakdown by category
    path('expenses/', management_report(views.expenses_breakdown), name='expenses_breakdown'),

    # 8. Operational KPIs
    path('kpis/', management_report(views.operational_kpis), name='operational_kpis'),

    # 9. Peak sales hours (6am–8pm)
    path('peak-hours/', management_report(views.peak_hours), name='peak_hours'),

    # 10. Category performance (revenue, profit, weekly, monthly chart)
    path('category-performance/', management_report(views.category_performance), name='category_performance'),

    # 11. Top 10 products (search=<name> & category=<id> supported)
    path('products/top/', management_report(views.top_products), name='top_products'),

    # 12. Monthly sales targets vs actual
    path('targets/', management_report(views.sales_targets), name='sales_targets'),

    # 13. 5-year yearly breakdown
    path('yearly-breakdown/', management_report(views.yearly_breakdown), name='yearly_breakdown'),
]
