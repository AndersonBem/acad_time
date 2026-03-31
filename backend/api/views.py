from rest_framework import status,viewsets
from rest_framework.response import Response
from django.db import connection
from django.contrib.auth.hashers import make_password
from api.models import Usuario, Coordenador
from api.serializers import UsuarioSerializer, CoordenadorSerializer, CoordenadorCreateSerializer,CoordenadorUpdateSerializer

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    """Listando usuários, sem permitir criação, deleteção e etc, esses metodos
    vão ser usadas nas tabelas detalhadas de usuario(coordenador, aluno e SuperAdmin)"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

class CoordenadorViewSet(viewsets.ModelViewSet):
    """Tabela especifica que herda de usuario, aqui vai permitir os metodos
    que usuarioviewset não possue"""
    queryset = Coordenador.objects.all()

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

        with connection.cursor() as cursor:
            cursor.execute(
                'CALL sp_cadastrar_coordenador_com_usuario(%s, %s, %s, %s)',
                [nome,email,senha_hash, telefone]
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
        
        coordenador_atualizado = Coordenador.objects.get(
            usuario__id_usuario = coordenador.usuario.id_usuario
        )

        response_serializer = CoordenadorSerializer(coordenador_atualizado)

        return Response(response_serializer.data, status =status.HTTP_200_OK)
    
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

