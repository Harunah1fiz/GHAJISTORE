from functools import wraps
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import redirect
from django.urls import reverse


def _is_json_request(request):
    content_type = request.META.get('CONTENT_TYPE', '')
    accept = request.META.get('HTTP_ACCEPT', '')
    return 'application/json' in content_type or 'application/json' in accept or request.path.startswith('/reports/api/') or request.path.startswith('/sales/api/') or request.path.startswith('/product/api/') or request.path.startswith('/api/')


def group_required(group_names, login_url='login', redirect_field_name=REDIRECT_FIELD_NAME):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                if _is_json_request(request):
                    return JsonResponse({'error': 'Authentication required'}, status=401)
                return redirect(f"{reverse(login_url)}?{redirect_field_name}={request.path}")

            if request.user.is_superuser or request.user.groups.filter(name__in=group_names).exists():
                return view_func(request, *args, **kwargs)

            if _is_json_request(request):
                return JsonResponse({'error': 'Permission denied'}, status=403)
            return HttpResponseForbidden('Permission denied')

        return _wrapped_view

    return decorator


def login_required_json(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            if _is_json_request(request):
                return JsonResponse({'error': 'Authentication required'}, status=401)
            return redirect(f"{reverse('login')}?next={request.path}")
        return view_func(request, *args, **kwargs)

    return _wrapped_view
