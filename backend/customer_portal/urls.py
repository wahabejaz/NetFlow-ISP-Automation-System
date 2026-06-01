from django.urls import path
from . import views

app_name = 'portal'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('chatbot/', views.chatbot_view, name='chatbot'),
    path('complaints/submit/', views.submit_complaint, name='submit_complaint'),
]
