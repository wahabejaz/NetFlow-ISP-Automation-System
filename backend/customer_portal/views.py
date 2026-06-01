from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from backend.ai_engine.chatbot import NetFlowChatbot
from backend.complaints.models import Complaint

@login_required
def dashboard(request):
    try:
        customer = request.user.customer_profile
        bills = customer.bills.all()
        complaints = customer.complaints.all()
        context = {
            'active_menu': 'home',
            'customer': customer,
            'bills': bills,
            'complaints': complaints
        }
        return render(request, 'customer_portal/dashboard.html', context)
    except:
        return render(request, 'customer_portal/dashboard.html', {'active_menu': 'home'})

@login_required
def chatbot_view(request):
    if request.method == 'POST':
        message = request.POST.get('message', '')
        bot = NetFlowChatbot()
        response = bot.get_response(message)
        return JsonResponse({'response': response})
    return render(request, 'customer_portal/chatbot.html', {'active_menu': 'chatbot'})

@login_required
def submit_complaint(request):
    try:
        customer = request.user.customer_profile
    except:
        messages.error(request, "Customer profile not found.")
        return redirect('portal:dashboard')

    if request.method == 'POST':
        description = request.POST.get('description')
        issue_since = request.POST.get('issue_since')
        affects_all_devices = request.POST.get('affects_all_devices') == 'on'
        only_wifi = request.POST.get('only_wifi') == 'on'
        specific_hours = request.POST.get('specific_hours') == 'on'
        attachment = request.FILES.get('attachment')

        # Generate ticket number
        last_complaint = Complaint.objects.order_by('-id').first()
        next_id = last_complaint.id + 1 if last_complaint else 1
        ticket_number = f"CMP-{next_id:04d}"

        complaint = Complaint.objects.create(
            ticket_number=ticket_number,
            customer=customer,
            description=description,
            issue_since=issue_since,
            affects_all_devices=affects_all_devices,
            only_wifi=only_wifi,
            specific_hours=specific_hours,
            attachment=attachment,
            ai_category='speed_issue',
            ai_priority='medium',
            ai_suggested_action='Restart your router and ONT device',
            ai_confidence=85.0
        )
        messages.success(request, f"Complaint {ticket_number} submitted successfully.")
        return redirect('portal:dashboard')

    return render(request, 'customer_portal/submit_complaint.html', {'active_menu': 'submit_complaint'})
