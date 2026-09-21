from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.shortcuts import render, redirect
from django.urls import reverse


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
    password_form = PasswordChangeForm(request.user, request.POST or None)

    if request.method == 'POST':
        if password_form.is_valid():
            user = password_form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Your password has been updated.')
            return redirect('profile')
        messages.error(request, 'Please fix the errors below.')

    context = {
        'password_form': password_form,
        'active_page': 'Profile',
    }
    return render(request, 'account/profile.html', context)