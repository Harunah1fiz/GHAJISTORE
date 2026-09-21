from django.db import models
from django.conf import settings
from product.models import Product
# Create your models here.
class Sale(models.Model):
    #cashier = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete= models.CASCADE,)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    received = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField()
    method = models.CharField(max_length=20, default='cash')
    transaction_id = models.CharField(max_length=50, null=True)
    device_id = models.CharField(max_length=20, null=True)

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product,related_name='sale_items', on_delete=models.CASCADE, null=True, blank=True )
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    itemTotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)

class Expense(models.Model):
    """
    Tracks store expenses like rent, utilities, salaries, restocking, etc.
    Used in: summary cards, expense breakdown, revenue vs expense chart, yearly breakdown.
    """
    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('salaries', 'Salaries'),
        ('restocking', 'Restocking'),
        ('maintenance', 'Maintenance'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)  # e.g. "Rent", "Utilities"
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category} - {self.amount} on {self.date}"

class SaleTarget(models.Model):
    """
    Monthly revenue targets.
    Store as the first day of the month e.g. 2025-01-01 = January 2025 target.
    Used in: month at a glance, sales targets endpoint.
    """
    month = models.DateField()  # store as first day of month e.g. 2025-01-01
    target = models.DecimalField(max_digits=12, decimal_places=2)
    quarterly_profit_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    new_customers_target = models.PositiveIntegerField(default=0)
    inventory_turnover_target = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        unique_together = ('month',)

    def __str__(self):
        return f"{self.month.strftime('%B %Y')} — Target: {self.target}"
