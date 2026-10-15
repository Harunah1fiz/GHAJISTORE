from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from .decorators import role_required
from .forms import ProfileUpdateForm, StaffCreateForm, StaffUpdateForm

ROLES = ('Admin', 'Manager', 'Hybrid', 'Cashier')
ORDINARY_ROLES = ('Hybrid', 'Cashier')
User = get_user_model()


def _user_roles(user):
    if user.is_superuser:
        return {'Admin'}
    return set(user.groups.values_list('name', flat=True))


def _is_admin(user):
    return user.is_superuser or 'Admin' in _user_roles(user)


def _can_manage_target(actor, target):
    if actor.pk == target.pk:
        return False
    if _is_admin(actor):
        return True
    return bool(
        'Manager' in _user_roles(actor)
        and not target.is_superuser
        and not target.is_staff
        and not (_user_roles(target) & {'Admin', 'Manager'})
    )

def login_view(request):
    if request.user.is_authenticated:
        return redirect('sale_page')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        remember_me = request.POST.get('remember_me') == 'on'

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            if remember_me:
                request.session.set_expiry(1209600)
            else:
                request.session.set_expiry(0)
            messages.success(request, f'Welcome back, {user.get_full_name() or user.username}!')
            next_page = request.GET.get('next') or request.POST.get('next') or reverse('sale_page')
            if not url_has_allowed_host_and_scheme(next_page, allowed_hosts={request.get_host()}, require_https=request.is_secure()):
                next_page = reverse('sale_page')
            return redirect(next_page)

        messages.error(request, 'Invalid username or password.')

    context = {
        'next': request.GET.get('next', ''),
    }
    return render(request, 'account/login.html', context)


def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
        messages.success(request, 'You have been logged out successfully.')
    return redirect('login')


@login_required
def profile(request):
    user = request.user

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'update_profile':
            profile_form = ProfileUpdateForm(request.POST, instance=user)
            password_form = PasswordChangeForm(user)

            if profile_form.is_valid():
                profile_form.save()
                messages.success(request, 'Your profile has been updated.')
                return redirect('profile')
            else:
                messages.error(request, 'Please fix the errors below.')

        elif action == 'change_password':
            profile_form = ProfileUpdateForm(instance=user)
            password_form = PasswordChangeForm(user, request.POST)

            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)
                messages.success(request, 'Your password has been updated.')
                return redirect('profile')
            
            messages.error(request, 'Please fix the errors below.')
        else:
            profile_form = ProfileUpdateForm(instance=user)
            password_form = PasswordChangeForm(user)
    else:
        profile_form = ProfileUpdateForm(instance=user)
        password_form = PasswordChangeForm(user)

    

    context = {
        'password_form': password_form,
        'profile_form': profile_form,
        'user_groups': user.groups.all(),
        'active_page': 'Profile',
    }
    return render(request, 'account/profile.html', context)


@login_required
@role_required('Admin', 'Manager')
def staff_management(request):
    admin = _is_admin(request.user)
    available_roles = ROLES if admin else ORDINARY_ROLES
    form = StaffCreateForm(roles=available_roles)
    if request.method == 'POST':
        form = StaffCreateForm(request.POST, roles=available_roles)
        if form.is_valid():
            user = User.objects.create_user(
                username=form.cleaned_data['username'],
                password=form.cleaned_data['password1'],
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
                email=form.cleaned_data['email'],
            )
            user.is_superuser = admin and form.cleaned_data['is_superuser']
            user.is_staff = user.is_superuser
            user.save(update_fields=['is_superuser', 'is_staff'])
            user.groups.set([Group.objects.get(name=form.cleaned_data['role'])])
            messages.success(request, f'Account for {user.username} created.')
            return redirect('staff_management')

    users = User.objects.prefetch_related('groups').order_by('username')
    if not admin:
        users = [
            user for user in users
            if not user.is_superuser and not user.is_staff and not (_user_roles(user) & {'Admin', 'Manager'})
        ]
    for staff_user in users:
        staff_user.role_names = _user_roles(staff_user)
    return render(request, 'account/staff_management.html', {
        'form': form,
        'staff_users': users,
        'available_roles': available_roles,
        'is_admin': admin,
        'active_page': 'Staff Management',
    })


@login_required
@role_required('Admin', 'Manager')
def update_staff(request, user_id):
    if request.method != 'POST':
        return redirect('staff_management')
    target = get_object_or_404(User, pk=user_id)
    if not _can_manage_target(request.user, target):
        return redirect('staff_management')

    admin = _is_admin(request.user)
    available_roles = ROLES if admin else ORDINARY_ROLES
    form = StaffUpdateForm(request.POST, roles=available_roles)
    if form.is_valid():
        role = form.cleaned_data['role']
        if role not in available_roles:
            messages.error(request, 'You cannot assign that role.')
            return redirect('staff_management')
        target.groups.set([Group.objects.get(name=role)])
        target.is_active = form.cleaned_data['is_active']
        target.first_name = form.cleaned_data['first_name']
        target.last_name = form.cleaned_data['last_name']
        target.email = form.cleaned_data['email']
        if admin and 'is_superuser' in request.POST:
            target.is_superuser = request.POST.get('is_superuser') == 'on'
            target.is_staff = target.is_superuser
        target.save(update_fields=['is_active', 'is_superuser', 'is_staff', 'first_name', 'last_name', 'email'])
        messages.success(request, f'Account for {target.username} updated.')
    else:
        messages.error(request, 'Please select a valid role.')
    return redirect('staff_management')