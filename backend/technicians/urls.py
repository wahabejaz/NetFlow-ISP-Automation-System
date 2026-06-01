from django.urls import path
from . import views

app_name = 'technicians'

urlpatterns = [
    path('', views.technician_dashboard, name='dashboard'),
]
