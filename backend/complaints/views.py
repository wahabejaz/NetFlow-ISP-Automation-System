from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Complaint, ComplaintNote
from backend.technicians.models import Technician

@login_required
def complaint_list(request):
    complaints = Complaint.objects.select_related('customer__user', 'assigned_technician__user').prefetch_related('notes__added_by').all()
    technicians = Technician.objects.select_related('user').all()
    
    if request.method == 'POST':
        ticket_id = request.POST.get('ticket_id')
        complaint = get_object_or_404(Complaint, id=ticket_id)
        
        if 'assign_technician' in request.POST:
            tech_id = request.POST.get('technician_id')
            if tech_id:
                complaint.assigned_technician_id = tech_id
                if complaint.status in ['submitted', 'ai_analyzed']:
                    complaint.status = 'assigned'
                complaint.save()
                messages.success(request, f'Technician assigned to {complaint.ticket_number}.')
        
        elif 'add_note' in request.POST:
            note_text = request.POST.get('note')
            if note_text:
                ComplaintNote.objects.create(
                    complaint=complaint,
                    added_by=request.user,
                    note=note_text
                )
                messages.success(request, f'Note added to {complaint.ticket_number}.')
                
        return redirect('complaints:list')
        
    # Default to first complaint for the detail view mockup
    selected_complaint = complaints.first() if complaints.exists() else None
    
    context = {
        'active_menu': 'complaints', 
        'complaints': complaints,
        'selected_complaint': selected_complaint,
        'technicians': technicians
    }
    return render(request, 'complaints/list.html', context)
