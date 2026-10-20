from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Documentacion de la API (Swagger / ReDoc)
schema_view = get_schema_view(
    openapi.Info(
        title="APEX Trainer API",
        default_version="v1",
        description="API de APEX Personal Training: usuarios, autenticación con JWT y rutinas.",
        contact=openapi.Contact(email="contacto@apextrainer.local"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("users.urls")),
    path("swagger<format>/", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]
