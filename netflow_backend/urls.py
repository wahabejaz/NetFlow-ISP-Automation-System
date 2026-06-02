from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path
from django.db import connection


def root_view(request):
    return JsonResponse(
        {
            "status": "ok",
            "message": "Netflow backend is running.",
            "api_prefix": "/api/",
        }
    )


def health_check(request):
    """Diagnostic endpoint to check database and system health."""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = "connected"
        db_error = None
    except Exception as e:
        db_status = "failed"
        db_error = str(e)
    
    return JsonResponse(
        {
            "status": "ok" if db_status == "connected" else "degraded",
            "database": {
                "status": db_status,
                "error": db_error,
                "host": settings.DATABASES["default"].get("HOST"),
                "name": settings.DATABASES["default"].get("NAME"),
            },
            "debug": settings.DEBUG,
        }
    )


urlpatterns = [
    path("", root_view, name="root"),
    path("health/", health_check, name="health"),
    path("api/", include("backend.api.urls")),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

