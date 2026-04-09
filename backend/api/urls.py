from django.urls import path, include
from rest_framework import routers
from django.contrib import admin
from api.views import (
    UsuarioViewSet, CoordenadorViewSet, AlunoViewSet,
    SuperAdminViewSet, LoginAPIView, InscricaoViewSet,
    CoordenadorCursoViewSet,)

router = routers.DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuarios')
router.register('coordenador', CoordenadorViewSet, basename='coordenador')
router.register('aluno', AlunoViewSet, basename='aluno')
router.register('superadmin', SuperAdminViewSet, basename='superadmin' )
router.register('inscricao', InscricaoViewSet, basename='inscricao')
router.register('coordenacaoCurso', CoordenadorCursoViewSet, basename= 'coordenaaoCurso')

urlpatterns = [
    path('login/', LoginAPIView.as_view(), name='login'),
    path('', include(router.urls)),
]
