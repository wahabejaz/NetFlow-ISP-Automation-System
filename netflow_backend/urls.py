from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path


def root_view(request):
    return JsonResponse(
        {
            "status": "ok",
            "message": "Netflow backend is running.",
            "api_prefix": "/api/",
        }
    )


urlpatterns = [
    path("", root_view, name="root"),
    path("api/", include("backend.api.urls")),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

