from django.contrib import admin
from .models import Pricing,Product,Inventory,ProductAttribute,Category,StockMovement,InventoryBatch

# Register your models here.
admin.site.register(Pricing)
admin.site.register(Product)
admin.site.register(Inventory)
admin.site.register(ProductAttribute)
admin.site.register(Category)
admin.site.register(StockMovement)
admin.site.register(InventoryBatch)
