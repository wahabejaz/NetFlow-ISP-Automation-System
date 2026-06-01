from django.shortcuts import redirect

class AuthService:
    @staticmethod
    def redirect_after_login(user):
        role = user.role
        if role == 'admin':
            return redirect('/dashboard/')
        elif role == 'technician':
            return redirect('/technicians/')
        else:
            return redirect('/portal/')
