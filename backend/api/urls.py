from django.urls import path, include
from rest_framework import routers
from api.views import (
    UsuarioViewSet, CoordenadorViewSet, AlunoViewSet,
    SuperAdminViewSet, LoginAPIView, InscricaoViewSet,
    CoordenadorCursoViewSet, TipoAtividadeViewSet, RegraAtividadeViewSet,
    StatusSubmissaoViewSet,AtividadeComplementarViewSet,SubmissaoViewSet, CursoViewSet,LoginAPIView)

router = routers.DefaultRouter()
router.register('usuarios', UsuarioViewSet, basename='usuarios')
router.register('coordenador', CoordenadorViewSet, basename='coordenador')
router.register('aluno', AlunoViewSet, basename='aluno')
router.register('superadmin', SuperAdminViewSet, basename='superadmin' )
router.register('inscricao', InscricaoViewSet, basename='inscricao')
router.register('coordenacaoCurso', CoordenadorCursoViewSet, basename= 'coordenacaoCurso')
router.register('tipoAtividade', TipoAtividadeViewSet, basename='tipoAtividade')
router.register('regraAtividade', RegraAtividadeViewSet, basename= 'regraAtividade')
router.register('statusSubmissao', StatusSubmissaoViewSet, basename='statusSubmissao' )
router.register('atividadeComplementar', AtividadeComplementarViewSet, basename= 'AtividadeComplementar')
router.register('submissao',SubmissaoViewSet, basename= 'submissao')
router.register('curso', CursoViewSet, basename= 'curso')
urlpatterns = [
    path('login/', LoginAPIView.as_view(), name='login'),
    path('', include(router.urls)),
]
