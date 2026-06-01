import json
import os
from datetime import timedelta
from decimal import Decimal

import requests
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone

from backend.accounts.models import CustomUser
from backend.audit.models import AuditLog
from backend.billing.models import Bill, Payment
from backend.complaints.models import Complaint, ComplaintNote
from backend.customers.models import Customer
from backend.packages.models import Package
from backend.technicians.models import Job, Technician

from .models import SystemSettings

DISPLAY_TO_STATUS = {
    "Submitted": "submitted",
    "AI Analyzed": "ai_analyzed",
    "Assigned": "assigned",
    "In Progress": "in_progress",
    "Resolved": "resolved",
}

STATUS_TO_DISPLAY = {
    "submitted": "Submitted",
    "ai_analyzed": "AI Analyzed",
    "assigned": "Assigned",
    "in_progress": "In Progress",
    "resolved": "Resolved",
}

CATEGORY_TO_DISPLAY = {
    "speed_issue": "Speed Issue",
    "router": "Router",
    "outage": "Outage",
    "billing": "Billing",
    "installation": "Installation",
}

PRIORITY_TO_DISPLAY = {
    "low": "Low",
    "medium": "Medium",
    "urgent": "Urgent",
}


def get_ip_address(request):
    return request.META.get("REMOTE_ADDR") or "127.0.0.1"


def sanitize_changes(changes):
    if changes is None:
        return {}

    if hasattr(changes, "dict"):
        changes = changes.dict()
    elif hasattr(changes, "lists"):
        changes = {key: values[0] if len(values) == 1 else values for key, values in changes.lists()}

    if isinstance(changes, dict):
        sanitized = {}
        for key, value in changes.items():
            if hasattr(value, "read") or hasattr(value, "file"):
                sanitized[key] = f"<uploaded:{getattr(value, 'name', 'file')}>"
                continue
            try:
                json.dumps(value)
                sanitized[key] = value
            except TypeError:
                sanitized[key] = str(value)
        return sanitized

    try:
        json.dumps(changes)
        return changes
    except TypeError:
        return str(changes)


def log_action(request, action, model_name, object_id=None, changes=None):
    AuditLog.objects.create(
        user=request.user if hasattr(request, "user") and getattr(request.user, "is_authenticated", False) else None,
        action=action,
        model_name=model_name,
        object_id=object_id,
        changes=sanitize_changes(changes),
        ip_address=get_ip_address(request),
    )


def ensure_admin(request):
    if getattr(request.user, "role", None) != "admin":
        raise PermissionDenied("Admin access is required.")


def get_customer_for_user(user):
    return Customer.objects.select_related("user", "package").filter(user=user).first()


def get_technician_for_user(user):
    return Technician.objects.select_related("user").filter(user=user).first()


def get_ticket_queryset(request):
    role = getattr(request.user, "role", "")
    if role == "admin":
        return Complaint.objects.select_related("customer__user", "assigned_technician__user").prefetch_related("notes__added_by")
    if role == "customer":
        customer = get_customer_for_user(request.user)
        if not customer:
            return Complaint.objects.none()
        return Complaint.objects.select_related("customer__user", "assigned_technician__user").prefetch_related("notes__added_by").filter(customer=customer)
    if role == "technician":
        technician = get_technician_for_user(request.user)
        if not technician:
            return Complaint.objects.none()
        return Complaint.objects.select_related("customer__user", "assigned_technician__user").prefetch_related("notes__added_by").filter(assigned_technician=technician)
    return Complaint.objects.none()


def normalize_customer(customer):
    package = customer.package
    return {
        "id": str(customer.id),
        "fullName": customer.user.get_full_name() or customer.user.username,
        "fatherName": customer.father_name,
        "cnic": customer.cnic,
        "phone": customer.user.phone or "",
        "email": customer.user.email,
        "dob": customer.date_of_birth.isoformat() if customer.date_of_birth else "",
        "gender": customer.gender,
        "photo": customer.user.profile_photo.url if customer.user.profile_photo else None,
        "houseNo": "",
        "street": "",
        "area": customer.area,
        "city": customer.city,
        "zipCode": "",
        "coordinates": "",
        "packageId": package.name.lower() if package else "basic",
        "status": "Active" if customer.status == "active" else "Inactive",
        "bill": f"{package.monthly_price:.0f} PKR" if package else "0 PKR",
    }


def normalize_package(package):
    return {
        "id": str(package.id),
        "name": package.name,
        "speed": f"{package.speed_mbps} Mbps",
        "price": f"{package.monthly_price:.0f} PKR",
        "popular": bool(package.is_most_popular),
    }


