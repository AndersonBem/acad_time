const CONFIG = {
    //BASE_URL: 'https://acad-time.onrender.com',
    BASE_URL: 'http://127.0.0.1:7000/',
    ENDPOINTS: {
        usuarios: '/usuarios/',
        coordenadores: '/coordenador/',
        alunos: '/aluno/',
        superadmin: '/superadmin/',
        login: '/login/'
    }
};

/*
=====================================================
REGRAS GERAIS PARA O FRONT
=====================================================

1. Como montar URL:
const url = CONFIG.BASE_URL.replace(/\/$/, '') + CONFIG.ENDPOINTS.alunos;

2. Rotas protegidas precisam enviar:
Authorization: Bearer TOKEN

3. Token salvo em:
localStorage.getItem('access_token')

4. Usuário logado:
localStorage.getItem('usuario_logado')

5. Padrão DRF:
- lista: /rota/
- detalhe: /rota/{id}/

6. GET não precisa de Content-Type
*/


/*
=====================================================
LOGIN
=====================================================

Rota: /login/
Método: POST
Autenticação: NÃO precisa token

Body:
{
    "email": "teste@acadtime.com",
    "senha": "teste123"
}

Resposta:
{
    "mensagem": "Login realizado com sucesso.",
    "access": "TOKEN",
    "usuario": {
        "id": 1,
        "nome": "Nome",
        "email": "email",
        "tipo": "aluno | coordenador | superadmin"
    }
}

Após login:
localStorage.setItem('access_token', token)
localStorage.setItem('usuario_logado', usuario)
*/


/*
=====================================================
USUARIOS
=====================================================

Rota: /usuarios/
Métodos:
GET /usuarios/
GET /usuarios/{id}/

Observação:
Somente leitura (ReadOnlyModelViewSet)

Retorno:
Lista de usuários do sistema
*/


/*
=====================================================
COORDENADOR
=====================================================

Rota: /coordenador/

Métodos:
GET /coordenador/
GET /coordenador/{id}/
POST /coordenador/
PUT /coordenador/{id}/
PATCH /coordenador/{id}/
DELETE /coordenador/{id}/

POST:
{
    "nome": "Nome",
    "email": "email",
    "senha": "123456",
    "telefone": "81999999999" // opcional
}

PUT/PATCH:
{
    "nome": "Novo nome",
    "email": "novo@email.com",
    "status": true
}

Retorno:
{
    "id": 13,
    "nome": "Nome",
    "email": "email",
    "status": true
}
*/


/*
=====================================================
ALUNO
=====================================================

Rota: /aluno/

Métodos:
GET /aluno/
GET /aluno/{id}/
POST /aluno/
PUT /aluno/{id}/
PATCH /aluno/{id}/
DELETE /aluno/{id}/

IMPORTANTE:
Requer autenticação

Header:
Authorization: Bearer TOKEN

Exemplo GET:
fetch(url, {
    method: 'GET',
    headers: {
        Authorization: `Bearer ${token}`
    }
})

Resposta:
[
    {
        "id": 1,
        "nome": "João",
        "email": "email",
        "total_horas": "10.00",
        "matricula": "2023001",
        "cursos": [
            {
                "curso": "ADS",
                "status": "ATIVO"
            }
        ]
    }
]

POST:
{
    "nome": "Nome",
    "email": "email",
    "senha": "123456",
    "matricula": "2023001"
}

PUT/PATCH:
{
    "nome": "Novo nome",
    "email": "novo@email.com",
    "matricula": "2023002"
}
*/


/*
=====================================================
SUPERADMIN
=====================================================

Rota: /superadmin/

Métodos:
GET /superadmin/
GET /superadmin/{id}/

IMPORTANTE:
Requer autenticação

Header:
Authorization: Bearer TOKEN

Observação:
Somente leitura

Retorno:
{
    "id": 17,
    "nome": "Admin",
    "email": "email"
}
*/