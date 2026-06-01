from django.urls import path
from . import views

app_name = 'customers'

urlpatterns = [
    path('', views.customer_list, name='list'),
    path('onboard/', views.customer_onboard, name='onboard'),
]
