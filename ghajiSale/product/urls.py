from django.urls import path
from . import views
from django.views.decorators.csrf import ensure_csrf_cookie
from accounts.decorators import login_required_json, role_required

product_access = role_required('Admin', 'Manager', 'Hybrid')
manager_access = role_required('Admin', 'Manager')
staff_access = role_required('Admin', 'Manager', 'Hybrid', 'Cashier')

urlpatterns =  [
    path('products', ensure_csrf_cookie(product_access(views.product)), name='products'),
    path('api/products/active', staff_access(login_required_json(views.active_products)), name="active_products"),
    path('products/<int:pk>/quick-view', product_access(views.productQuickView), name='quick_view'),
    path('products/<int:pk>/toggle-status', manager_access(views.toggleProductStatus), name='toggle_status'),
    path('products/addProduct', ensure_csrf_cookie(product_access(views.addProduct)), name='add_product'),
    path('products/<int:pk>/add-stock', manager_access(views.add_stock), name='add_stock'),
    path('products/update/<int:pk>', ensure_csrf_cookie(product_access(views.edit_product)), name='edit_product'),
    path('product/categories', ensure_csrf_cookie(manager_access(views.categories)), name='categories'),
    path('product/categories/<int:pk>/quick-view', manager_access(views.categoryQuickView), name='category_quick_view'),
    path('inventory-report', ensure_csrf_cookie(product_access(views.inventory_report)), name='inventory_report'),
    path('inventory/<int:pk>/delete/', manager_access(views.clear_product), name='delete_batch')
]