from django.urls import path, include
from rest_framework import routers
from django.contrib import admin
from api.views import UsuarioViewSet, CoordenadorViewSet, AlunoViewSet

router = routers.DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuarios')
router.register('coordenador', CoordenadorViewSet, basename='coordenador')
router.register('aluno', AlunoViewSet, basename='aluno')

urlpatterns = [
    path('', include(router.urls)),
]
