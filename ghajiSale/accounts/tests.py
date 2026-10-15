from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.test import override_settings
from django.urls import reverse

from product.models import Category, Inventory, Pricing, Product


User = get_user_model()


def create_role_user(username, role, password='StrongTestPassword!42'):
    user = User.objects.create_user(username=username, password=password)
    user.groups.add(Group.objects.get(name=role))
    return user


class RolePermissionTests(TestCase):
    def setUp(self):
        self.cashier = create_role_user('cashier', 'Cashier')
        category = Category.objects.create(name='Beverages')
        self.product = Product.objects.create(name='Drink', barcode='drink-1', category=category)
        Inventory.objects.create(product=self.product, quantity=10, low_stock_threshold=2)
        Pricing.objects.create(product=self.product, retail_price=10, cost=5)

    def test_cashier_can_use_pos_but_cannot_open_product_management(self):
        self.client.force_login(self.cashier)
        self.assertEqual(self.client.get(reverse('sale_page')).status_code, 200)
        self.assertEqual(self.client.get(reverse('quick_view', args=[self.product.pk])).status_code, 403)

    @override_settings(STORAGES={
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    })
    def test_hybrid_can_access_product_and_inventory_views_but_not_business_analytics(self):
        hybrid = create_role_user('hybrid', 'Hybrid')
        self.client.force_login(hybrid)
        quick_view = self.client.get(reverse('quick_view', args=[self.product.pk]))
        self.assertEqual(quick_view.status_code, 200)
        self.assertNotIn('total_profit', quick_view.json())
        product_page = self.client.get(reverse('products'))
        self.assertEqual(product_page.status_code, 200)
        self.assertNotContains(product_page, 'Store Sale')
        self.assertEqual(self.client.get(reverse('monthly_report_page')).status_code, 403)

    def test_manager_can_open_business_reports_and_manage_staff(self):
        manager = create_role_user('manager', 'Manager')
        self.client.force_login(manager)
        self.assertEqual(self.client.get(reverse('monthly_report_page')).status_code, 200)
        self.assertEqual(self.client.get(reverse('staff_management')).status_code, 200)


class ProfileAndStaffManagementTests(TestCase):
    def setUp(self):
        self.manager = create_role_user('manager', 'Manager')

    def test_profile_edits_only_authenticated_users_own_safe_fields(self):
        target = create_role_user('target', 'Cashier')
        target.set_password('InitialPassword!42')
        target.save()
        self.client.force_login(target)
        response = self.client.post(reverse('profile'), {
            'action': 'update_profile',
            'first_name': 'Updated',
            'last_name': 'Cashier',
            'email': 'cashier@example.test',
            'username': 'changed-by-post',
            'is_superuser': 'on',
        })
        target.refresh_from_db()
        self.assertEqual(response.status_code, 302)
        self.assertEqual(target.first_name, 'Updated')
        self.assertEqual(target.username, 'target')
        self.assertFalse(target.is_superuser)
        self.assertTrue(target.groups.filter(name='Cashier').exists())

    def test_manager_can_create_ordinary_staff_but_cannot_grant_manager_role(self):
        self.client.force_login(self.manager)
        ordinary_data = {
            'username': 'new-hybrid',
            'email': 'new@example.test',
            'role': 'Hybrid',
            'password1': 'StrongUniquePassword!2026',
            'password2': 'StrongUniquePassword!2026',
        }
        response = self.client.post(reverse('staff_management'), ordinary_data)
        self.assertEqual(response.status_code, 302)
        staff = User.objects.get(username='new-hybrid')
        self.assertTrue(staff.groups.filter(name='Hybrid').exists())

        ordinary_data.update(username='elevated', role='Manager')
        response = self.client.post(reverse('staff_management'), ordinary_data)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(username='elevated').exists())

    def test_manager_cannot_edit_manager_or_superuser_account(self):
        privileged = create_role_user('other-manager', 'Manager')
        privileged.is_superuser = True
        privileged.save(update_fields=['is_superuser'])
        self.client.force_login(self.manager)
        response = self.client.post(reverse('update_staff', args=[privileged.pk]), {
            'role': 'Cashier',
            'is_active': '',
        })
        privileged.refresh_from_db()
        self.assertEqual(response.status_code, 302)
        self.assertTrue(privileged.is_superuser)
        self.assertTrue(privileged.groups.filter(name='Manager').exists())

    def test_admin_can_assign_admin_and_superuser_roles(self):
        admin_user = create_role_user('admin', 'Admin')
        self.client.force_login(admin_user)
        response = self.client.post(reverse('staff_management'), {
            'username': 'new-admin',
            'email': 'admin@example.test',
            'role': 'Admin',
            'is_superuser': 'on',
            'password1': 'StrongUniquePassword!2026',
            'password2': 'StrongUniquePassword!2026',
        })
        self.assertEqual(response.status_code, 302)
        created = User.objects.get(username='new-admin')
        self.assertTrue(created.is_superuser)
        self.assertTrue(created.is_staff)
        self.assertTrue(created.groups.filter(name='Admin').exists())

    def test_password_change_preserves_the_authenticated_session(self):
        user = create_role_user('profile-user', 'Cashier')
        self.client.force_login(user)
        response = self.client.post(reverse('profile'), {
            'action': 'change_password',
            'old_password': 'StrongTestPassword!42',
            'new_password1': 'AnotherUniquePassword!2026',
            'new_password2': 'AnotherUniquePassword!2026',
        })
        user.refresh_from_db()
        self.assertEqual(response.status_code, 302)
        self.assertTrue(user.check_password('AnotherUniquePassword!2026'))
        self.assertEqual(int(self.client.session['_auth_user_id']), user.pk)

# Create your tests here.
