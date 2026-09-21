from django.db import models
from django.utils.text import slugify
from django.db.models import Sum, F, Count,ExpressionWrapper, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal
# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100, unique= True)
    description = models.TextField(blank=True)
    category_image = models.ImageField(upload_to="categories/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=225, db_index=True)
    slug = models.SlugField(max_length=100, db_index=True, blank=True, null=True)
    barcode = models.CharField(max_length=100, unique=True, db_index=True,blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    description = models.TextField(blank=True)

    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def get_total_profit(self):
        total_earning = self.sale_items.aggregate(total=Coalesce(Sum('itemTotal'), Decimal('0.00')))['total']
        total_quantity_sold = self.sale_items.aggregate(total=Coalesce(Sum('quantity'), 0))['total']
        total_cost = total_quantity_sold * self.pricing.cost
        return total_earning - total_cost

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
class Inventory(models.Model):
    # each inventory has one inventory state
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    quantity = models.PositiveBigIntegerField(default=0)
    low_stock_threshold = models.PositiveBigIntegerField(default=10)
    
    last_restocked = models.DateTimeField(null=True, blank=True)
    total_stock_lifetime = models.PositiveBigIntegerField(default=0)

    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold

class InventoryBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_batches')
    quantity = models.PositiveIntegerField()
    remaining_quantity = models.PositiveIntegerField()
    expiry_date = models.DateField(null=True, blank=True)
    batch_number= models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.batch_number}"
    

class Pricing(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(max_digits=10, decimal_places=2)

    is_pack = models.BooleanField(default=False)

    case_selling_price = models.DecimalField(max_digits=10, decimal_places = 2, null=True, blank=True)
    case_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    case_count = models.PositiveIntegerField(null=True, blank=True)
    pack_size = models.PositiveIntegerField(null=True, blank= True)

    damaged_units = models.PositiveIntegerField(default=0)
    
    def gross_margin(self):
        if self.retail_price > 0:
            return ((self.retail_price - self.cost) / self.retail_price) * 100
        
    @property
    def total_units(self):
        if self.is_pack and self.pack_size and self.case_count:
            return self.pack_size * self.case_count
        return 0
    
class ProductAttribute(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    is_expiry = models.BooleanField(default=False)
    fragile = models.BooleanField(default=False)
    biodegradable = models.BooleanField(default=False)

""" these fields in the table change in different rate
    product info changes rarely,inventory changes daily sometimes hourly
    pricing changes occationally sometimes historically tracked
"""


# Product List


# movement
class StockMovement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    quantity_change = models.IntegerField()
    movement_type = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)