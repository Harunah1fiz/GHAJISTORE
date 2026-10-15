import json
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from reports.models import ActivityLog, Expense, Notification, Report
from sales_monitor.models import Sale


User = get_user_model()


def create_role_user(username, role):
    user = User.objects.create_user(username=username, password='StrongTestPassword!42')
    user.groups.add(Group.objects.get(name=role))
    return user


class DailyReportPermissionTests(TestCase):
    def setUp(self):
        self.cashier = create_role_user('cashier', 'Cashier')
        self.other_cashier = create_role_user('other-cashier', 'Cashier')
        self.manager = create_role_user('manager', 'Manager')
        today = timezone.localdate()
        now = timezone.now()
        Sale.objects.create(cashier=self.cashier, total=Decimal('120'), received=Decimal('120'), date=now, method='cash')
        Sale.objects.create(cashier=self.other_cashier, total=Decimal('250'), received=Decimal('250'), date=now, method='cash')
        Sale.objects.create(cashier=None, total=Decimal('30'), received=Decimal('30'), date=now, method='cash')

    def get_report(self):
        return self.client.get(reverse('daily_report_data'), {'date': timezone.localdate().isoformat()})

    def test_cashier_daily_report_contains_only_own_sales_and_reports(self):
        self.client.force_login(self.cashier)
        response = self.get_report()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['summary']['total_sales'], 120.0)
        self.assertEqual(data['summary']['num_transactions'], 1)
        self.assertEqual(data['summary']['unattributed_sales'], 0.0)
        self.assertEqual(data['employee_sales'], [])

    def test_manager_daily_report_includes_per_employee_and_unattributed_totals(self):
        self.client.force_login(self.manager)
        data = self.get_report().json()
        self.assertEqual(data['summary']['total_sales'], 400.0)
        self.assertEqual(data['summary']['unattributed_sales'], 30.0)
        self.assertEqual(data['summary']['unattributed_transactions'], 1)
        self.assertEqual({row['username'] for row in data['employee_sales']}, {'cashier', 'other-cashier'})

    def test_report_creation_records_owner_and_supports_notifications_and_activity(self):
        self.client.force_login(self.manager)
        response = self.client.post(
            reverse('create_expense') + '?date=' + timezone.localdate().isoformat(),
            data=json.dumps({'category': 'other', 'amount': '10.50', 'description': 'Till supplies'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201, response.content)
        expense_report = Expense.objects.get()
        self.assertEqual(expense_report.report.created_by, self.manager)
        notification = Notification.objects.get()
        self.assertEqual(notification.user, self.manager)
        self.assertEqual(notification.icon, 'receipt')
        self.assertEqual(ActivityLog.objects.get().user, self.manager)
        update_url = reverse('update_report', args=['expense', expense_report.pk])
        updated = self.client.put(
            update_url,
            data=json.dumps({'category': 'other', 'amount': '11.50', 'description': 'Updated till supplies'}),
            content_type='application/json',
        )
        self.assertEqual(updated.status_code, 200, updated.content)
        self.client.force_login(self.cashier)
        denied = self.client.put(
            update_url,
            data=json.dumps({'category': 'other', 'amount': '12', 'description': 'Unauthorized edit'}),
            content_type='application/json',
        )
        self.assertEqual(denied.status_code, 403)

    def test_cashier_cannot_create_business_expense_or_stock_adjustment_reports(self):
        self.client.force_login(self.cashier)
        expense_response = self.client.post(
            reverse('create_expense') + '?date=' + timezone.localdate().isoformat(),
            data=json.dumps({'category': 'other', 'amount': '10', 'description': 'Till supplies'}),
            content_type='application/json',
        )
        stock_response = self.client.post(
            reverse('create_stock_adjustment') + '?date=' + timezone.localdate().isoformat(),
            data=json.dumps({'product_id': 999, 'quantity': 1, 'reason': 'Correction'}),
            content_type='application/json',
        )
        self.assertEqual(expense_response.status_code, 403)
        self.assertEqual(stock_response.status_code, 403)
        self.assertFalse(Expense.objects.exists())
        self.assertFalse(Report.objects.exists())

    def test_anonymous_user_cannot_read_daily_report(self):
        self.assertEqual(self.get_report().status_code, 401)


class LegacyReportCompatibilityTests(TestCase):
    def test_system_notifications_can_exist_without_a_report(self):
        notification = Notification.objects.create(title='System', message='Ready', report=None, icon='bell')
        self.assertIn('System', str(notification))

# Create your tests here.
