from django.urls import path
from . import views

urlpatterns =  [
    path('products', views.product, name='products'),
    path('api/products/active', views.active_products, name="active_products"),
    path('products/<int:pk>/quick-view', views.productQuickView, name='quick_view'),
    path('products/<int:pk>/toggle-status', views.toggleProductStatus, name='toggle_status'),
    path('products/addProduct', views.addProduct, name='add_product'),
    path('products/<int:pk>/add-stock', views.add_stock, name='add_stock'),
    path('products/update/<int:pk>', views.edit_product, name='edit_product'),
    path('product/categories', views.categories, name='categories'),
    path('product/categories/<int:pk>/quick-view', views.categoryQuickView, name='category_quick_view'),
    path('inventory-report', views.inventory_report, name='inventory_report'),
    path('inventory/<int:pk>/delete/', views.clear_product, name='delete_batch')
]