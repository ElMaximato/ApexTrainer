from rest_framework.permissions import IsAdminUser
from rest_framework.viewsets import ModelViewSet

from users.models import User
from users.serializers import UserSerializer


class UserApiViewSet(ModelViewSet):
    """CRUD de usuarios. Solo para administradores.

    El hash de la contraseña nunca se devuelve, y la contraseña solo se
    modifica cuando se envía en la petición (la lógica vive en el serializer,
    por lo que cubre POST, PUT y PATCH).
    """

    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("id")
