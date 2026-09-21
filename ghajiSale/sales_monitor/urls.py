from django.urls import path
from . import views

urlpatterns =  [
    path('salemonitor', views.sale, name='sale_page'),
    path('api/checkout', views.checkout, name='checkout'),
    path('api/health', views.health_check, name='health_check'),

]