def normalize_technician(technician):
    active_job = Job.objects.filter(technician=technician, status__in=["pending", "in_progress"]).order_by("-assigned_at").first()
    return {
        "id": str(technician.id),
        "name": technician.user.get_full_name() or technician.user.username,
        "phone": technician.user.phone or "",
        "area": technician.area,
        "status": "Available" if technician.status == "available" else "Busy",
        "rating": round(float(technician.customer_rating), 1),
        "jobsCompleted": technician.total_jobs_completed,
        "activeJob": f"{active_job.complaint.ticket_number} ({active_job.complaint.ai_category or 'General'})" if active_job else "None",
        "email": technician.user.email,
    }


def normalize_invoice(bill):
    payment = bill.payments.order_by("-paid_at").first()
    return {
        "id": str(bill.id),
        "invoiceNo": bill.invoice_number,
        "customerName": bill.customer.user.get_full_name() or bill.customer.user.username,
        "customerId": str(bill.customer_id),
        "period": bill.bill_month.strftime("%b %d, %Y"),
        "issued": bill.bill_month.strftime("%b %d, %Y"),
        "due": bill.due_date.strftime("%b %d, %Y"),
        "amount": f"{bill.total_amount:.0f} PKR",
        "status": bill.status.title(),
        "method": payment.payment_method if payment else "Admin Verified Checkout",
    }


def normalize_ticket(complaint):
    notes = [
        {
            "author": note.added_by.get_full_name() or note.added_by.username,
            "text": note.note,
            "date": note.created_at.strftime("%b %d, %Y"),
        }
        for note in complaint.notes.all()
    ]
    return {
        "id": str(complaint.id),
        "ticketNo": complaint.ticket_number,
        "customerName": complaint.customer.user.get_full_name() or complaint.customer.user.username,
        "customerId": str(complaint.customer_id),
        "description": complaint.description,
        "category": CATEGORY_TO_DISPLAY.get(complaint.ai_category, complaint.ai_category or "Speed Issue"),
        "priority": PRIORITY_TO_DISPLAY.get(complaint.ai_priority, "Medium"),
        "status": STATUS_TO_DISPLAY.get(complaint.status, complaint.status.title()),
        "assignedTechnician": complaint.assigned_technician.user.get_full_name() if complaint.assigned_technician else None,
        "createdAt": complaint.created_at.isoformat(),
        "notes": notes,
    }


def get_or_create_settings():
    settings = SystemSettings.objects.first()
    if settings is None:
        settings = SystemSettings.objects.create(**SystemSettings.get_defaults())
    return settings


@transaction.atomic
def ensure_seed_data():
    """Create essential initial data (admin user and default packages) if database is empty."""
    admin_user, _ = CustomUser.objects.get_or_create(
        username="admin@netflow.com",
        defaults={
            "email": "admin@netflow.com",
            "first_name": "Administrator",
            "last_name": "Manager",
            "role": "admin",
            "phone": "+92 300 000 0000",
        },
    )
    admin_user.set_password("admin123")
    admin_user.save(update_fields=["password"])
    if admin_user.role != "admin":
        admin_user.role = "admin"
        admin_user.save(update_fields=["role"])

    # Create default packages
    default_packages = [
        ("Basic", 10, 1200, 0, False),
        ("Standard", 25, 2200, 0, True),
        ("Premium", 50, 3800, 0, False),
    ]
    for name, speed, price, fee, popular in default_packages:
        Package.objects.get_or_create(
            name=name,
            defaults={
                "speed_mbps": speed,
                "monthly_price": price,
                "installation_fee": fee,
                "description": f"{name} ISP package",
                "is_active": True,
                "is_most_popular": popular,
            },
        )

    get_or_create_settings()


