from django.db import models

class Technician(models.Model):
    STATUS_CHOICES = [('available','Available'),('busy','Busy'),('offline','Offline')]

    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, related_name='technician_profile')
    area = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    current_jobs_count = models.IntegerField(default=0)
    avg_resolution_minutes = models.IntegerField(default=0)
    total_jobs_completed = models.IntegerField(default=0)
    customer_rating = models.FloatField(default=0.0)

    class Meta:
        db_table = 'technicians'

class Job(models.Model):
    STATUS_CHOICES = [
        ('pending','Pending'),
        ('in_progress','In Progress'),
        ('completed','Completed'),
    ]

    job_number = models.CharField(max_length=20, unique=True)      # JOB-089
    complaint = models.ForeignKey('complaints.Complaint', on_delete=models.CASCADE, related_name='jobs')
    technician = models.ForeignKey(Technician, on_delete=models.CASCADE, related_name='jobs')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'jobs'
        ordering = ['-assigned_at']
