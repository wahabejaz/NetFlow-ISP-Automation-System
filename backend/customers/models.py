from django.db import models

class Customer(models.Model):
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, related_name='customer_profile')
    father_name = models.CharField(max_length=100)
    cnic = models.CharField(max_length=15, unique=True)  # XXXXX-XXXXXXX-X
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male','Male'),('female','Female')])
    area = models.CharField(max_length=200)
    address = models.TextField()
    city = models.CharField(max_length=100)
    package = models.ForeignKey('packages.Package', on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    installation_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customers'

class CustomerDraft(models.Model):
    """Holds multi-step form session data"""
    session_key = models.CharField(max_length=100)
    step = models.IntegerField(default=1)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customer_drafts'
