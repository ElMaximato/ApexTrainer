"""Consumo de un servicio SOAP público con la librería zeep.

Servicio: CountryInfoService (información de países). Se consulta por
código ISO de 2 letras (por ejemplo MX, US, ES).
"""

from functools import lru_cache

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from requests.exceptions import RequestException
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from zeep import Client
from zeep.exceptions import Error as ZeepError
from zeep.helpers import serialize_object
from zeep.transports import Transport

WSDL_URL = (
    "http://webservices.oorsprong.org/websamples.countryinfo/"
    "CountryInfoService.wso?WSDL"
)


@lru_cache(maxsize=1)
def get_client():
    """Crea el cliente SOAP una sola vez (descargar el WSDL tarda)."""
    transport = Transport(timeout=15, operation_timeout=15)
    return Client(WSDL_URL, transport=transport)


class PaisSoapView(APIView):
    """Consulta datos de un país en un servicio SOAP público."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(
        operation_summary="Datos de un país (consume un servicio SOAP con zeep)",
        manual_parameters=[
            openapi.Parameter(
                "codigo",
                openapi.IN_QUERY,
                description="Código ISO de 2 letras, por ejemplo MX",
                type=openapi.TYPE_STRING,
                default="MX",
            )
        ],
    )
    def get(self, request):
        codigo = request.query_params.get("codigo", "MX").strip().upper()
        if len(codigo) != 2 or not codigo.isalpha():
            return Response(
                {"error": "El código debe ser ISO de 2 letras, por ejemplo MX."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            servicio = get_client().service
            nombre = servicio.CountryName(codigo)

            if not nombre or nombre.startswith("Country not found"):
                return Response(
                    {"error": f"No se encontró el país con código {codigo}."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            capital = servicio.CapitalCity(codigo)
            moneda = serialize_object(servicio.CountryCurrency(codigo))
            bandera = servicio.CountryFlag(codigo)
            telefono = servicio.CountryIntPhoneCode(codigo)
        except (ZeepError, RequestException) as error:
            return Response(
                {"error": "No se pudo consultar el servicio SOAP.", "detalle": str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {
                "servicio_soap": "CountryInfoService (webservices.oorsprong.org)",
                "codigo_iso": codigo,
                "pais": nombre,
                "capital": capital,
                "moneda": {"codigo": moneda.get("sISOCode"), "nombre": moneda.get("sName")},
                "codigo_telefonico": telefono,
                "bandera": bandera,
            }
        )
