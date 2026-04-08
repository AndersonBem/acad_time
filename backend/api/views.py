from rest_framework import status,viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import connection, IntegrityError, DatabaseError
from django.contrib.auth.hashers import make_password, check_password
from api.models import Usuario, Coordenador, Aluno, SuperAdmin
from api.serializers import (
    UsuarioSerializer, 
    CoordenadorSerializer, CoordenadorCreateSerializer, CoordenadorUpdateSerializer, 
    AlunoSerializer, AlunoCreateSerializer,AlunoUpdateSerializer,
    SuperAdminSerializer, LoginSerializer)
from api.jwt_utils import gerar_access_token

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """Listando usuários, sem permitir criação, deleteção e etc, esses metodos
    vão ser usadas nas tabelas detalhadas de usuario(coordenador, aluno e SuperAdmin)"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class CoordenadorViewSet(viewsets.ModelViewSet):
    """Tabela especifica que herda de usuario, aqui vai permitir os metodos
    que usuarioviewset não possue"""
    queryset = Coordenador.objects.select_related('usuario').prefetch_related(
        'coordenacoes__curso',
        'telefone_set'
    )

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
    def destroy(self, request, *args, **kwargs):
        """pega o objeto coordenador"""
        coordenador = self.get_object()

        """pega o usuario do coordenador"""
        usuario = coordenador.usuario
        usuario.delete()

        return Response(status= status.HTTP_204_NO_CONTENT)

    
    def create(self, request, *args, **kwargs):
        """Pegando o serializer que foi definido antes e as informações que
        vieram do frontend"""
        serializer = self.get_serializer(data = request.data)
        """Valida os dados, se tiver erro, retorna 400"""
        serializer.is_valid(raise_exception = True)
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
                    [nome,email,senha_hash, telefone]
                )
        except IntegrityError as e:
            erro = str(e)

            if 'Usuario_email_key' in erro:
                return Response(
                    {"erro": "Email já está em uso"},
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
                    {"erro": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"erro": "Erro ao atualizar coordenador"},
                status=status.HTTP_400_BAD_REQUEST
            )
        """Capturando o objeto criado, depois chamando o serializer de coordenador
        pra deixar ele no formado correto e respondendo pro front esse json"""
        coordenador = Coordenador.objects.get(usuario__email = email)
        response_serializer = CoordenadorSerializer(coordenador) 

        return Response(response_serializer.data, status= status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        coordenador = self.get_object()

        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

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
                    {"erro": "Email já está em uso"},
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
                    {"erro": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"erro": "Erro ao atualizar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        coordenador_atualizado = Coordenador.objects.get(
            usuario__id_usuario = coordenador.usuario.id_usuario
        )

        response_serializer = CoordenadorSerializer(coordenador_atualizado)

        return Response(response_serializer.data, status =status.HTTP_200_OK)
    
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

class AlunoViewSet(viewsets.ModelViewSet):
    """repete coordenadorviewset, com modificações pertinentes"""
    permission_classes = [IsAuthenticated]
    queryset = Aluno.objects.select_related('usuario').prefetch_related(
        'matriculas__curso',
        'matriculas__status_matricula'
    )
    def get_serializer_class(self):
        if self.action == 'create':
            return AlunoCreateSerializer
        if self.action in ['update', 'partial_update']:
            return AlunoUpdateSerializer
        return AlunoSerializer
    
    def destroy(self, request, *args, **kwargs):
        aluno = self.get_object()

        usuario = aluno.usuario
        usuario.delete()

        return Response(status= status.HTTP_204_NO_CONTENT)
    
    def create(self, request, *args, **kwargs):
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
                    {"erro": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            elif 'Aluno_matricula_key' in erro:
                return Response(
                    {"erro": "Matrícula já está em uso"},
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
                    {"erro": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"erro": "Erro ao criar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        aluno = Aluno.objects.get(usuario__email = email)
        response_serializer = AlunoSerializer(aluno)

        return Response(response_serializer.data, status= status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
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
                    {"erro": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            elif 'Aluno_matricula_key' in erro:
                return Response(
                    {"erro": "Matrícula já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"erro": "Erro ao atualizar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError as e:
            erro = str(e)

            if 'Já existe outro usuário com este email' in erro:
                return Response(
                    {"erro": "Email já está em uso"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"erro": "Erro ao atualizar aluno"},
                status=status.HTTP_400_BAD_REQUEST
            )

        aluno_atualizado = Aluno.objects.get(
            usuario__id_usuario = aluno.usuario.id_usuario
        )

        response_serializer = AlunoSerializer(aluno_atualizado)
        return Response(response_serializer.data, status= status.HTTP_200_OK)
    
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

"""SuperAdmin deve ser criado apenas diretamente no banco,
   não vamos permitir criação via api"""
class SuperAdminViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = SuperAdmin.objects.all()
    serializer_class = SuperAdminSerializer

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
