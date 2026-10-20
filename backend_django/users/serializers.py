from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    # write_only: la contrasena se recibe pero NUNCA aparece en las respuestas
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
        help_text="Obligatoria al crear. Al editar, solo se cambia si se envía.",
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "objetivo_fitness",
            "password",
            "is_active",
            "is_staff",
        ]

    def validate_password(self, value):
        validate_password(value)  # longitud, contrasenas comunes, solo numeros
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "La contraseña es obligatoria al crear un usuario."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        # create_user guarda el hash (set_password), nunca el texto plano
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        # La contrasena solo cambia si viene en la peticion
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance
