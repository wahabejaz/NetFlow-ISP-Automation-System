from django import forms
from .models import Package

class PackageForm(forms.ModelForm):
    features_input = forms.CharField(
        required=False,
        help_text="Comma-separated list of features",
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )

    class Meta:
        model = Package
        fields = ['name', 'speed_mbps', 'monthly_price', 'installation_fee', 'description', 'is_most_popular']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'speed_mbps': forms.NumberInput(attrs={'class': 'form-control'}),
            'monthly_price': forms.NumberInput(attrs={'class': 'form-control'}),
            'installation_fee': forms.NumberInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'is_most_popular': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
