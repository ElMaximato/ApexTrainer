from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    """Manager para un usuario que inicia sesion con email (sin username)."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("El correo electrónico es obligatorio.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # guarda el hash, nunca el texto plano
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class ObjetivoFitness(models.TextChoices):
        MASA_MUSCULAR = "masa_muscular", "Ganar masa muscular"
        PERDER_GRASA = "perder_grasa", "Perder grasa"
        RESISTENCIA = "resistencia", "Mejorar resistencia"
        MANTENIMIENTO = "mantenimiento", "Mantener mi condición"

    # El login es con email, asi que se elimina el username
    username = None
    email = models.EmailField("correo electrónico", unique=True)
    # Campo extra de la practica
    objetivo_fitness = models.CharField(
        "objetivo fitness",
        max_length=20,
        choices=ObjetivoFitness.choices,
        blank=True,
        default="",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
