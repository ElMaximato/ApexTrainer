from rest_framework.test import APITestCase

from users.models import User

URL = "/api/v1/users/"


class UserCrudTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser("admin@apex.com", "AdminClave_2026")
        self.client.force_authenticate(self.admin)

    def crear(self, **extra):
        datos = {
            "email": "cliente@apex.com",
            "first_name": "Ana",
            "objetivo_fitness": "perder_grasa",
            "password": "ClaveSegura_2026",
        }
        datos.update(extra)
        return self.client.post(URL, datos, format="json")

    def test_crear_no_devuelve_password_y_guarda_hash(self):
        r = self.crear()
        self.assertEqual(r.status_code, 201)
        self.assertNotIn("password", r.data)
        usuario = User.objects.get(email="cliente@apex.com")
        self.assertNotEqual(usuario.password, "ClaveSegura_2026")
        self.assertTrue(usuario.password.startswith("pbkdf2_"))
        self.assertTrue(usuario.check_password("ClaveSegura_2026"))
        self.assertEqual(usuario.objetivo_fitness, "perder_grasa")

    def test_crear_exige_password_y_valida_fortaleza(self):
        self.assertEqual(self.crear(password="").status_code, 400)
        self.assertEqual(self.crear(password="12345678").status_code, 400)
        datos = {"email": "otro@apex.com"}
        self.assertEqual(self.client.post(URL, datos, format="json").status_code, 400)

    def test_listado_y_detalle_no_exponen_password(self):
        self.crear()
        lista = self.client.get(URL)
        self.assertEqual(lista.status_code, 200)
        self.assertTrue(all("password" not in u for u in lista.data))
        pk = User.objects.get(email="cliente@apex.com").pk
        self.assertNotIn("password", self.client.get(f"{URL}{pk}/").data)

    def test_editar_sin_password_NO_cambia_la_contrasena(self):
        self.crear()
        cliente = User.objects.get(email="cliente@apex.com")
        hash_antes = cliente.password
        hash_admin = self.admin.password

        r = self.client.patch(f"{URL}{cliente.pk}/", {"first_name": "Ana María"}, format="json")
        self.assertEqual(r.status_code, 200)
        cliente.refresh_from_db()
        self.assertEqual(cliente.first_name, "Ana María")
        self.assertEqual(cliente.password, hash_antes)        # no cambió
        self.assertNotEqual(cliente.password, hash_admin)     # no se copió la del admin
        self.assertTrue(cliente.check_password("ClaveSegura_2026"))

    def test_put_sin_password_tampoco_la_cambia(self):
        self.crear()
        cliente = User.objects.get(email="cliente@apex.com")
        hash_antes = cliente.password
        r = self.client.put(
            f"{URL}{cliente.pk}/",
            {"email": "cliente@apex.com", "first_name": "Ana", "objetivo_fitness": "resistencia"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        cliente.refresh_from_db()
        self.assertEqual(cliente.password, hash_antes)
        self.assertEqual(cliente.objetivo_fitness, "resistencia")

    def test_editar_con_password_si_la_cambia(self):
        self.crear()
        cliente = User.objects.get(email="cliente@apex.com")
        hash_antes = cliente.password
        r = self.client.patch(f"{URL}{cliente.pk}/", {"password": "NuevaClave_2026"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertNotIn("password", r.data)
        cliente.refresh_from_db()
        self.assertNotEqual(cliente.password, hash_antes)
        self.assertTrue(cliente.password.startswith("pbkdf2_"))
        self.assertTrue(cliente.check_password("NuevaClave_2026"))

    def test_solo_administradores(self):
        normal = User.objects.create_user("normal@apex.com", "ClaveNormal_2026")
        self.client.force_authenticate(normal)
        self.assertEqual(self.client.get(URL).status_code, 403)
        self.client.force_authenticate(None)
        self.assertIn(self.client.get(URL).status_code, (401, 403))

    def test_campo_extra_aparece_en_swagger(self):
        self.client.force_authenticate(None)
        r = self.client.get("/swagger/?format=openapi", HTTP_HOST="localhost")
        self.assertEqual(r.status_code, 200)
        esquema = r.json()
        self.assertIn("/users/", esquema["paths"])
        self.assertIn("objetivo_fitness", esquema["definitions"]["User"]["properties"])
        self.assertNotIn("hash", str(esquema["definitions"]["User"]["properties"]).lower())


class DatosPersonalesTests(APITestCase):
    URL_ME = "/api/v1/auth/me/"

    def setUp(self):
        self.admin = User.objects.create_superuser("admin@apex.com", "AdminClave_2026")
        self.cliente = User.objects.create_user(
            "cliente@apex.com",
            "ClaveSegura_2026",
            first_name="Ana",
            objetivo_fitness="resistencia",
        )

    def test_requiere_autenticacion(self):
        self.assertIn(self.client.get(self.URL_ME).status_code, (401, 403))

    def test_devuelve_solo_mis_datos(self):
        self.client.force_authenticate(self.cliente)
        r = self.client.get(self.URL_ME)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "cliente@apex.com")
        self.assertEqual(r.data["first_name"], "Ana")
        self.assertEqual(r.data["objetivo_fitness"], "resistencia")

    def test_nunca_expone_password_ni_hash(self):
        for usuario in (self.cliente, self.admin):
            self.client.force_authenticate(usuario)
            r = self.client.get(self.URL_ME)
            self.assertNotIn("password", r.data)
            self.assertNotIn("pbkdf2_", r.content.decode())
            self.assertNotIn(usuario.password, r.content.decode())

    def test_endpoint_aparece_en_swagger(self):
        r = self.client.get("/swagger/?format=openapi", HTTP_HOST="localhost")
        self.assertIn("/auth/me/", r.json()["paths"])


class LoginJwtTests(APITestCase):
    URL_TOKEN = "/api/v1/auth/token/"
    URL_ME = "/api/v1/auth/me/"
    URL_USERS = "/api/v1/users/"

    def setUp(self):
        self.admin = User.objects.create_superuser("admin@apex.com", "AdminClave_2026")
        self.cliente = User.objects.create_user(
            "cliente@apex.com", "ClaveSegura_2026", first_name="Ana"
        )

    def token(self, email, password):
        return self.client.post(self.URL_TOKEN, {"email": email, "password": password}, format="json")

    def test_login_con_email_devuelve_tokens(self):
        r = self.token("cliente@apex.com", "ClaveSegura_2026")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)
        self.assertNotIn("password", r.data)

    def test_login_incorrecto(self):
        self.assertEqual(self.token("cliente@apex.com", "mala").status_code, 401)
        self.assertEqual(self.token("nadie@apex.com", "ClaveSegura_2026").status_code, 401)

    def test_datos_personales_con_token(self):
        access = self.token("cliente@apex.com", "ClaveSegura_2026").data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        r = self.client.get(self.URL_ME)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "cliente@apex.com")
        self.assertNotIn("password", r.data)

    def test_sin_token_o_token_invalido(self):
        self.assertEqual(self.client.get(self.URL_ME).status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token-falso")
        self.assertEqual(self.client.get(self.URL_ME).status_code, 401)

    def test_vida_del_token_de_acceso_configurada(self):
        from datetime import timedelta

        from rest_framework_simplejwt.settings import api_settings

        self.assertEqual(api_settings.ACCESS_TOKEN_LIFETIME, timedelta(minutes=15))

    def test_refresh_entrega_nuevo_access(self):
        refresh = self.token("cliente@apex.com", "ClaveSegura_2026").data["refresh"]
        r = self.client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.data)

    def test_editar_sin_password_no_cambia_el_login(self):
        """Prueba final: tras editar sin contraseña, sigue entrando con la original."""
        access = self.token("admin@apex.com", "AdminClave_2026").data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        r = self.client.patch(f"{self.URL_USERS}{self.cliente.pk}/", {"first_name": "Ana María"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.client.credentials()
        self.assertEqual(self.token("cliente@apex.com", "ClaveSegura_2026").status_code, 200)
        self.assertEqual(self.token("cliente@apex.com", "AdminClave_2026").status_code, 401)
