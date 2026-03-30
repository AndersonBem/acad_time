from django.urls import path, include
from rest_framework import routers
from django.contrib import admin
from api.views import UsuarioViewSet, CoordenadorViewSet

router = routers.DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuarios')
router.register('coordenador', CoordenadorViewSet, basename='coordenador')

urlpatterns = [
    path('', include(router.urls)),
]
