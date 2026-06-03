from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import logging
import json

try:
    from rest_framework.exceptions import ParseError as DRFParseError
except Exception:
    DRFParseError = None

logger = logging.getLogger(__name__)


class JsonApiExceptionMiddleware(MiddlewareMixin):
    """Return JSON error responses for unhandled exceptions on API endpoints.

    Special-case JSON parse errors to return 400 Bad Request instead of 500.
    For other exceptions, return a generic 500 JSON response when the request
    looks like an API call or the client accepts JSON.
    """

    def process_exception(self, request, exception):
        try:
            is_api_path = bool(getattr(request, "path", "")).startswith("/api/")
        except Exception:
            is_api_path = False

        accept = request.META.get("HTTP_ACCEPT", "")
        wants_json = "application/json" in accept or "*/*" in accept

        # Map JSON parse errors to 400 Bad Request
        is_json_parse_error = False
        if DRFParseError and isinstance(exception, DRFParseError):
            is_json_parse_error = True
        elif isinstance(exception, json.JSONDecodeError):
            is_json_parse_error = True

        if is_json_parse_error:
            logger.info("JSON parse error during API request: %s", str(exception))
            return JsonResponse({"detail": "Invalid JSON payload", "error": str(exception)}, status=400)

        if is_api_path or wants_json:
            logger.exception("Unhandled exception during API request: %s", str(exception))
            payload = {"detail": "Server error", "error": str(exception)}
            return JsonResponse(payload, status=500)

        return None
