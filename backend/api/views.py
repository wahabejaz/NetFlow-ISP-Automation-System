from datetime import date, timedelta

from django.contrib.auth import authenticate
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from backend.accounts.models import CustomUser
from backend.audit.models import AuditLog
from backend.billing.models import Bill, Payment
from backend.billing.services import send_invoice_email
from backend.complaints.models import Complaint, ComplaintNote
from backend.customers.models import Customer
from backend.packages.models import Package
from backend.technicians.models import Technician

from .permissions import IsAdminUser
from .services import (
    DISPLAY_TO_STATUS,
    analyze_complaint_text,
    draft_ai_reply,
    run_llm_prompt,
    build_dashboard_summary,
    ensure_admin,
    ensure_seed_data,
    get_customer_for_user,
    get_or_create_settings,
    get_technician_for_user,
    get_ticket_queryset,
    log_action,
    normalize_customer,
    normalize_invoice,
    normalize_package,
    normalize_technician,
    normalize_ticket,
)


def resolve_package_reference(package_ref):
    if package_ref is None:
        return None

    raw_value = str(package_ref).strip()
    if not raw_value:
        return None

    try:
        package_id = int(raw_value)
    except (TypeError, ValueError):
        package_id = None

    if package_id is not None:
        package = Package.objects.filter(id=package_id, is_active=True).first()
        if package is not None:
            return package

    return Package.objects.filter(name__iexact=raw_value, is_active=True).first()


