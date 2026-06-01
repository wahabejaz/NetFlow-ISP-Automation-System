from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from backend.customers.models import Customer
from backend.billing.models import Bill
from backend.complaints.models import Complaint
from backend.technicians.models import Technician

class DashboardService:
    @staticmethod
    def get_kpi_data():
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        total_customers = Customer.objects.count()
        new_this_month = Customer.objects.filter(created_at__gte=month_start).count()

        unpaid_total = Bill.objects.filter(
            status__in=['unpaid', 'overdue']
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        open_complaints = Complaint.objects.exclude(status='resolved').count()

        return {
            'total_customers': total_customers,
            'new_this_month': new_this_month,
            'unpaid_total': float(unpaid_total),
            'open_complaints': open_complaints,
        }

    @staticmethod
    def get_monthly_revenue_data():
        data = []
        now = timezone.now()
        for i in range(5, -1, -1):
            month = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)
            revenue = Bill.objects.filter(
                status='paid',
                paid_at__gte=month,
                paid_at__lt=next_month
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            data.append({'month': month.strftime('%b'), 'revenue': float(revenue)})
        return data

    @staticmethod
    def get_complaint_category_data():
        categories = Complaint.objects.values('ai_category').annotate(count=Count('id'))
        total = sum(c['count'] for c in categories)
        return [
            {
                'category': c['ai_category'] or 'Unclassified',
                'count': c['count'],
                'percentage': round(c['count'] / total * 100, 1) if total > 0 else 0
            }
            for c in categories
        ]

    @staticmethod
    def get_recent_complaints(limit=5):
        return Complaint.objects.select_related(
            'customer__user', 'assigned_technician__user'
        ).order_by('-created_at')[:limit]

    @staticmethod
    def get_technician_status():
        return Technician.objects.select_related('user').all()[:6]
