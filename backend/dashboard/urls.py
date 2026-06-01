from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('', views.admin_dashboard, name='admin_dashboard'),
    path('analytics/', views.analytics_dashboard, name='analytics_dashboard'),
]
