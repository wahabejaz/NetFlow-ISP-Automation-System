from django.shortcuts import render, HttpResponse
from django.contrib.auth.decorators import login_required
from .services import DashboardService
import json
import csv

@login_required
def admin_dashboard(request):
    if request.user.role != 'admin':
        from django.core.exceptions import PermissionDenied
        raise PermissionDenied

    context = {
        'active_menu': 'dashboard',
        'kpi': DashboardService.get_kpi_data(),
        'revenue_data': json.dumps(DashboardService.get_monthly_revenue_data()),
        'category_data': json.dumps(DashboardService.get_complaint_category_data()),
        'recent_complaints': DashboardService.get_recent_complaints(),
        'technicians': DashboardService.get_technician_status(),
    }
    return render(request, 'dashboard/admin_dashboard.html', context)

@login_required
def analytics_dashboard(request):
    if request.user.role != 'admin':
        from django.core.exceptions import PermissionDenied
        raise PermissionDenied

    # Handle CSV Download
    if request.method == 'POST' and 'download_csv' in request.POST:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="analytics_report.csv"'
        writer = csv.writer(response)
        writer.writerow(['Month', 'Revenue', 'Customers', 'Complaints', 'Resolution Rate', 'Avg Resolution Time'])
        writer.writerow(['April, 2021', '$11,780', '238', '15', '90.0%', '9:00'])
        writer.writerow(['April, 2022', '$10,850', '293', '50', '94.5%', '12:03'])
        writer.writerow(['April, 2023', '$13,980', '285', '72', '90.0%', '12:53'])
        return response

    # Handle PDF Download (mocked as simple text/html for now or similar)
    if request.method == 'POST' and 'download_pdf' in request.POST:
        response = HttpResponse("PDF Generation not fully implemented. Please use CSV.", content_type='text/plain')
        response['Content-Disposition'] = 'attachment; filename="analytics_report.pdf"'
        return response

    context = {
        'active_menu': 'analytics',
        'kpi': {
            'revenue': 'PKR 4.2M',
            'customers': '1,245',
            'complaints': '47',
            'resolution_rate': '92%',
            'avg_resolution_time': '2h 15m'
        }
    }
    return render(request, 'dashboard/analytics_dashboard.html', context)
