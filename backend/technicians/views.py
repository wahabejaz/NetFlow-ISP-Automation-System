from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .models import Technician, Job

@login_required
def technician_dashboard(request):
    try:
        tech_profile = request.user.technician_profile
    except Exception:
        # If admin views it, show all technicians
        technicians = Technician.objects.select_related('user').all()
        return render(request, 'technicians/admin_list.html', {'technicians': technicians, 'active_menu': 'technicians'})

    if request.method == 'POST':
        action = request.POST.get('action')
        
        if action == 'toggle_status':
            new_status = request.POST.get('status')
            if new_status in ['available', 'busy']:
                tech_profile.status = new_status
                tech_profile.save()
        
        elif action == 'start_job':
            job_id = request.POST.get('job_id')
            job = get_object_or_404(Job, id=job_id, technician=tech_profile)
            if job.status == 'pending':
                job.status = 'in_progress'
                job.started_at = timezone.now()
                job.save()
                
        elif action == 'mark_complete':
            job_id = request.POST.get('job_id')
            note = request.POST.get('resolution_note', '')
            job = get_object_or_404(Job, id=job_id, technician=tech_profile)
            if job.status == 'in_progress':
                job.status = 'completed'
                job.completed_at = timezone.now()
                job.resolution_note = note
                if job.started_at:
                    delta = job.completed_at - job.started_at
                    job.duration_minutes = int(delta.total_seconds() / 60)
                job.save()
                
                # Update tech stats
                tech_profile.total_jobs_completed += 1
                tech_profile.save()
                
        return redirect('technicians:dashboard')

    jobs = Job.objects.filter(technician=tech_profile).select_related('complaint__customer__user')
    jobs_today = jobs.count() # Mocked for simplicity
    completed_today = jobs.filter(status='completed').count()
    pending_today = jobs.filter(status__in=['pending', 'in_progress']).count()
    
    context = {
        'active_menu': 'technicians', 
        'jobs': jobs, 
        'profile': tech_profile,
        'summary': {
            'today': jobs_today,
            'completed': completed_today,
            'pending': pending_today
        }
    }
    return render(request, 'technicians/list.html', context)
