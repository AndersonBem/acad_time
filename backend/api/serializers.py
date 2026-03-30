from rest_framework import serializers
from api.models import Usuario, Coordenador, Aluno, SuperAdmin

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

class CoordenadorSerializer(serializers.ModelSerializer):

    id = serializers.ReadOnlyField(source = 'usuario.id_usuario')
    nome = serializers.ReadOnlyField(source = 'usuario.nome')
    email = serializers.ReadOnlyField(source = 'usuario.email')
    telefone = serializers.SerializerMethodField()

    class Meta:
        model = Coordenador
        fields = ['id','nome', 'email', 'status', 'telefone']

    def get_telefone(self, obj):
        telefone = obj.telefone_set.first()
        return telefone.numero if telefone else None

class CoordenadorCreateSerializer(serializers.Serializer):
    """criação de coordenador usando a procedure"""
    nome = serializers.CharField(max_length= 150)
    email = serializers.EmailField(max_length = 150)
    senha = serializers.CharField(write_only = True)
    telefone= serializers.CharField(max_length=20, required = False, allow_null = True, allow_blank = True)

class AlunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aluno
        fields = '__all__'

class SuperAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model= SuperAdmin
        fields = '__all__'

