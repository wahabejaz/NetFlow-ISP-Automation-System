from django.db import models

class Notification(models.Model):
    TYPE_CHOICES = [
        ('complaint_created','Complaint Created'),
        ('complaint_assigned','Complaint Assigned'),
        ('complaint_resolved','Complaint Resolved'),
        ('bill_generated','Bill Generated'),
        ('bill_overdue','Bill Overdue'),
        ('payment_received','Payment Received'),
    ]

    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
