from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Customer, CustomerDraft

@login_required
def customer_list(request):
    customers = Customer.objects.select_related('user', 'package').all()
    context = {'active_menu': 'customers', 'customers': customers}
    return render(request, 'customers/list.html', context)

@login_required
def customer_onboard(request):
    session_key = request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key

    draft, created = CustomerDraft.objects.get_or_create(session_key=session_key)

    if request.method == 'POST':
        # Update draft data
        for key, value in request.POST.items():
            if key not in ['csrfmiddlewaretoken', 'next', 'prev', 'save_draft']:
                draft.data[key] = value

        if 'next' in request.POST:
            draft.step = min(4, draft.step + 1)
        elif 'prev' in request.POST:
            draft.step = max(1, draft.step - 1)
        elif 'save_draft' in request.POST:
            messages.success(request, "Draft saved successfully.")
            
        draft.save()
        return redirect('customers:onboard')

    context = {'active_menu': 'customers', 'draft': draft}
    return render(request, 'customers/onboard.html', context)
