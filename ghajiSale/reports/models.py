from django.db import models;
from django.conf import settings

from product.models import Product


class Report(models.Model):

    REPORT_TYPES = [
        ("expense", "Expense"),
        ("stock", "Stock"),
        ("cash", "Cash Difference"),
        ("incident", "Incident"),
    ]

    STATUS = [
        ("submitted", "Submitted"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)

    status = models.CharField(max_length=20, choices=STATUS, default="submitted")

    # cashier = models.ForeignKey(User,...)

    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)


class Expense(models.Model):

    report = models.OneToOneField(
        Report,
        on_delete=models.CASCADE
    )

    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('salaries', 'Salaries'),
        ('restocking', 'Restocking'),
        ('maintenance', 'Maintenance'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    description = models.TextField()

class StockAdjustment(models.Model):

    ADJUSTMENT_CHOICES = [
        ("deducted", "Deducted"),
        ("added", "Added"),
        ("damaged", "Damaged"),
    ]
    report = models.OneToOneField(
        Report,
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_in_stock')

    quantity = models.PositiveIntegerField()

    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_CHOICES)

    reason = models.TextField()

class CashDifference(models.Model):

    report = models.OneToOneField(
        Report,
        on_delete=models.CASCADE
    )

    expected = models.DecimalField(max_digits=10, decimal_places=2)

    counted = models.DecimalField(max_digits=10, decimal_places=2)

    difference = models.DecimalField(max_digits=10, decimal_places=2)

    reason = models.TextField()


class Incident(models.Model):

    report = models.OneToOneField(
        Report,
        on_delete=models.CASCADE
    )
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]
    title = models.CharField(max_length=200)

    severity = models.CharField(max_length=200, choices=SEVERITY_CHOICES)

    description = models.TextField()


class EndShift(models.Model):
    report = models.OneToOneField(Report, on_delete=models.CASCADE, related_name='end_shift')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    opening_balance = models.DecimalField(max_digits=10, decimal_places=2)
    expected_cash = models.DecimalField(max_digits=10, decimal_places=2)
    counted_cash = models.DecimalField(max_digits=10, decimal_places=2)
    difference = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.report.report_type} - {self.title}"