def build_dashboard_summary():
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total_customers = Customer.objects.count()
    active_customers = Customer.objects.filter(status="active").count()
    total_revenue = Bill.objects.filter(status="paid").aggregate(total=Sum("total_amount"))["total"] or 0
    open_complaints = Complaint.objects.exclude(status="resolved").count()
    new_customers = Customer.objects.filter(created_at__gte=month_start).count()
    paid_bills = Bill.objects.filter(status="paid").count()
    unpaid_bills = Bill.objects.filter(status__in=["unpaid", "overdue"]).count()
    active_packages = Package.objects.filter(is_active=True).count()
    complaint_categories = Complaint.objects.values("ai_category").annotate(count=Count("id")).order_by("-count")
    monthly_revenue = []
    for entry in (
        Bill.objects.filter(status="paid")
        .values("bill_month")
        .annotate(total=Sum("total_amount"))
        .order_by("bill_month")
    ):
        monthly_revenue.append(
            {
                "label": entry["bill_month"].strftime("%b %Y"),
                "value": float(entry["total"] or 0),
            }
        )

    return {
        "totalCustomers": total_customers,
        "newThisMonth": new_customers,
        "activeCustomers": active_customers,
        "totalRevenue": float(total_revenue),
        "openComplaints": open_complaints,
        "paidBills": paid_bills,
        "unpaidBills": unpaid_bills,
        "activePackages": active_packages,
        "monthlyRevenue": monthly_revenue,
        "complaintCategories": [
            {
                "category": CATEGORY_TO_DISPLAY.get(c["ai_category"], c["ai_category"] or "Unclassified"),
                "count": c["count"],
            }
            for c in complaint_categories
        ],
        "recentComplaints": [normalize_ticket(ticket) for ticket in Complaint.objects.select_related("customer__user").order_by("-created_at")[:5]],
        "technicianStatus": [normalize_technician(tech) for tech in Technician.objects.select_related("user").all()[:6]],
    }


def run_llm_prompt(prompt, json_mode=False, api_key=None):
    settings = get_or_create_settings()
    resolved_api_key = api_key or settings.api_key or os.environ.get("GROQ_API_KEY")
    if not resolved_api_key:
        return None

    model_name = settings.ai_model if settings.ai_model else "llama-3.1-8b-instant"
    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {resolved_api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "messages": [{"role": "user", "content": prompt}],
        "model": model_name,
        "temperature": 0.2
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}
        if "json" not in prompt.lower():
            payload["messages"][0]["content"] = prompt + "\n\nReturn output in JSON format."

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code >= 400:
            return {"status": response.status_code, "detail": f"Groq API returned status {response.status_code}: {response.text}"}
        
        response_data = response.json()
        text = response_data["choices"][0]["message"]["content"]
        
        if json_mode:
            cleaned_text = text.strip()
            if cleaned_text.startswith("```"):
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]
                else:
                    cleaned_text = cleaned_text[3:]
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()
            return json.loads(cleaned_text)
        return {"text": text.strip()}
    except Exception as e:
        return {"status": 502, "detail": f"Groq request failed: {str(e)}"}


def analyze_complaint_text(complaint_text, api_key=None):
    prompt = (
        "You are an expert AI assistant for an ISP support team. Your job is to strictly analyze customer complaints. "
        "Return ONLY a valid JSON object with the following schema:\n"
        "{\n"
        "  \"category\": \"string (Speed Issue, Router, Outage, Billing, Installation)\",\n"
        "  \"confidence\": \"string (e.g., 95%)\",\n"
        "  \"priority\": \"string (Low, Medium, Urgent)\",\n"
        "  \"color\": \"string (Hex color based on priority: #ef4444 for Urgent, #f59e0b for Medium, #22c55e for Low)\",\n"
        "  \"action\": \"string (Concise suggested next step)\",\n"
        "  \"resolutionTime\": \"string (e.g., 2-4 hours | Assign field technician)\"\n"
        "}\n\n"
        f"Complaint: {complaint_text}"
    )
    
    result = run_llm_prompt(prompt, json_mode=True, api_key=api_key)
    
    if result is None:
        return None
        
    if isinstance(result, dict) and "status" in result:
        return result
        
    return {
        "category": result.get("category") or "Router",
        "confidence": result.get("confidence") or "85%",
        "priority": result.get("priority") or "Medium",
        "color": result.get("color") or "#f59e0b",
        "action": result.get("action") or "Manual review required.",
        "resolutionTime": result.get("resolutionTime") or "2-4 hours | Assign field technician",
    }


def draft_ai_reply(ticket, api_key=None):
    notes = "\n".join([f"- {note.added_by.username}: {note.note}" for note in ticket.notes.all()])
    prompt = (
        "You are a polite, professional, and empathetic customer support agent for NetFlow ISP. "
        "Write a response to the customer regarding their complaint. Keep it brief (2-4 sentences).\n\n"
        f"Customer Complaint: {ticket.description}\n"
        f"Category: {ticket.ai_category}\n"
        f"Status: {ticket.status}\n"
        f"Internal Notes/History:\n{notes}\n\n"
        "Draft the reply below:"
    )
    
    result = run_llm_prompt(prompt, json_mode=False, api_key=api_key)
    
    if result is None:
        return None
        
    if isinstance(result, dict) and "status" in result:
        return result
        
    return {"reply": result.get("text", "")}
