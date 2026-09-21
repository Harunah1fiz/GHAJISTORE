from django import forms
from .models import InventoryBatch, Product,Inventory,Pricing,ProductAttribute,Category

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ["name", "barcode", "category", "description", "image"]


class InventoryForm(forms.ModelForm):
    class Meta:
        model = Inventory
        fields = ["quantity", "low_stock_threshold"]


class PricingForm(forms.ModelForm):
    class Meta:
        model = Pricing
        fields = [
            "retail_price",
            "cost",
            "is_pack",
            "case_selling_price",
            "case_cost",
            "case_count",
            "pack_size",
            "damaged_units"
        ]

class ProductAttributeForm(forms.ModelForm):
    class Meta:
        model = ProductAttribute
        fields = ["fragile", "biodegradable","is_expiry"]
        


class categoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ["name", "description", "category_image"]


class InventoryBatchForm(forms.ModelForm):
    class Meta:
        model = InventoryBatch
        fields = ["quantity", "expiry_date",]