from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


class JsonApiExceptionMiddleware(MiddlewareMixin):
    """Return JSON error responses for unhandled exceptions on API endpoints.

    This middleware detects exceptions and, if the request looks like an API
    call (path starts with /api/ or the client accepts JSON), returns a
    JSON response with a 500 status instead of the default HTML error page.
    """

    def process_exception(self, request, exception):
        try:
            is_api_path = request.path.startswith("/api/")
        except Exception:
            is_api_path = False

        accept = request.META.get("HTTP_ACCEPT", "")
        wants_json = "application/json" in accept or "*/*" in accept

        if is_api_path or wants_json:
            logger.exception("Unhandled exception during API request: %s", str(exception))
            payload = {"detail": "Server error", "error": str(exception)}
            return JsonResponse(payload, status=500)

        return None
