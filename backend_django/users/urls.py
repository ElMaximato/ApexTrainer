from django.urls import include, path
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users import soap_views, views

router = routers.DefaultRouter()
router.register(r"users", views.UserApiViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/me/", views.UserView.as_view(), name="me"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("soap/pais/", soap_views.PaisSoapView.as_view(), name="soap-pais"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
