from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.template.loader import render_to_string
from .models import Bill
import logging

logger = logging.getLogger(__name__)

@login_required
def billing_list(request):
    from django.db.models import Sum
    bills = Bill.objects.select_related('customer__user', 'package').all()
    
    # Calculate KPIs
    total_billed = bills.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    collected = bills.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    pending = bills.filter(status='unpaid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    overdue = bills.filter(status='overdue').aggregate(Sum('total_amount'))['total_amount__sum'] or 0

    context = {
        'active_menu': 'billing', 
        'bills': bills,
        'total_billed': total_billed,
        'collected': collected,
        'pending': pending,
        'overdue': overdue
    }
    return render(request, 'billing/list.html', context)

@login_required
def generate_bill_pdf(request, bill_id):
    bill = get_object_or_404(Bill, id=bill_id)
    html_string = render_to_string('billing/pdf.html', {'bill': bill})

    try:
        import weasyprint
    except (ImportError, OSError):
        logger.warning(
            "WeasyPrint is not installed or not available. Returning HTML fallback instead of PDF."
        )
        return HttpResponse(html_string)

    try:
        pdf_file = weasyprint.HTML(
            string=html_string,
            base_url=request.build_absolute_uri('/'),
        ).write_pdf()
    except Exception:
        logger.exception(
            "WeasyPrint failed to generate PDF. Returning HTML fallback instead."
        )
        return HttpResponse(html_string)

    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="bill_{bill.invoice_number}.pdf"'
    return response
