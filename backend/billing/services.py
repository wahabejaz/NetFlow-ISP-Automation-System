from datetime import date, timedelta
import logging
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.conf import settings

from .models import Bill

logger = logging.getLogger(__name__)


def send_invoice_email(bill: Bill):
    """Send invoice created email to the customer.

    This function logs failures and returns True on success, False on failure.
    It will not raise exceptions to callers so invoice workflows remain intact.
    """
    customer = getattr(bill, "customer", None)
    to_email = None
    result = {"sent": False, "reason": None}
    try:
        to_email = customer.user.email if customer and getattr(customer, 'user', None) and customer.user.email else None
        if not to_email:
            logger.info("Invoice %s: customer has no email, skipping send.", getattr(bill, 'invoice_number', ''))
            result["reason"] = "Customer email address is missing."
            return result

        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            logger.warning(
                "Invoice %s: SMTP email credentials are missing; email not sent.",
                getattr(bill, 'invoice_number', ''),
            )
            result["reason"] = "SMTP email credentials are not configured on the server."
            return result

        context = {
            'customer_name': customer.user.get_full_name() or customer.user.username,
            'invoice_number': bill.invoice_number,
            'total_amount': f"{bill.total_amount:.0f} PKR",
            'due_date': bill.due_date.strftime('%b %d, %Y'),
            'support_email': settings.EMAIL_HOST_USER or settings.DEFAULT_FROM_EMAIL,
        }

        subject = f"NetFlow ISP - New Invoice Generated: {bill.invoice_number}"
        text_body = render_to_string('emails/invoice_created.txt', context)
        html_body = render_to_string('emails/invoice_created.html', context)

        from_email = settings.DEFAULT_FROM_EMAIL
        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[to_email])
        msg.attach_alternative(html_body, "text/html")
        # Configure Reply-To: prefer explicit SMTP user, else extract from DEFAULT_FROM_EMAIL
        reply_to_addr = None
        if settings.EMAIL_HOST_USER:
            reply_to_addr = settings.EMAIL_HOST_USER
        else:
            # try to extract address from DEFAULT_FROM_EMAIL like 'Name <email@domain>'
            if "<" in settings.DEFAULT_FROM_EMAIL and ">" in settings.DEFAULT_FROM_EMAIL:
                start = settings.DEFAULT_FROM_EMAIL.find("<") + 1
                end = settings.DEFAULT_FROM_EMAIL.find(">", start)
                if end > start:
                    reply_to_addr = settings.DEFAULT_FROM_EMAIL[start:end]
        if reply_to_addr:
            msg.extra_headers = {"Reply-To": reply_to_addr}

        try:
            msg.send(fail_silently=False)
            logger.info("Invoice %s: sent to %s", bill.invoice_number, to_email)
            result["sent"] = True
            return result
        except Exception as exc:
            logger.exception("Failed to send invoice %s to %s", bill.invoice_number, to_email)
            result["reason"] = str(exc)
            return result
    except Exception as exc:
        logger.exception("Unexpected error in send_invoice_email for invoice %s to %s", getattr(bill, 'invoice_number', ''), to_email)
        result["reason"] = str(exc)
        return result


def send_due_reminders(days_ahead: int = 3):
    """Send reminders for bills due in `days_ahead` days or overdue."""
    today = timezone.now().date()
    target_date = today + timedelta(days=days_ahead)
    bills = Bill.objects.filter(status='unpaid', due_date__lte=target_date)
    sent = 0
    for bill in bills:
        customer = getattr(bill, "customer", None)
        to_email = None
        try:
            to_email = customer.user.email if customer and getattr(customer, 'user', None) and customer.user.email else None
            if not to_email:
                logger.info("Reminder: invoice %s has no customer email; skipping.", bill.invoice_number)
                continue
            context = {
                'customer_name': customer.user.get_full_name() or customer.user.username,
                'invoice_number': bill.invoice_number,
                'total_amount': f"{bill.total_amount:.0f} PKR",
                'due_date': bill.due_date.strftime('%b %d, %Y'),
                'support_email': settings.EMAIL_HOST_USER or settings.DEFAULT_FROM_EMAIL,
            }
            subject = f"NetFlow ISP - Payment Reminder: Invoice {bill.invoice_number}"
            text_body = render_to_string('emails/due_reminder.txt', context)
            html_body = render_to_string('emails/due_reminder.html', context)
            from_email = settings.DEFAULT_FROM_EMAIL
            msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[to_email])
            msg.attach_alternative(html_body, 'text/html')
            if settings.EMAIL_HOST_USER:
                msg.extra_headers = {"Reply-To": settings.EMAIL_HOST_USER}

            try:
                msg.send(fail_silently=False)
                sent += 1
                logger.info("Reminder sent for invoice %s to %s", bill.invoice_number, to_email)
            except Exception:
                logger.exception("Failed to send reminder for invoice %s to %s", bill.invoice_number, to_email)
                continue
        except Exception:
            logger.exception("Unexpected error when sending reminder for invoice %s", getattr(bill, 'invoice_number', ''))
            continue
    return sent
