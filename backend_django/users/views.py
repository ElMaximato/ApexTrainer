from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from users.models import User
from users.serializers import UserMeSerializer, UserSerializer


class UserApiViewSet(ModelViewSet):
    """CRUD de usuarios. Solo para administradores.

    El hash de la contraseña nunca se devuelve, y la contraseña solo se
    modifica cuando se envía en la petición (la lógica vive en el serializer,
    por lo que cubre POST, PUT y PATCH).
    """

    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("id")


class UserView(APIView):
    """Datos personales del usuario autenticado."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Datos personales del usuario autenticado",
        responses={200: UserMeSerializer},
    )
    def get(self, request):
        # Serializer de solo lectura: nunca incluye la contraseña ni su hash
        return Response(UserMeSerializer(request.user).data)
