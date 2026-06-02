from django.db import models


class SystemSettings(models.Model):
    isp_name = models.CharField(max_length=120, default="NetFlow Broadband Ltd.")
    support_phone = models.CharField(max_length=40, default="+92 42 111-638-356")
    support_email = models.EmailField(default="support@netflow.com.pk")
    currency = models.CharField(max_length=20, default="PKR")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=16.00)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=200.00)
    billing_day = models.IntegerField(default=5)
    ai_model = models.CharField(max_length=80, default="llama-3.1-8b-instant")
    api_key = models.CharField(max_length=255, blank=True, default="")
    auto_prioritize = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "system_settings"

    @classmethod
    def get_defaults(cls):
        return {
            "isp_name": "NetFlow Broadband Ltd.",
            "support_phone": "+92 42 111-638-356",
            "support_email": "support@netflow.com.pk",
            "currency": "PKR",
            "tax_rate": "16",
            "late_fee": "200",
            "billing_day": "5",
            "ai_model": "llama-3.1-8b-instant",
            "api_key": "",
            "auto_prioritize": True,
        }

    def serialize(self):
        return {
            "ispName": self.isp_name,
            "supportPhone": self.support_phone,
            "supportEmail": self.support_email,
            "currency": self.currency,
            "taxRate": str(self.tax_rate),
            "lateFee": str(self.late_fee),
            "billingDay": str(self.billing_day),
            "aiModel": self.ai_model,
            "apiKey": self.api_key,
            "autoPrioritize": self.auto_prioritize,
        }
