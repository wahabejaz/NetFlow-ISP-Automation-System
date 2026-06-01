from django.db import models

class AuditLog(models.Model):
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)              # CREATE, UPDATE, DELETE, LOGIN
    model_name = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
