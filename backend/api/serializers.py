from rest_framework import serializers
from api.models import Usuario, Coordenador, Aluno, SuperAdmin

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

"""Serializer geral para get"""
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

"""Serializer para post, precisa por usar procedure para salvar"""
class CoordenadorCreateSerializer(serializers.Serializer):
    """criação de coordenador usando a procedure"""
    nome = serializers.CharField(max_length= 150)
    email = serializers.EmailField(max_length = 150)
    senha = serializers.CharField(write_only = True)
    telefone= serializers.CharField(max_length=20, required = False, allow_null = True, allow_blank = True)


"""Serializer para edição, precisa por usar procedure para salvar"""

class CoordenadorUpdateSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length= 150, required = False)
    email = serializers.EmailField(max_length= 150, required = False)
    status = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                'Envie pelo menos um campo para atualização'
            )
        return attrs

class AlunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aluno
        fields = '__all__'

class SuperAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model= SuperAdmin
        fields = '__all__'

