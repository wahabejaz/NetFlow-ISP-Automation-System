from django.urls import path

from . import views

urlpatterns = [
    path("auth/login/", views.login_view, name="login"),
    path("auth/me/", views.me_view, name="me"),
    path("areas/", views.areas_view, name="areas"),
    path("bootstrap/", views.bootstrap_view, name="bootstrap"),
    path("customers/", views.customer_list_view, name="customers"),
    path("customers/<int:pk>/", views.customer_detail_view, name="customer-detail"),
    path("packages/", views.package_list_view, name="packages"),
    path("packages/<int:pk>/", views.package_detail_view, name="package-detail"),
    path("invoices/", views.invoice_list_view, name="invoices"),
    path("invoices/<int:pk>/", views.invoice_detail_view, name="invoice-detail"),
    path("tickets/", views.ticket_list_view, name="tickets"),
    path("tickets/<int:pk>/", views.ticket_detail_view, name="ticket-detail"),
    path("technicians/", views.technician_list_view, name="technicians"),
    path("technicians/<int:pk>/", views.technician_detail_view, name="technician-detail"),
    path("settings/", views.settings_view, name="settings"),
    path("dashboard/summary/", views.dashboard_summary_view, name="dashboard-summary"),
    path("ai/analyze/", views.ai_analyze_view, name="ai-analyze"),
    path("ai/draft-reply/", views.ai_draft_reply_view, name="ai-draft-reply"),
    path("ai/chat/", views.ai_chat_view, name="ai-chat"),
    path("audit/", views.audit_logs_view, name="audit"),
]
