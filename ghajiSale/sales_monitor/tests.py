from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from product.models import Category, Inventory, Pricing, Product
from sales_monitor.models import Sale, SaleItem


class CheckoutPackPricingTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Beverages')
        self.product = Product.objects.create(name='Fanta', barcode='FANTA-1', category=self.category)
        Inventory.objects.create(product=self.product, quantity=24, low_stock_threshold=2)
        user = get_user_model().objects.create_user(username='cashier', password='test-password')
        self.client.force_login(user)
        Pricing.objects.create(
            product=self.product,
            retail_price=Decimal('200.00'),
            cost=Decimal('120.00'),
            is_pack=True,
            case_selling_price=Decimal('1800.00'),
            case_count=2,
            pack_size=12,
        )

    def test_checkout_uses_pack_price_for_case_sale(self):
        payload = {
            'total': '1800.00',
            'received': '2000.00',
            'method': 'cash',
            'createdAt': '2025-01-15T12:00:00Z',
            'items': [
                {
                    'id': self.product.id,
                    'name': self.product.name,
                    'price': '1800.00',
                    'qty': 1,
                    'quantityUnits': 12,
                    'total': '1800.00',
                }
            ],
        }

        response = self.client.post(reverse('checkout'), data=payload, content_type='application/json')

        self.assertEqual(response.status_code, 200, response.content)
        sale = Sale.objects.get()
        sale_item = SaleItem.objects.get(sale=sale)
        self.assertEqual(sale.total, Decimal('1800.00'))
        self.assertEqual(sale_item.itemTotal, Decimal('1800.00'))
        self.assertEqual(sale_item.quantity, 12)
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.quantity, 12)

    def test_checkout_uses_unit_price_when_selling_individual_units(self):
        payload = {
            'total': '400.00',
            'received': '500.00',
            'method': 'cash',
            'createdAt': '2025-01-15T12:00:00Z',
            'items': [
                {
                    'id': self.product.id,
                    'name': self.product.name,
                    'price': '200.00',
                    'qty': 2,
                    'quantityUnits': 2,
                    'total': '400.00',
                }
            ],
        }

        response = self.client.post(reverse('checkout'), data=payload, content_type='application/json')

        self.assertEqual(response.status_code, 200, response.content)
        sale_item = SaleItem.objects.get()
        self.assertEqual(sale_item.itemTotal, Decimal('400.00'))
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.quantity, 22)

    def test_checkout_requires_an_authenticated_user(self):
        self.client.logout()
        response = self.client.post(
            reverse('checkout'),
            data={'total': '0', 'received': '0', 'items': []},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(Sale.objects.count(), 0)

    def test_retried_transaction_id_does_not_create_a_duplicate_sale(self):
        payload = {
            'transactionId': 'offline-tx-unique-1',
            'total': '400.00',
            'received': '500.00',
            'method': 'cash',
            'createdAt': '2025-01-15T12:00:00Z',
            'items': [{
                'id': self.product.id,
                'price': '200.00',
                'qty': 2,
                'quantityUnits': 2,
                'total': '400.00',
            }],
        }
        first = self.client.post(reverse('checkout'), data=payload, content_type='application/json')
        retry = self.client.post(reverse('checkout'), data=payload, content_type='application/json')

        self.assertEqual(first.status_code, 200, first.content)
        self.assertEqual(retry.status_code, 200, retry.content)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(SaleItem.objects.count(), 1)
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.quantity, 22)
