from django.urls import path
from . import views

urlpatterns = [
    # 1. Weekly revenue vs last week
    path('revenue/weekly/', views.weekly_revenue, name='weekly_revenue'),

    # 2. Summary cards: sales, profit, expense, inventory value
    path('summary/', views.summary_cards, name='summary_cards'),

    # 3. Monthly earnings for current year + labels
    path('revenue/monthly/', views.monthly_earnings, name='monthly_earnings'),

    # 4. Profit: this month vs same month last year
    path('profit/monthly-compare/', views.profit_monthly_compare, name='profit_monthly_compare'),

    # 5. Month at a glance with color grade
    path('month-glance/', views.month_at_a_glance, name='month_at_a_glance'),

    # 6. Revenue vs expense chart for full year
    path('revenue-expense/yearly/', views.revenue_vs_expense_yearly, name='revenue_vs_expense_yearly'),

    # 7. Expense total + breakdown by category
    path('expenses/', views.expenses_breakdown, name='expenses_breakdown'),

    # 8. Operational KPIs
    path('kpis/', views.operational_kpis, name='operational_kpis'),

    # 9. Peak sales hours (6am–8pm)
    path('peak-hours/', views.peak_hours, name='peak_hours'),

    # 10. Category performance (revenue, profit, weekly, monthly chart)
    path('category-performance/', views.category_performance, name='category_performance'),

    # 11. Top 10 products (search=<name> & category=<id> supported)
    path('products/top/', views.top_products, name='top_products'),

    # 12. Monthly sales targets vs actual
    path('targets/', views.sales_targets, name='sales_targets'),

    # 13. 5-year yearly breakdown
    path('yearly-breakdown/', views.yearly_breakdown, name='yearly_breakdown'),
]
