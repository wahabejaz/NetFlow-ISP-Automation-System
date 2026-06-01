from django.urls import path
from . import views

app_name = 'billing'

urlpatterns = [
    path('', views.billing_list, name='list'),
    path('<int:bill_id>/pdf/', views.generate_bill_pdf, name='generate_pdf'),
]
