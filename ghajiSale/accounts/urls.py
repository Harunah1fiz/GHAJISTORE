from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('staff/', views.staff_management, name='staff_management'),
    path('staff/<int:user_id>/update/', views.update_staff, name='update_staff'),
]
