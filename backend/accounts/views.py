from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.http import require_http_methods
from .forms import LoginForm
from .services import AuthService

@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return AuthService.redirect_after_login(request.user)

    role = request.GET.get('role', 'customer')  # Tab pre-selection
    form = LoginForm(request.POST or None)

    if request.method == 'POST':
        if form.is_valid():
            user = authenticate(
                request,
                username=form.cleaned_data['email'],
                password=form.cleaned_data['password']
            )
            if user:
                login(request, user)
                if form.cleaned_data.get('remember_me'):
                    request.session.set_expiry(86400 * 30)
                return AuthService.redirect_after_login(user)
            else:
                form.add_error(None, 'Invalid email or password.')

    return render(request, 'accounts/login.html', {'form': form, 'active_role': role})

def logout_view(request):
    logout(request)
    return redirect('accounts:login')
