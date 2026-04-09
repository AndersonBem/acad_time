from rest_framework import serializers
from datetime import date
from api.models import (Usuario, Coordenador, Aluno, 
                        SuperAdmin, CoordenacaoCurso, Inscricao)

"""Serializer geral para get"""
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

"""Serializer apenas para leitura das informações"""
class InscricaoReadSerializer(serializers.ModelSerializer):
    nome_curso = serializers.ReadOnlyField(source = 'curso.nome')
    nome_aluno = serializers.ReadOnlyField(source = 'aluno.usuario.nome')
    numero_matricula = serializers.ReadOnlyField(source = 'aluno.matricula')
    status_matricula = serializers.ReadOnlyField(source = 'status_matricula.nome')
    
    class Meta:
        model = Inscricao
        fields = ['id_inscricao', 'nome_curso', 'nome_aluno','numero_matricula' ,'data_inscricao','status_matricula']
"""Serializer de criação da inscricão"""
class InscricaoCreateSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Inscricao
        fields = ['aluno', 'curso', 'status_matricula']

    def create(self, validated_data):
        validated_data['data_inscricao'] = date.today()
        return super().create(validated_data)
    
"""Serializer de update, apenas do status"""
class InscricaoUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inscricao
        fields = ['status_matricula']

class CoordenacaoCursoResumoSerializer(serializers.ModelSerializer):
    curso = serializers.ReadOnlyField(source = 'curso.nome')
    class Meta:
        model = CoordenacaoCurso
        fields = ['curso']

class CoordenadorSerializer(serializers.ModelSerializer):

    id = serializers.ReadOnlyField(source = 'usuario.id_usuario')
    nome = serializers.ReadOnlyField(source = 'usuario.nome')
    email = serializers.ReadOnlyField(source = 'usuario.email')
    telefone = serializers.SerializerMethodField()
    cursos = CoordenacaoCursoResumoSerializer(
        source = 'coordenacoes',
        many = True,
        read_only = True
    )

    class Meta:
        model = Coordenador
        fields = ['id','nome', 'email', 'status', 'telefone', 'cursos']

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

class InscricaoResumoSerializer(serializers.ModelSerializer):
    curso = serializers.ReadOnlyField(source ='curso.nome')
    status = serializers.ReadOnlyField(source = 'status_matricula.nome')

    class Meta:
        model = Inscricao
        fields = ['curso', 'status']

class AlunoSerializer(serializers.ModelSerializer):

    id = serializers.ReadOnlyField(source = 'usuario.id_usuario')
    nome = serializers.ReadOnlyField(source = 'usuario.nome')
    email = serializers.ReadOnlyField(source = 'usuario.email')
    cursos = InscricaoResumoSerializer(
        source = 'inscricoes',
        many = True,
        read_only = True
    )

    class Meta:
        model = Aluno
        fields = ['id','nome', 'email', 'total_horas', 'matricula', 'cursos']

"""Serializer para post, precisa por usar procedure para salvar"""
class AlunoCreateSerializer(serializers.Serializer):
    """criação de coordenador usando a procedure"""
    nome = serializers.CharField(max_length= 150)
    email = serializers.EmailField(max_length = 150)
    senha = serializers.CharField(write_only = True)
    matricula = serializers.CharField(max_length = 30)

"""Serializer para edição, precisa por usar procedure para salvar"""

class AlunoUpdateSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length= 150, required = False)
    email = serializers.EmailField(max_length= 150, required = False)
    matricula = serializers.CharField(max_length = 30, required = False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                'Envie pelo menos um campo para atualização'
            )
        return attrs

class SuperAdminSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source = 'usuario.id_usuario')
    nome = serializers.ReadOnlyField(source = 'usuario.nome')
    email = serializers.ReadOnlyField(source = 'usuario.email')
    
    class Meta:
        model= SuperAdmin
        fields = ['id','nome', 'email']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    senha = serializers.CharField(write_only = True)