def get_request_payload(request):
    if hasattr(request.data, "dict"):
        return request.data.dict()
    return dict(request.data or {})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email") or request.data.get("username")
    password = request.data.get("password")
    selected_role = (request.data.get("role") or "").lower()

    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    # Determine unique username based on role backward-compatibly
    auth_username = email
    if selected_role == "technician":
        if CustomUser.objects.filter(username=f"{email}_tech").exists():
            auth_username = f"{email}_tech"

    user = authenticate(username=auth_username, password=password)
    if user is None and not CustomUser.objects.exists():
        ensure_seed_data()
        user = authenticate(username=auth_username, password=password)

    if user is None:
        return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

    if selected_role and user.role != selected_role:
        return Response({"detail": "Role mismatch for the selected account."}, status=status.HTTP_403_FORBIDDEN)

    token, _ = Token.objects.get_or_create(user=user)
    log_action(request, "LOGIN", "CustomUser", user.id, {"role": user.role})
    return Response(
        {
            "token": token.key,
            "role": user.role,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.get_full_name() or user.username,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(
        {
            "id": request.user.id,
            "email": request.user.email,
            "name": request.user.get_full_name() or request.user.username,
            "role": request.user.role,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def areas_view(request):
    customer_areas = Customer.objects.exclude(area__isnull=True).exclude(area="").values_list("area", flat=True).distinct()
    technician_areas = Technician.objects.exclude(area__isnull=True).exclude(area="").values_list("area", flat=True).distinct()
    customer_cities = Customer.objects.exclude(city__isnull=True).exclude(city="").values_list("city", flat=True).distinct()
    areas = sorted({value.strip() for value in list(customer_areas) + list(technician_areas) if value and value.strip()})
    cities = sorted({value.strip() for value in list(customer_cities) if value and value.strip()})
    return Response({"areas": areas, "cities": cities})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def bootstrap_view(request):
    ensure_seed_data()
    return Response({"status": "ok"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def customer_list_view(request):
    if request.method == "GET":
        if request.user.role == "admin":
            customers = Customer.objects.select_related("user", "package").all()
            return Response([normalize_customer(customer) for customer in customers])

        customer = get_customer_for_user(request.user)
        if not customer:
            return Response([], status=status.HTTP_200_OK)
        return Response([normalize_customer(customer)])

    ensure_admin(request)
    payload = get_request_payload(request)
    email = payload.get("email")
    cnic = payload.get("cnic")

    if not email:
        return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    if CustomUser.objects.filter(email=email, role="customer").exists():
        return Response({"detail": "A customer with that email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    if cnic and Customer.objects.filter(cnic=cnic).exists():
        return Response({"detail": "A customer with that CNIC already exists."}, status=status.HTTP_400_BAD_REQUEST)

    package = resolve_package_reference(payload.get("packageId"))
    if package is None:
        return Response({"detail": "Package not found."}, status=status.HTTP_400_BAD_REQUEST)

    # Determine unique username
    username = email
    if CustomUser.objects.filter(username=username).exists():
        username = f"{email}_customer"

    user = CustomUser.objects.create_user(
        username=username,
        email=email,
        password=payload.get("password") or "password123",
        first_name=payload.get("fullName", "").split()[0] if payload.get("fullName") else "Customer",
        last_name=" ".join(payload.get("fullName", "").split()[1:]) if payload.get("fullName") else "User",
        role="customer",
        phone=payload.get("phone") or "",
    )

    photo = request.FILES.get("photo")
    if photo:
        user.profile_photo = photo

    dob_value = payload.get("dob")
    parsed_dob = None
    if isinstance(dob_value, str) and dob_value:
        try:
            parsed_dob = date.fromisoformat(dob_value)
        except ValueError:
            parsed_dob = None

    customer = Customer.objects.create(
        user=user,
        father_name=payload.get("fatherName") or "",
        cnic=payload.get("cnic") or "",
        date_of_birth=parsed_dob,
        gender=payload.get("gender") or "male",
        area=payload.get("area") or "",
        address=payload.get("street") or payload.get("area") or "",
        city=payload.get("city") or "",
        package=package,
        status="active" if payload.get("status") != "Inactive" else "inactive",
        installation_date=timezone.now().date(),
        notes=payload.get("notes") or "",
    )
    if photo:
        user.save()
    log_action(request, "CREATE", "Customer", customer.id, payload)
    return Response(normalize_customer(customer), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def customer_detail_view(request, pk):
    customer = Customer.objects.select_related("user", "package").filter(pk=pk).first()
    if customer is None:
        return Response({"detail": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role != "admin" and customer.user_id != request.user.id:
        raise PermissionDenied("You cannot access that customer record.")

    if request.method == "GET":
        return Response(normalize_customer(customer))

    ensure_admin(request)

    if request.method == "DELETE":
        log_action(request, "DELETE", "Customer", customer.id, {"customer_id": pk})
        customer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    payload = get_request_payload(request)
    photo = request.FILES.get("photo")

    if payload.get("email") and payload["email"] != customer.user.email and CustomUser.objects.filter(email=payload["email"], role="customer").exclude(pk=customer.user_id).exists():
        return Response({"detail": "A customer with that email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    if payload.get("cnic") and payload["cnic"] != customer.cnic and Customer.objects.filter(cnic=payload["cnic"]).exclude(pk=customer.id).exists():
        return Response({"detail": "A customer with that CNIC already exists."}, status=status.HTTP_400_BAD_REQUEST)

    if payload.get("fullName"):
        parts = payload["fullName"].split()
        customer.user.first_name = parts[0]
        customer.user.last_name = " ".join(parts[1:])
    if payload.get("email"):
        customer.user.email = payload["email"]
        new_username = payload["email"]
        if CustomUser.objects.filter(username=new_username).exclude(pk=customer.user_id).exists():
            new_username = f"{payload['email']}_customer"
        customer.user.username = new_username
    if payload.get("phone"):
        customer.user.phone = payload["phone"]
    if payload.get("password"):
        customer.user.set_password(payload["password"])
    if payload.get("fatherName"):
        customer.father_name = payload["fatherName"]
    if payload.get("cnic"):
        customer.cnic = payload["cnic"]
    if payload.get("area"):
        customer.area = payload["area"]
    if payload.get("city"):
        customer.city = payload["city"]
    if payload.get("status"):
        customer.status = "active" if payload["status"] == "Active" else "inactive"
    if payload.get("packageId"):
        package = resolve_package_reference(payload["packageId"])
        if package is None:
            return Response({"detail": "Package not found."}, status=status.HTTP_400_BAD_REQUEST)
        customer.package = package
    if photo:
        customer.user.profile_photo = photo
    customer.user.save()
    customer.save()
    log_action(request, "UPDATE", "Customer", customer.id, payload)
    return Response(normalize_customer(customer))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def package_list_view(request):
    if request.method == "GET":
        packages = Package.objects.filter(is_active=True)
        return Response([normalize_package(package) for package in packages])

    ensure_admin(request)
    payload = request.data
    package = Package.objects.create(
        name=payload.get("name"),
        speed_mbps=int(payload.get("speed", "10").replace(" Mbps", "")),
        monthly_price=float(str(payload.get("price", "1200")).replace(" PKR", "").replace(",", "")),
        installation_fee=0,
        description=payload.get("description") or "",
        is_active=True,
        is_most_popular=bool(payload.get("popular")),
    )
    log_action(request, "CREATE", "Package", package.id, payload)
    return Response(normalize_package(package), status=status.HTTP_201_CREATED)


@api_view(["DELETE", "PATCH"])
@permission_classes([IsAuthenticated, IsAdminUser])
def package_detail_view(request, pk):
    package = Package.objects.filter(pk=pk).first()
    if package is None:
        return Response({"detail": "Package not found."}, status=status.HTTP_404_NOT_FOUND)
    if request.method == "DELETE":
        package.is_active = False
        package.save(update_fields=["is_active"])
        log_action(request, "DEACTIVATE", "Package", package.id, {"package_id": pk})
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH - update package fields
    ensure_admin(request)
    payload = request.data or {}
    changed = {}
    if payload.get("name") and payload.get("name") != package.name:
        changed["name"] = {"old": package.name, "new": payload.get("name")}
        package.name = payload.get("name")
    if payload.get("speed"):
        # accept either '100 Mbps' or numeric
        raw_speed = str(payload.get("speed")).replace(" Mbps", "").strip()
        try:
            speed_val = int(raw_speed)
            if speed_val != package.speed_mbps:
                changed["speed_mbps"] = {"old": package.speed_mbps, "new": speed_val}
                package.speed_mbps = speed_val
        except (TypeError, ValueError):
            pass
    if payload.get("price"):
        raw_price = str(payload.get("price")).replace(" PKR", "").replace(",", "").strip()
        try:
            price_val = float(raw_price)
            if price_val != package.monthly_price:
                changed["monthly_price"] = {"old": package.monthly_price, "new": price_val}
                package.monthly_price = price_val
        except (TypeError, ValueError):
            pass
    if "popular" in payload:
        popular_flag = bool(payload.get("popular"))
        if popular_flag != bool(package.is_most_popular):
            changed["is_most_popular"] = {"old": bool(package.is_most_popular), "new": popular_flag}
            package.is_most_popular = popular_flag

    if changed:
        package.save()
        log_action(request, "UPDATE", "Package", package.id, changed)

    return Response(normalize_package(package))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def invoice_list_view(request):
    if request.method == "GET":
        if request.user.role == "customer":
            customer = get_customer_for_user(request.user)
            if not customer:
                return Response([])
            bills = Bill.objects.filter(customer=customer).select_related("customer", "package")
        else:
            bills = Bill.objects.select_related("customer", "package")
        return Response([normalize_invoice(bill) for bill in bills])

    ensure_admin(request)
    payload = request.data
    customer = Customer.objects.filter(id=payload.get("customerId")).first()
    if customer is None:
        return Response({"detail": "Customer not found."}, status=status.HTTP_400_BAD_REQUEST)
    package = customer.package
    bill = Bill.objects.create(
        invoice_number=payload.get("invoiceNo"),
        customer=customer,
        package=package,
        bill_month=timezone.now().date().replace(day=1),
        amount=float(str(payload.get("amount", "0")).replace(" PKR", "").replace(",", "")),
        tax_amount=0,
        total_amount=float(str(payload.get("amount", "0")).replace(" PKR", "").replace(",", "")),
        due_date=timezone.now().date() + timedelta(days=10),
        status=payload.get("status", "unpaid").lower(),
    )
    log_action(request, "CREATE", "Bill", bill.id, payload)
    # send invoice email notification (best-effort)
    try:
        send_invoice_email(bill)
    except Exception:
        pass
    return Response(normalize_invoice(bill), status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminUser])
def invoice_detail_view(request, pk):
    bill = Bill.objects.filter(pk=pk).select_related("customer", "package").first()
    if bill is None:
        return Response({"detail": "Invoice not found."}, status=status.HTTP_404_NOT_FOUND)
    payload = request.data
    if payload.get("status"):
        bill.status = payload["status"].lower()
    if payload.get("method"):
        Payment.objects.create(
            bill=bill,
            amount=bill.total_amount,
            payment_method=payload["method"],
            reference_number="manual",
        )

    if payload.get("sendEmail"):
        try:
            send_invoice_email(bill)
        except Exception:
            pass

    bill.save()
    log_action(request, "UPDATE", "Bill", bill.id, payload)
    return Response(normalize_invoice(bill))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def ticket_list_view(request):
    if request.method == "GET":
        tickets = get_ticket_queryset(request)
        return Response([normalize_ticket(ticket) for ticket in tickets])

    if request.user.role != "customer":
        return Response({"detail": "Only customers can submit complaints."}, status=status.HTTP_403_FORBIDDEN)

    customer = get_customer_for_user(request.user)
    if customer is None:
        return Response({"detail": "Customer profile not found."}, status=status.HTTP_404_NOT_FOUND)

    payload = request.data
    next_id = (Complaint.objects.order_by("-id").first().id if Complaint.objects.exists() else 0) + 1
    category = payload.get("category") or "Speed Issue"
    priority = payload.get("priority") or "Medium"
    cat_lower = (category or "").lower()
    if "speed" in cat_lower:
        ai_category = "speed_issue"
    elif "router" in cat_lower:
        ai_category = "router"
    elif "outage" in cat_lower:
        ai_category = "outage"
    elif "billing" in cat_lower or "payment" in cat_lower or "dispute" in cat_lower:
        ai_category = "billing"
    elif "install" in cat_lower:
        ai_category = "installation"
    else:
        ai_category = "speed_issue"

    pri_lower = (priority or "").lower()
    if "urgent" in pri_lower or "high" in pri_lower:
        ai_priority = "urgent"
    elif "medium" in pri_lower:
        ai_priority = "medium"
    elif "low" in pri_lower:
        ai_priority = "low"
    else:
        ai_priority = "medium"

    complaint = Complaint.objects.create(
        ticket_number=f"CMP-{next_id:04d}",
        customer=customer,
        description=payload.get("description", ""),
        issue_since=payload.get("issueSince") or "Today",
        affects_all_devices=bool(payload.get("affectsAllDevices")),
        only_wifi=bool(payload.get("onlyWifi")),
        specific_hours=bool(payload.get("specificHours")),
        ai_category=ai_category,
        ai_priority=ai_priority,
        ai_suggested_action=payload.get("suggestedAction") or "Review submitted complaint.",
        ai_confidence=payload.get("aiConfidence") or 0.5,
        ai_estimated_resolution=payload.get("estimatedResolution") or "Pending review",
        ai_analyzed_at=timezone.now(),
        status="submitted",
    )

    if payload.get("notes"):
        notes = payload["notes"]
        if isinstance(notes, list):
            for note in notes:
                ComplaintNote.objects.create(
                    complaint=complaint,
                    added_by=request.user,
                    note=note.get("text") if isinstance(note, dict) else str(note),
                )

    log_action(request, "CREATE", "Complaint", complaint.id, payload)
    return Response(normalize_ticket(complaint), status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def ticket_detail_view(request, pk):
    complaint = Complaint.objects.filter(pk=pk).select_related("assigned_technician", "customer").first()
    if complaint is None:
        return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role == "customer" and complaint.customer.user_id != request.user.id:
        raise PermissionDenied("You cannot modify that ticket.")

    payload = request.data
    if payload.get("status"):
        complaint.status = DISPLAY_TO_STATUS.get(payload["status"], payload["status"].lower())
    if payload.get("assignedTechnician"):
        tech_user = CustomUser.objects.filter(email=payload["assignedTechnician"]).first()
        if tech_user:
            technician = Technician.objects.filter(user=tech_user).first()
            if technician:
                complaint.assigned_technician = technician
    if payload.get("notes"):
        text = payload["notes"]
        if isinstance(text, list):
            for note in text:
                ComplaintNote.objects.create(complaint=complaint, added_by=request.user, note=note.get("text", ""))
        elif isinstance(text, str):
            ComplaintNote.objects.create(complaint=complaint, added_by=request.user, note=text)
    complaint.save()
    log_action(request, "UPDATE", "Complaint", complaint.id, payload)
    return Response(normalize_ticket(complaint))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def technician_list_view(request):
    if request.method == "GET":
        if request.user.role == "admin":
            technicians = Technician.objects.select_related("user")
            return Response([normalize_technician(tech) for tech in technicians])
        tech = get_technician_for_user(request.user)
        if not tech:
            return Response([])
        return Response([normalize_technician(tech)])

    ensure_admin(request)
    payload = request.data
    email = payload.get("email")
    if not email:
        return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    if CustomUser.objects.filter(email=email, role="technician").exists():
        return Response({"detail": "A technician with that email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    user = CustomUser.objects.create_user(
        username=f"{email}_tech",
        email=email,
        password=payload.get("password") or "password123",
        first_name=payload.get("name", "").split()[0] if payload.get("name") else "Tech",
        last_name=" ".join(payload.get("name", "").split()[1:]) if payload.get("name") else "User",
        role="technician",
        phone=payload.get("phone") or "",
    )
    technician = Technician.objects.create(
        user=user,
        area=payload.get("area") or "",
        status="available",
    )
    log_action(request, "CREATE", "Technician", technician.id, payload)
    return Response(normalize_technician(technician), status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated, IsAdminUser])
def technician_detail_view(request, pk):
    technician = Technician.objects.select_related("user").filter(pk=pk).first()
    if technician is None:
        return Response({"detail": "Technician not found."}, status=status.HTTP_404_NOT_FOUND)

    payload = get_request_payload(request)
    if request.method == "PATCH":
        if payload.get("email") and payload["email"] != technician.user.email and CustomUser.objects.filter(email=payload["email"], role="technician").exclude(pk=technician.user_id).exists():
            return Response({"detail": "A technician with that email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if payload.get("name"):
            parts = payload["name"].split()
            technician.user.first_name = parts[0]
            technician.user.last_name = " ".join(parts[1:])
        if payload.get("email"):
            technician.user.email = payload["email"]
            technician.user.username = f"{payload['email']}_tech"
        if payload.get("phone"):
            technician.user.phone = payload["phone"]
        if payload.get("password"):
            technician.user.set_password(payload["password"])
        if payload.get("area"):
            technician.area = payload["area"]
        if payload.get("status"):
            # Normalize display status value
            val = payload["status"].lower()
            if val == "available":
                technician.status = "available"
            elif val == "busy":
                technician.status = "busy"
            else:
                technician.status = "offline"
        technician.user.save()
        technician.save()
        log_action(request, "UPDATE", "Technician", technician.id, payload)
        return Response(normalize_technician(technician))

    log_action(request, "DELETE", "Technician", technician.id, {"technician_id": pk})
    technician.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated, IsAdminUser])
def settings_view(request):
    settings = get_or_create_settings()
    if request.method == "GET":
        return Response(settings.serialize())

    payload = request.data
    settings.isp_name = payload.get("ispName", settings.isp_name)
    settings.support_phone = payload.get("supportPhone", settings.support_phone)
    settings.support_email = payload.get("supportEmail", settings.support_email)
    settings.currency = payload.get("currency", settings.currency)
    settings.tax_rate = payload.get("taxRate", settings.tax_rate)
    settings.late_fee = payload.get("lateFee", settings.late_fee)
    settings.billing_day = int(payload.get("billingDay", settings.billing_day))
    settings.ai_model = payload.get("aiModel", settings.ai_model)
    
    new_api_key = payload.get("apiKey")
    if new_api_key and new_api_key != "••••••••••••••••••••••••••••••••":
        settings.api_key = new_api_key
        
    settings.auto_prioritize = payload.get("autoPrioritize", settings.auto_prioritize)
    settings.save()
    log_action(request, "UPDATE", "SystemSettings", settings.id, payload)
    return Response(settings.serialize())


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_summary_view(request):
    payload = build_dashboard_summary()
    return Response(payload)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_analyze_view(request):
    complaint_text = request.data.get("complaintText") or request.data.get("text") or ""
    if not complaint_text:
        return Response({"detail": "Complaint text is required."}, status=status.HTTP_400_BAD_REQUEST)

    result = analyze_complaint_text(complaint_text)
    if result is None:
        return Response(
            {"detail": "Groq API key is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if isinstance(result, dict) and result.get("status"):
        status_code = result["status"]
        detail = result.get("detail", "Groq request failed.")
        return Response({"detail": detail}, status=status_code)

    log_action(request, "AI_ANALYZE", "Complaint", None, {"category": result["category"]})
    return Response(result)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminUser])
def audit_logs_view(request):
    logs = AuditLog.objects.select_related("user").order_by("-timestamp")[:50]
    return Response(
        [
            {
                "id": log.id,
                "user": log.user.email if log.user else None,
                "action": log.action,
                "model": log.model_name,
                "objectId": log.object_id,
                "changes": log.changes,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in logs
        ]
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def ai_draft_reply_view(request):
    ticket_id = request.data.get("ticketId")
    if not ticket_id:
        return Response({"detail": "ticketId is required."}, status=status.HTTP_400_BAD_REQUEST)

    ticket = Complaint.objects.filter(id=ticket_id).first()
    if not ticket:
        return Response({"detail": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

    result = draft_ai_reply(ticket)
    if result is None:
        return Response({"detail": "Groq API key is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    if isinstance(result, dict) and result.get("status"):
        return Response({"detail": result.get("detail", "Groq request failed.")}, status=result.get("status"))

    return Response({"reply": result.get("reply", "")})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_chat_view(request):
    prompt = request.data.get("prompt")
    if not prompt:
        return Response({"detail": "Prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

    result = run_llm_prompt(prompt, json_mode=True)
    if result is None:
        return Response(
            {"detail": "Groq API key is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if isinstance(result, dict) and result.get("status"):
        return Response({"detail": result.get("detail", "Groq request failed.")}, status=result.get("status"))

    return Response(result)
