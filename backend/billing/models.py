from django.db import models

class Bill(models.Model):
    STATUS_CHOICES = [('paid','Paid'),('unpaid','Unpaid'),('overdue','Overdue')]

    invoice_number = models.CharField(max_length=30, unique=True)  # INV-2024-001
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='bills')
    package = models.ForeignKey('packages.Package', on_delete=models.SET_NULL, null=True)
    bill_month = models.DateField()                        # First day of month
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unpaid')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bills'
        ordering = ['-created_at']

class Payment(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    reference_number = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
