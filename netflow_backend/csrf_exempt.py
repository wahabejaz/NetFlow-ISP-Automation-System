"""
Custom middleware to exempt API endpoints from CSRF protection.

Token-based APIs don't need CSRF protection since they don't rely on session cookies.
This middleware exempts /api/ paths from CSRF validation while keeping CSRF protection
for other views that may use session-based authentication.
"""

from django.utils.deprecation import MiddlewareMixin


class CsrfExemptApiMiddleware(MiddlewareMixin):
    """
    Exempts /api/ endpoints from CSRF protection.
    These endpoints use Token authentication, not sessions, so CSRF protection is not needed.
    """
    
    def process_request(self, request):
        if request.path.startswith('/api/'):
            # Mark the request as CSRF exempt
            request._dont_enforce_csrf_checks = True
        return None
