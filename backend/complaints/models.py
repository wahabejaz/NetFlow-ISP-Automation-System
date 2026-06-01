from django.db import models

class Complaint(models.Model):
    PRIORITY_CHOICES = [('urgent','Urgent'),('medium','Medium'),('low','Low')]
    CATEGORY_CHOICES = [
        ('speed_issue','Speed Issue'),
        ('router','Router'),
        ('outage','Outage'),
        ('billing','Billing'),
        ('installation','Installation'),
    ]
    STATUS_CHOICES = [
        ('submitted','Submitted'),
        ('ai_analyzed','AI Analyzed'),
        ('assigned','Assigned'),
        ('in_progress','In Progress'),
        ('resolved','Resolved'),
    ]

    ticket_number = models.CharField(max_length=20, unique=True)   # CMP-0234
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='complaints')
    description = models.TextField()
    issue_since = models.CharField(max_length=50, blank=True)      # Today/Yesterday/etc.
    affects_all_devices = models.BooleanField(default=False)
    only_wifi = models.BooleanField(default=False)
    specific_hours = models.BooleanField(default=False)
    attachment = models.ImageField(upload_to='complaint_attachments/', blank=True, null=True)

    # AI-populated fields
    ai_category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True)
    ai_priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, blank=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    ai_suggested_action = models.TextField(blank=True)
    ai_estimated_resolution = models.CharField(max_length=100, blank=True)
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)

    # Workflow fields
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='submitted')
    assigned_technician = models.ForeignKey(
        'technicians.Technician', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_complaints'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaints'
        ordering = ['-created_at']

class ComplaintNote(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='notes')
    added_by = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'complaint_notes'
