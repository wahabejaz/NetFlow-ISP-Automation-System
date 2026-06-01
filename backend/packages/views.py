from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from .models import Package
from .forms import PackageForm

@login_required
def package_list(request):
    packages = Package.objects.prefetch_related('features').annotate(
        customer_count=Count('customer')
    ).order_by('monthly_price')

    form = PackageForm()

    if request.method == 'POST' and 'add_package' in request.POST:
        form = PackageForm(request.POST)
        if form.is_valid():
            from .services import PackageService
            PackageService.create_package(form.cleaned_data)
            from django.contrib import messages
            messages.success(request, 'Package created successfully.')
            return redirect('packages:list')

    context = {
        'active_menu': 'packages',
        'packages': packages,
        'form': form
    }
    return render(request, 'packages/list.html', context)
