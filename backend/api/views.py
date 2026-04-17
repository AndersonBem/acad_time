from rest_framework import status,viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import (connection, IntegrityError, DatabaseError,
                        InternalError, transaction)

from django.core.files.storage import default_storage
import uuid 
import os
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

from api.models import (Usuario, Coordenador, Aluno,
                        SuperAdmin, Inscricao, CoordenacaoCurso,
                        TipoAtividade,RegraAtividade, StatusSubmissao,
                        AtividadeComplementar,  Submissao, Curso,
                        LogAuditoria, NotificacaoEmail,Certificado)

from api.serializers import (
    UsuarioSerializer, 
    CoordenadorSerializer, CoordenadorCreateSerializer, CoordenadorUpdateSerializer, 
    AlunoSerializer, AlunoCreateSerializer,AlunoUpdateSerializer,
    SuperAdminSerializer, LoginSerializer, InscricaoReadSerializer,
    InscricaoCreateSerializer, InscricaoUpdateSerializer, CoordenacaoCursoCreateSerializer,
    CoordenacaoCursoUpdateSerializer,CoordenacaoCursoReadSerializer,
    TipoAtividadeSerializer,RegraAtividadeSerializer,StatusSubmissaoSerializer,
    AtividadeComplementarSerializer, SubmissaoReadSerializer, CursoSerializer,
    SubmissaoCreateSerializer, SubmissaoUpdateSerializer,LogAuditoriaReadSerializer,
    NotificacaoEmailReadSerializer, RecuperarSenhaSerializer, RedefinirSenhaSerializer)

from api.jwt_utils import gerar_access_token
from .mixins import AuditContextMixin
from api.notificacao_service import NotificacaoService
from api.recuperar_service import RecuperacaoSenhaService
from api.redefinir_service import RedefinirSenhaService
from api.utils_auditoria import set_audit_context

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """Listando usuários, sem permitir criação, deleteção e etc, esses metodos
    vão ser usadas nas tabelas detalhadas de usuario(coordenador, aluno e SuperAdmin)"""
    permission_classes = [IsAuthenticated]
    serializer_class = UsuarioSerializer
    def get_queryset(self):
        usuario = self.request.user
        if hasattr(usuario, 'superadmin'):
            return Usuario.objects.all()
        raise PermissionDenied('Apenas superadmin pode acessar usuários.')

class CoordenadorViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    """Tabela especifica que herda de usuario, aqui vai permitir os metodos
    que usuarioviewset não possue"""
    queryset = Coordenador.objects.select_related('usuario').prefetch_related(
        'coordenacoes__curso',
        'telefone_set'
    )

    def _validar_superadmin(self, request):
        usuario = request.user

        if not hasattr(usuario, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')

    """Definindo se o serializer_class vai ser de POST ou GET"""
    def get_serializer_class(self):
        if self.action == 'create':
            return CoordenadorCreateSerializer
        if self.action in ['update', 'partial_update']:
            return CoordenadorUpdateSerializer
        return CoordenadorSerializer
    
    """Quando apagar o coordenador, precisa apagar o usuario, se não ele vai manter o usuario sem ter relação com as
    tabelas filhas. Para facilitar, vou mandar ele deletar o usuario relacionado a coordenador e o banco vai apagar o 
    coordenador pelo cascade"""
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        set_audit_context(request)
        self._validar_superadmin(request)

        """pega o objeto coordenador"""
        coordenador = self.get_object()

        """pega o usuario do coordenador"""
        usuario = coordenador.usuario
        usuario.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        set_audit_context(request)
        self._validar_superadmin(request)

        """Pegando o serializer que foi definido antes e as informações que
        vieram do frontend"""
        serializer = self.get_serializer(data=request.data)
        """Valida os dados, se tiver erro, retorna 400"""
        serializer.is_valid(raise_exception=True)
        """capturando os dados de acordo com o pedido na procedure"""
        nome = serializer.validated_data['nome']
        email = serializer.validated_data['email']

        """Lógica para pegar a senha e passar ela pelo hash"""
        senha = serializer.validated_data['senha']
        senha_hash = make_password(senha)

        telefone = serializer.validated_data.get('telefone')

        """Aqui estou conecatando direto no banco e chamando a procedure"""
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    'CALL sp_cadastrar_coordenador_com_usuario(%s, %s, %s, %s)',
                    [nome, email, senha_hash, telefone]
                )
        except IntegrityError as e:
            erro = str(e)

            if 'Usuario_email_key' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"erro": "Erro ao cadastrar coordenador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError as e:
            erro = str(e)

            if 'Já existe outro usuário com este email' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"detail": "Erro ao atualizar coordenador"},
                status=status.HTTP_400_BAD_REQUEST
            )

        """Capturando o objeto criado, depois chamando o serializer de coordenador
        pra deixar ele no formado correto e respondendo pro front esse json"""
        coordenador = Coordenador.objects.get(usuario__email=email)
        response_serializer = CoordenadorSerializer(coordenador)

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        set_audit_context(request)
        self._validar_superadmin(request)

        coordenador = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nome = serializer.validated_data.get('nome')
        email = serializer.validated_data.get('email')
        status_coordenador = serializer.validated_data.get('status')

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    'CALL sp_atualizar_coordenador_com_usuario(%s, %s, %s, %s)',
                    [
                        coordenador.usuario.id_usuario,
                        nome,
                        email,
                        status_coordenador
                    ]
                )
        except IntegrityError as e:
            erro = str(e)
            if 'Usuario_email_key' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"detail": "Erro ao atualizar coordenador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError as e:
            erro = str(e)

            if 'Já existe outro usuário com este email' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"detail": "Erro ao atualizar coordenador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        coordenador_atualizado = Coordenador.objects.get(
            usuario__id_usuario=coordenador.usuario.id_usuario
        )

        response_serializer = CoordenadorSerializer(coordenador_atualizado)

        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)


class CoordenadorCursoViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CoordenacaoCurso.objects.select_related(
        'coordenador',
        'curso',
        'coordenador__usuario'
    ).order_by('id_coordenacao_curso')

    def get_serializer_class(self):
        if self.action == 'create':
            return CoordenacaoCursoCreateSerializer
        if self.action in ['update', 'partial_update']:
            return CoordenacaoCursoUpdateSerializer
        return CoordenacaoCursoReadSerializer

    def _validar_superadmin(self, request):
        usuario = request.user
        if not hasattr(usuario, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self._validar_superadmin(request)
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self._validar_superadmin(request)
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        self._validar_superadmin(request)
        return super().partial_update(request, *args, **kwargs)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Exclusão de vínculo não é permitida.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

class InscricaoViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        usuario = self.request.user

        # Super admin

        if hasattr(usuario, 'superadmin'):
            return Inscricao.objects.all()
        
        # Coordenador 

        if hasattr(usuario, 'coordenador'):
            return Inscricao.objects.filter(
                curso__coordenacaocurso__coordenador = usuario.coordenador,
                curso__coordenacaocurso__data_fim__isnull = True
            )
        
        # Aluno

        if hasattr(usuario, 'aluno'):
            return Inscricao.objects.filter(aluno = usuario.aluno)
        
        return Inscricao.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return InscricaoCreateSerializer
        if self.action  in ['update', 'partial_update']:
            return InscricaoUpdateSerializer
        return InscricaoReadSerializer
    
    
    def destroy(self, request, *args, **kwargs):
        return Response(
            {'erro': 'Exclusão de inscrição não é permitida.'},
            status= status.HTTP_405_METHOD_NOT_ALLOWED
        )
    def _validar_coordenador_ou_superadmin(self, request):
        usuario = request.user

        eh_coordenador = hasattr(usuario, 'coordenador')
        eh_superadmin = hasattr(usuario, 'superadmin')

        if not (eh_coordenador or eh_superadmin):
            raise PermissionDenied('Apenas coordenador ou superadmin pode realizar esta ação.')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self._validar_coordenador_ou_superadmin(request)
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def perform_create(self, serializer):
        usuario = self.request.user
        
        #Coordenador
        
        if hasattr(usuario, 'coordenador'):
            curso = serializer.validated_data.get('curso')

            vinculo = curso.coordenacaocurso_set.filter(
                coordenador= usuario.coordenador,
                data_fim__isnull=True
            ).exists()

            if not vinculo:
                raise PermissionDenied('Você não pode criar inscrição para este curso.')
            
            serializer.save()
            return
        
        # SuperAdmin

        if hasattr(usuario, 'superadmin'):
            serializer.save()
            return

        raise PermissionDenied('Sem permissão.')

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self.get_object()
        self._validar_coordenador_ou_superadmin(request)
        return super().update(request, *args, **kwargs)

    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        self.get_object()
        self._validar_coordenador_ou_superadmin(request)
        return super().partial_update(request, *args, **kwargs)

class AlunoViewSet(AuditContextMixin, viewsets.ModelViewSet):
    """repete coordenadorviewset, com modificações pertinentes"""
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        usuario = self.request.user

        base_qs = Aluno.objects.select_related('usuario').prefetch_related(
            'inscricoes__curso',
            'inscricoes__status_matricula'
        )

        # superadmin

        if hasattr(usuario, 'superadmin'):
            return base_qs
        
        # coordenador

        if hasattr(usuario, 'coordenador'):
            return base_qs.filter(
                inscricoes__curso__coordenacaocurso__coordenador=usuario.coordenador,
                inscricoes__curso__coordenacaocurso__data_fim__isnull=True
            ).distinct()

        # aluno

        if hasattr(usuario, 'aluno'):
            return base_qs.filter(pk= usuario.aluno.pk)

        return Aluno.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AlunoCreateSerializer
        if self.action in ['update', 'partial_update']:
            return AlunoUpdateSerializer
        return AlunoSerializer
    
    def _validar_apenas_superadmin(self, request):
        if not hasattr(request.user, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizer esta ação.')

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        set_audit_context(request)
        self._validar_apenas_superadmin(request)
        aluno = self.get_object()

        usuario = aluno.usuario
        usuario.delete()

        return Response(status= status.HTTP_204_NO_CONTENT)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        set_audit_context(request)
        self._validar_apenas_superadmin(request)
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)
        nome = serializer.validated_data['nome']
        email = serializer.validated_data['email']
        senha = serializer.validated_data['senha']
        senha_hash = make_password(senha)
        matricula = serializer.validated_data['matricula']

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    'CALL sp_cadastrar_aluno_com_usuario(%s, %s, %s, %s)',
                    [nome, email, senha_hash, matricula]
                )
        except IntegrityError as e:
            erro = str(e)

            if 'Usuario_email_key' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            elif 'Aluno_matricula_key' in erro:
                return Response(
                    {"detail": "Matrícula já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"erro": "Erro ao cadastrar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError as e:
            erro = str(e)

            if 'Já existe outro usuário com este email' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"detail": "Erro ao criar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        aluno = Aluno.objects.get(usuario__email = email)
        response_serializer = AlunoSerializer(aluno)

        return Response(response_serializer.data, status= status.HTTP_201_CREATED)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        set_audit_context(request)
        self._validar_apenas_superadmin(request)
        aluno = self.get_object()
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        nome = serializer.validated_data.get('nome')
        email = serializer.validated_data.get('email')
        matricula = serializer.validated_data.get('matricula')

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    'CALL sp_atualizar_aluno_com_usuario(%s, %s, %s, %s)',
                    [
                        aluno.usuario.id_usuario,
                        nome,
                        email,
                        matricula
                    ]
                )
        except IntegrityError as e:
            erro = str(e)

            if 'Usuario_email_key' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            elif 'Aluno_matricula_key' in erro:
                return Response(
                    {"detail": "Matrícula já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"detail": "Erro ao atualizar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError as e:
            erro = str(e)

            if 'Já existe outro usuário com este email' in erro:
                return Response(
                    {"detail": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"detail": "Erro ao atualizar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )

        aluno_atualizado = Aluno.objects.get(
            usuario__id_usuario = aluno.usuario.id_usuario
        )

        response_serializer = AlunoSerializer(aluno_atualizado)
        return Response(response_serializer.data, status= status.HTTP_200_OK)
    
    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

"""SuperAdmin deve ser criado apenas diretamente no banco,
   não vamos permitir criação via api"""
class SuperAdminViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = SuperAdminSerializer

    def get_queryset(self):
        usuario = self.request.user

        if hasattr(usuario, 'superadmin'):
            return SuperAdmin.objects.all()

        raise PermissionDenied('Apenas superadmin pode acessar este endpoint.')

class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status= status.HTTP_400_BAD_REQUEST
            )
        email = serializer.validated_data['email']
        senha = serializer.validated_data['senha']

        try:
            usuario = Usuario.objects.get(email = email)
        except Usuario.DoesNotExist:
            return Response(
                {'erro': 'Email ou senha inválidos.'},
                status= status.HTTP_401_UNAUTHORIZED
            )
        
        if not check_password(senha, usuario.senha_hash):
            return Response(
                {'erro': 'Email ou senha inválidos.'},
                status= status.HTTP_401_UNAUTHORIZED
            )
        tipo_usuario = self.descobrir_tipo_usuario(usuario)
        access_token = gerar_access_token(usuario, tipo_usuario)

        return Response(
            {
                'mensagem': 'Login realizado com sucesso.',
                'access': access_token,
                'usuario': {
                    'id': usuario.id_usuario,
                    'nome': usuario.nome,
                    'email': usuario.email,
                    'tipo': tipo_usuario,
                }
            },
            status=status.HTTP_200_OK
        )
    
    def descobrir_tipo_usuario(self, usuario):
        if hasattr(usuario, 'aluno'):
            return 'aluno'
        
        if hasattr(usuario, 'coordenador'):
            return 'coordenador'

        if hasattr(usuario, 'superadmin'):
            return 'superadmin'

        return 'usuario'

class TipoAtividadeViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = TipoAtividade.objects.all().order_by('nome')
    serializer_class = TipoAtividadeSerializer

    def _validar_apenas_superadmin(self, request):
        if not hasattr(request.user, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')

    def create(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'detail': 'Exclusão de tipo de atividade não é permitida.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

class RegraAtividadeViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = RegraAtividade.objects.all().order_by('curso')
    serializer_class = RegraAtividadeSerializer

    def _validar_apenas_superadmin(self, request):
        if not hasattr(request.user, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')

    def create(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'erro': 'Exclusão de regra de atividade não é permitida.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

class StatusSubmissaoViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = StatusSubmissao.objects.all().order_by('nome_status')
    serializer_class = StatusSubmissaoSerializer

class AtividadeComplementarViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AtividadeComplementarSerializer

    def get_queryset(self):
        usuario = self.request.user
        queryset = AtividadeComplementar.objects.all().order_by('id_atividade_complementar')

        if hasattr(usuario, 'superadmin'):
            return queryset

        if hasattr(usuario, 'coordenador'):
            return queryset.filter(
                submissao__curso__coordenacaocurso__coordenador=usuario.coordenador,
                submissao__curso__coordenacaocurso__data_fim__isnull=True
            ).distinct()

        if hasattr(usuario, 'aluno'):
            return queryset.filter(
                submissao__aluno=usuario.aluno
            ).distinct()

        return queryset.none()

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, 'aluno'):
            raise PermissionDenied('Apenas aluno pode criar atividade complementar.')
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        raise PermissionDenied('Edição de atividade complementar não é permitida.')

    def partial_update(self, request, *args, **kwargs):
        raise PermissionDenied('Edição de atividade complementar não é permitida.')

    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied('Exclusão de atividade complementar não é permitida.')

class CursoViewSet(AuditContextMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer

    def _validar_apenas_superadmin(self, request):
        if not hasattr(request.user, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')

    def create(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._validar_apenas_superadmin(request)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {'erro': 'Exclusão de curso não é permitida.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )


class SubmissaoViewSet(AuditContextMixin, viewsets.ModelViewSet):
    """permission_classes = [IsAuthenticated]"""
    def get_queryset(self):
        usuario = self.request.user

        queryset = Submissao.objects.select_related(
            'aluno',
            'aluno__usuario',
            'curso',
            'atividade_complementar',
            'status_submissao',
            'certificado',
            'coordenador',
            'coordenador__usuario'
        )

        if hasattr(usuario, 'aluno'):
            return queryset.filter(aluno=usuario.aluno)

        if hasattr(usuario, 'coordenador'):
            return queryset.filter(
                curso__coordenacaocurso__coordenador=usuario.coordenador,
                curso__coordenacaocurso__data_fim__isnull=True
            ).distinct()

        if hasattr(usuario, 'superadmin'):
            return queryset

        return queryset.none()
    
    serializer_class = SubmissaoReadSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissaoCreateSerializer
        if self.action in ['update', 'partial_update']:
            return SubmissaoUpdateSerializer
        return SubmissaoReadSerializer
    
    @transaction.atomic
    def perform_create(self, serializer):
        usuario = self.request.user


        eh_aluno = hasattr(usuario, 'aluno')

        if not eh_aluno:
            raise PermissionDenied('Apenas alunos podem criar submissões.')

        
        aluno = usuario.aluno
        curso = serializer.validated_data.get('curso')
        arquivo =  serializer.validated_data.pop('certificado_arquivo', None)
       

        possui_inscricao_ativa = Inscricao.objects.filter(
            aluno = aluno,
            curso = curso,
            status_matricula_id =1
        ).exists()

        if not possui_inscricao_ativa:
            raise ValidationError('O aluno não possui inscrição ativa nesse curso.')
        
        if not arquivo:
            raise ValidationError('O arquivo de certificado é obrigatório.')
        
        extensao = os.path.splitext(arquivo.name)[1].lower()
        extensoes_permitidas = ['.pdf', '.jpg', '.jpeg', '.png']
        nome_unico = f"{uuid.uuid4()}{extensao}"

        if extensao not in extensoes_permitidas:
            raise ValidationError({
            'certificado_arquivo': 'Formato inválido. Envie PDF, JPG, JPEG ou PNG.'
        })
        caminho_arquivo = default_storage.save(f'certificados/{nome_unico}', arquivo)


        status_pendente = StatusSubmissao.objects.get(nome_status = 'PENDENTE')   

        certificado = Certificado.objects.create(
             nome_arquivo=nome_unico,
             url_arquivo=default_storage.url(caminho_arquivo),
             data_upload=timezone.now().date()
        ) 
        coordenacao_ativa = CoordenacaoCurso.objects.filter(
            curso=curso,
            data_fim__isnull=True
        ).first()

        if not coordenacao_ativa:
            raise ValidationError('O curso informado não possui coordenador ativo.')

        status_pendente = StatusSubmissao.objects.get(nome_status = 'PENDENTE')    

        submissao = serializer.save(
            aluno=aluno,
            data_envio=timezone.now().date(),
            status_submissao=status_pendente,
            observacao_coordenador=None,
            certificado=certificado,
            coordenador=coordenacao_ativa.coordenador
        )

        try:
            NotificacaoService.notificar_submissao_criada(submissao)
        except Exception as e:
            print(f'Erro ao enviar notificação de submissão criada: {e}')

    @transaction.atomic
    def perform_update(self, serializer):
        usuario = self.request.user
        submissao = self.get_object()
        status_anterior = submissao.status_submissao.nome_status

        eh_aluno = hasattr(usuario, 'aluno')
        eh_coordenador = hasattr(usuario, 'coordenador')
        eh_superadmin = hasattr(usuario, 'superadmin')

        if eh_aluno:
            raise PermissionDenied('Aluno não pode alterar submissões.')
        if eh_coordenador:
            vinculo_ativo = CoordenacaoCurso.objects.filter(
                coordenador=usuario.coordenador,
                curso=submissao.curso,
                data_fim__isnull=True
            ).exists()

            if not vinculo_ativo:
                raise PermissionDenied("Você não pode avaliar submissões deste curso.")
            
            try:
                with transaction.atomic():
                    serializer.save(coordenador=usuario.coordenador)
                submissao.refresh_from_db()
                status_novo = submissao.status_submissao.nome_status

                if status_anterior != status_novo:
                    try:
                        if status_novo == 'APROVADA':
                            NotificacaoService.notificar_submissao_aprovada(submissao)
                        elif status_novo == 'REPROVADA':
                            NotificacaoService.notificar_submissao_reprovada(submissao)
                    except Exception as e:
                        print(f'Erro ao enviar notificação de atualização da submissão: {e}')
                
            except InternalError as e:
                raise ValidationError({'detail': str(e)})
            return
        
        if eh_superadmin:
            try:
                with transaction.atomic():
                    serializer.save()
                submissao.refresh_from_db()
                status_novo = submissao.status_submissao.nome_status

                if status_anterior != status_novo:
                    try:
                        if status_novo == 'APROVADA':
                            NotificacaoService.notificar_submissao_aprovada(submissao)
                        elif status_novo == 'REPROVADA':
                            NotificacaoService.notificar_submissao_reprovada(submissao)
                    except Exception as e:
                        print(f'Erro ao enviar notificação de atualização da submissão: {e}')
            except InternalError as e:
                raise ValidationError({'detail': str(e)})
            return
        
        raise PermissionDenied("Usuário sem permissão para atualizar submissão.")

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        set_audit_context(request)
        raise PermissionDenied('Exclusão de submissão não é permitida. Utilize a alteração de status.')
    
class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LogAuditoriaReadSerializer
    
    def _validar_superadmin(self, request):
        usuario = request.user
        
        if not hasattr(usuario, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')
    def get_queryset(self):
        self._validar_superadmin(self.request)

        return LogAuditoria.objects.select_related(
            'usuario',
            'tipo_acao'
        ).order_by('-data_hora')

class NotificacaoEmailViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificacaoEmailReadSerializer

    def _validar_superadmin(self, request):
        usuario = request.user
        if not hasattr(usuario, 'superadmin'):
            raise PermissionDenied('Apenas superadmin pode realizar esta ação.')

    def get_queryset(self):
        self._validar_superadmin(self.request)

        return NotificacaoEmail.objects.order_by('-data', '-id_notificacao_email')
    
class RecuperarSenhaAPIView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RecuperarSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            RecuperacaoSenhaService.solicitar_recuperacao(email)
        except Exception as e:
            print(f'Erro ao solicitar recuperação de senha: {e}')

        return Response(
            {'mensagem': 'Se o e-mail existir, o link de recuperação foi enviado.'},
            status=status.HTTP_200_OK
        )
    
class RedefinirSenhaAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RedefinirSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        nova_senha = serializer.validated_data['nova_senha']

        sucesso, mensagem = RedefinirSenhaService.redefinir_senha(token, nova_senha)

        if not sucesso:
            return Response(
                {'detail': mensagem},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'mensagem': mensagem},
            status=status.HTTP_200_OK
        )

