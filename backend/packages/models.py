from django.db import models

class Package(models.Model):
    name = models.CharField(max_length=100)               # Basic, Standard, Premium
    speed_mbps = models.IntegerField()                     # 10, 25, 50
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    installation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_most_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'packages'

class PackageFeature(models.Model):
    package = models.ForeignKey(Package, on_delete=models.CASCADE, related_name='features')
    feature_name = models.CharField(max_length=100)       # Unlimited Data, Static IP, etc.
    is_included = models.BooleanField(default=True)

    class Meta:
        db_table = 'package_features'
