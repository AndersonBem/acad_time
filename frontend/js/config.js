const CONFIG = {
    BASE_URL: 'https://acad-time.onrender.com',
    //BASE_URL: 'http://127.0.0.1:7000/',
    ENDPOINTS: {
        usuarios: '/usuarios/',
        coordenadores: '/coordenador/',
        alunos: '/aluno/',
        superadmin: '/superadmin/',
        login: '/login/',
        inscricao: '/inscricao/',
        coordenacaoCurso: '/coordenacaoCurso/',
        tipoAtividade: '/tipoAtividade/',
        regraAtividade: '/regraAtividade/',
        statusSubmissao: '/statusSubmissao/',
        atividadeComplementar: '/atividadeComplementar/',
        curso: '/curso/'
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

OBS: está mostrando o curso ao qual ele tem vinculo tbm
   
    {
        "id": 13,
        "nome": "Gabriel Dias",
        "email": "gabriel@email.com",
        "status": true,
        "telefone": "81999999999",
        "cursos": [
            {
                "curso": "ADS"
            }
        ]
    }


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

/*
========================
INSCRIÇÃO (VÍNCULO ALUNO-CURSO)
========================

Endpoint:
GET /inscricao/
GET /inscricao/{id}/
POST /inscricao/
PATCH /inscricao/{id}/

Descrição:
Representa o vínculo entre um aluno e um curso.
Cada aluno só pode ter uma inscrição por curso (não permite duplicidade).

========================
GET /inscricao/
========================
Retorna lista de inscrições.

Resposta:
[
  {
    "id_inscricao": 1,
    "nome_curso": "ADS",
    "nome_aluno": "João Silva",
    "numero_matricula": "2023001",
    "data_inscricao": "2026-04-09",
    "status_matricula": "ATIVO"
  }
]

========================
GET /inscricao/{id}/
========================
Retorna uma inscrição específica.

Resposta:
{
  "id_inscricao": 1,
  "nome_curso": "ADS",
  "nome_aluno": "João Silva",
  "numero_matricula": "2023001",
  "data_inscricao": "2026-04-09",
  "status_matricula": "ATIVO"
}

========================
POST /inscricao/
========================
Cria uma nova inscrição (vínculo aluno-curso).

Body:
{
  "aluno": 1,
  "curso": 2,
  "status_matricula": 1
}

Observações:
- aluno, curso e status_matricula devem ser IDs existentes
- data_inscricao é gerada automaticamente pelo backend
- não permite duplicar inscrição para o mesmo aluno e curso

Possíveis erros:
- aluno ou curso inexistente
- duplicidade (aluno já inscrito no curso)

========================
PATCH /inscricao/{id}/
========================
Atualiza apenas o status da inscrição.

Body:
{
  "status_matricula": 2
}

Observações:
- não permite alterar aluno ou curso
- usado para ações como: trancar, cancelar, ativar

========================
DELETE /inscricao/{id}/
========================
Não permitido.
Retorna erro 405 (Method Not Allowed).

========================
Resumo
========================
Entrada (POST/PATCH):
- usa IDs (aluno, curso, status)

Saída (GET):
- retorna dados amigáveis (nome do aluno, nome do curso, status)
*/

/*
========================
COORDENAÇÃO (VÍNCULO COORDENADOR-CURSO)
========================

Endpoint:
GET /coordenacaoCurso/
GET /coordenacaoCurso/{id}/
POST /coordenacaoCurso/
PATCH /coordenacaoCurso/{id}/

Descrição:
Representa o vínculo entre um coordenador e um curso.
Permite histórico de vínculos (um coordenador pode entrar, sair e voltar ao mesmo curso).

Regra principal:
- NÃO permite mais de um vínculo ativo (data_fim = null) para o mesmo coordenador e curso
- vínculos antigos são preservados (histórico)

========================
GET /coordenacaoCurso/
========================
Retorna lista de vínculos.

Resposta:
[
  {
    "id_coordenacao_curso": 1,
    "curso": 2,
    "nome_curso": "ADS",
    "coordenador": 3,
    "nome_coordenador": "Maria Souza",
    "data_inicio": "2026-04-09",
    "data_fim": null,
    "status": "ativo"
  }
]

========================
GET /coordenacaoCurso/{id}/
========================
Retorna um vínculo específico.

Resposta:
{
  "id_coordenacao_curso": 1,
  "curso": 2,
  "nome_curso": "ADS",
  "coordenador": 3,
  "nome_coordenador": "Maria Souza",
  "data_inicio": "2026-04-09",
  "data_fim": null,
  "status": "ativo"
}

========================
POST /coordenacaoCurso/
========================
Cria um novo vínculo coordenador-curso.

Body:
{
  "coordenador": 3,
  "curso": 2
}

Observações:
- coordenador e curso devem ser IDs existentes
- data_inicio é gerada automaticamente pelo backend
- cria sempre um NOVO vínculo (não reutiliza antigos)
- não permite criar se já existir vínculo ativo para o mesmo coordenador e curso

Possíveis erros:
- coordenador ou curso inexistente
- já existe vínculo ativo para esse coordenador e curso

========================
PATCH /coordenacaoCurso/{id}/
========================
Encerra um vínculo existente.

Body:
{
  "data_fim": "2026-05-01"
}

Observações:
- usado para encerrar vínculo (definir data_fim)
- não permite alterar coordenador ou curso
- data_fim não pode ser anterior à data_inicio
- para reativar, deve ser feito um novo POST (novo vínculo)

========================
DELETE /coordenacaoCurso/{id}/
========================
Não permitido.
Retorna erro 405 (Method Not Allowed).

========================
Resumo
========================
Entrada (POST/PATCH):
- usa IDs (coordenador, curso)
- PATCH usa data_fim para encerrar vínculo

Saída (GET):
- retorna dados amigáveis (nome do coordenador, nome do curso)
- status é calculado automaticamente:
  - "ativo" → data_fim = null
  - "encerrado" → data_fim preenchida
*/

/*
========================
TIPO DE ATIVIDADE
========================

Endpoint:
GET /tipo-atividade/
GET /tipo-atividade/{id}/
POST /tipo-atividade/
PATCH /tipo-atividade/{id}/
DELETE /tipo-atividade/{id}/

Descrição:
Representa os tipos de atividades complementares aceitas no sistema.
Ex: Curso, Palestra, Evento, Monitoria, etc.

========================
GET /tipo-atividade/
========================
Retorna lista de tipos de atividade.

Resposta:
[
  {
    "id": 1,
    "nome": "Curso"
  },
  {
    "id": 2,
    "nome": "Palestra"
  }
]

========================
GET /tipo-atividade/{id}/
========================
Retorna um tipo de atividade específico.

Resposta:
{
  "id": 1,
  "nome": "Curso"
}

========================
POST /tipo-atividade/
========================
Cria um novo tipo de atividade.

Body:
{
  "nome": "Workshop"
}

Observações:
- nome deve ser único
- não permite duplicidade de nomes

Possíveis erros:
- nome já existente

========================
PATCH /tipo-atividade/{id}/
========================
Atualiza o nome do tipo de atividade.

Body:
{
  "nome": "Evento Acadêmico"
}

Observações:
- nome continua sendo único
- não permite duplicidade

========================
DELETE /tipo-atividade/{id}/
========================
Remove o tipo de atividade.

Observações:
- permitido, mas deve-se garantir que não esteja sendo utilizado em regras

========================
Resumo
========================
Entrada (POST/PATCH):
- recebe apenas o campo nome

Saída (GET):
- retorna id e nome do tipo de atividade
*/

/*========================
REGRA DE ATIVIDADE (VÍNCULO CURSO-TIPO DE ATIVIDADE)
========================

Endpoint:
GET /regraAtividade/
GET /regraAtividade/{id}/
POST /regraAtividade/
PATCH /regraAtividade/{id}/
DELETE /regraAtividade/{id}/

Descrição:
Define as regras de atividades complementares para cada curso.
Relaciona um curso a um tipo de atividade, definindo limites e exigências.

Regra principal:
- NÃO permite duplicidade de (curso + tipo_atividade)
- cada combinação curso + tipo de atividade deve ser única

========================
GET /regraAtividade/
========================
Retorna lista de regras.

Resposta:
[
  {
    "id": 1,
    "tipo_atividade": 2,
    "tipo_atividade_nome": "Palestra",
    "curso": 1,
    "curso_nome": "ADS",
    "limite_horas": 40,
    "exige_comprovante": true
  }
]

========================
GET /regraAtividade/{id}/
========================
Retorna uma regra específica.

Resposta:
{
  "id": 1,
  "tipo_atividade": 2,
  "tipo_atividade_nome": "Palestra",
  "curso": 1,
  "curso_nome": "ADS",
  "limite_horas": 40,
  "exige_comprovante": true
}

========================
POST /regraAtividade/
========================
Cria uma nova regra de atividade para um curso.

Body:
{
  "tipo_atividade": 2,
  "curso": 1,
  "limite_horas": 40,
  "exige_comprovante": true
}

Observações:
- tipo_atividade e curso devem ser IDs existentes
- não permite criar regra duplicada para o mesmo curso e tipo de atividade

Possíveis erros:
- tipo_atividade ou curso inexistente
- já existe regra para essa combinação (curso + tipo_atividade)

========================
PATCH /regraAtividade/{id}/
========================
Atualiza uma regra existente.

Body:
{
  "limite_horas": 60,
  "exige_comprovante": false
}

Observações:
- pode alterar qualquer campo
- não permite gerar duplicidade de (curso + tipo_atividade)

========================
DELETE /regraAtividade/{id}/
========================
Remove a regra de atividade.

Observações:
- permitido
- deve-se garantir que não existam dependências futuras (ex: submissões)

========================
Resumo
========================
Entrada (POST/PATCH):
- usa IDs (tipo_atividade, curso)
- define limite_horas e exige_comprovante

Saída (GET):
- retorna dados enriquecidos:
  - nome do tipo de atividade
  - nome do curso

Regra de negócio:
- unicidade baseada em (curso + tipo_atividade)
- id é apenas identificador técnico
*/

/*
========================
STATUS DE SUBMISSÃO
========================

Endpoint:
GET /statusSubmissao/
GET /statusSubmissao/{id}/
POST /statusSubmissao/
PATCH /statusSubmissao/{id}/
DELETE /statusSubmissao/{id}/

Descrição:
Representa os possíveis status de uma submissão de atividade complementar.
Ex: Pendente, Aprovado, Rejeitado.

========================
GET /statusSubmissao/
========================
Retorna lista de status disponíveis.

Resposta:
[
  {
    "id": 1,
    "nome_status": "Pendente"
  },
  {
    "id": 2,
    "nome_status": "Aprovado"
  },
  {
    "id": 3,
    "nome_status": "Rejeitado"
  }
]

========================
GET /statusSubmissao/{id}/
========================
Retorna um status específico.

Resposta:
{
  "id": 1,
  "nome_status": "Pendente"
}

========================
POST /statusSubmissao/
========================
Cria um novo status.

Body:
{
  "nome_status": "Em análise"
}

Observações:
- nome_status deve ser único (recomendado)
- geralmente essa tabela é pré-populada e pouco alterada

Possíveis erros:
- nome duplicado

========================
PATCH /statusSubmissao/{id}/
========================
Atualiza o nome do status.

Body:
{
  "nome_status": "Em revisão"
}

Observações:
- mudanças podem impactar o entendimento do sistema
- deve ser usado com cautela

========================
DELETE /statusSubmissao/{id}/
========================
Remove um status.

Observações:
- permitido, mas NÃO recomendado se já estiver em uso
- pode causar inconsistência em submissões existentes

========================
Resumo
========================
Entrada (POST/PATCH):
- recebe nome_status

Saída (GET):
- retorna id e nome do status

Observação importante:
- essa tabela é usada como referência para o fluxo de submissão
- normalmente contém valores fixos (Pendente, Aprovado, Rejeitado)
- não possui regras complexas de negócio
*/

/*
========================
ATIVIDADE COMPLEMENTAR
========================

Endpoint:
GET /atividadeComplementar/
GET /atividadeComplementar/{id}/
POST /atividadeComplementar/
PATCH /atividadeComplementar/{id}/
DELETE /atividadeComplementar/{id}/

Descrição:
Representa a atividade complementar em si, ou seja, o material/registro acadêmico que poderá ser enviado posteriormente em uma submissão.

Essa entidade NÃO representa o envio para análise.
Ela representa apenas o conteúdo da atividade complementar cadastrada pelo aluno.

Exemplos:
- participação em palestra
- curso realizado
- evento acadêmico
- atividade de extensão

Fluxo no sistema:
- primeiro a atividade complementar é cadastrada
- depois ela pode ser enviada por meio da Submissão
- a análise, aprovação, status, certificado e feedback do coordenador pertencem ao fluxo de Submissão, não à AtividadeComplementar

========================
GET /atividadeComplementar/
========================
Retorna lista de atividades complementares.

Resposta:
[
  {
    "id_atividade_complementar": 1,
    "descricao": "Participação em palestra sobre segurança digital",
    "carga_horaria_solicitada": 10,
    "tipo_atividade": 2,
    "tipo_atividade_nome": "Palestra"
  }
]

========================
GET /atividadeComplementar/{id}/
========================
Retorna uma atividade complementar específica.

Resposta:
{
  "id_atividade_complementar": 1,
  "descricao": "Participação em palestra sobre segurança digital",
  "carga_horaria_solicitada": 10,
  "tipo_atividade": 2,
  "tipo_atividade_nome": "Palestra"
}

========================
POST /atividadeComplementar/
========================
Cria uma nova atividade complementar.

Body:
{
  "descricao": "Participação em palestra sobre segurança digital",
  "carga_horaria_solicitada": 10,
  "tipo_atividade": 2
}

Observações:
- tipo_atividade deve ser um ID existente
- essa entidade representa apenas a atividade em si, não o envio para análise

Possíveis erros:
- tipo_atividade inexistente
- dados obrigatórios ausentes

========================
PATCH /atividadeComplementar/{id}/
========================
Atualiza uma atividade complementar existente.

Body:
{
  "descricao": "Participação em palestra sobre LGPD",
  "carga_horaria_solicitada": 12
}

Observações:
- permite editar livremente os dados da atividade
- não envolve status, aprovação ou análise

========================
DELETE /atividadeComplementar/{id}/
========================
Remove uma atividade complementar.

Observações:
- permitido no estado atual do sistema
- futuramente, caso exista submissão vinculada, pode ser necessário revisar essa regra

========================
Resumo
========================
Entrada (POST/PATCH):
- usa tipo_atividade por ID
- recebe descrição e carga_horaria_solicitada

Saída (GET):
- retorna:
  - id_atividade_complementar
  - descricao
  - carga_horaria_solicitada
  - tipo_atividade
  - tipo_atividade_nome

Regra de negócio:
- AtividadeComplementar representa o item acadêmico entregue pelo aluno
- o envio dessa atividade para análise acontece em Submissão
- status, aprovação, certificado e feedback não pertencem a esta entidade
*/

/*
========================
CURSO
========================

⚠️ Observação importante:
- O endpoint de curso NÃO gerencia vínculos.
- Para vincular:
  - aluno ↔ curso → usar /inscricao/
  - coordenador ↔ curso → usar /coordenacaoCurso/
- Este endpoint é apenas para dados do curso.

Endpoint:
GET /curso/
GET /curso/{id}/
POST /curso/
PATCH /curso/{id}/
DELETE /curso/{id}/

Descrição:
Representa os dados base de um curso.
Não inclui diretamente alunos ou coordenadores vinculados.

========================
GET /curso/
========================
Retorna lista de cursos.

Resposta:
[
  {
    "idCurso": 1,
    "nome": "ADS",
    "codigo": "ADS001",
    "status": true,
    "cargaHoraria": 200,
    "descricao": "Curso de Análise e Desenvolvimento de Sistemas"
  }
]

========================
GET /curso/{id}/
========================
Retorna um curso específico.

Resposta:
{
  "idCurso": 1,
  "nome": "ADS",
  "codigo": "ADS001",
  "status": true,
  "cargaHoraria": 200,
  "descricao": "Curso de Análise e Desenvolvimento de Sistemas"
}

========================
POST /curso/
========================
Cria um novo curso.

Body:
{
  "nome": "ADS",
  "codigo": "ADS001",
  "status": true,
  "cargaHoraria": 200,
  "descricao": "Curso de Análise e Desenvolvimento de Sistemas"
}

Observações:
- Todos os campos seguem o model diretamente
- Não realiza vínculo com alunos ou coordenadores

Possíveis erros:
- campos obrigatórios não informados
- violação de regra de unicidade (se existir no banco)

========================
PATCH /curso/{id}/
========================
Atualiza dados do curso.

Body (exemplo):
{
  "nome": "ADS Atualizado",
  "status": false
}

Observações:
- Permite atualizar qualquer campo do curso
- Não altera vínculos existentes

========================
DELETE /curso/{id}/
========================
Remove um curso.

Observações:
- Pode afetar registros relacionados dependendo do comportamento do banco (CASCADE)

========================
Resumo
========================
Entrada (POST/PATCH):
- usa dados diretos do curso

Saída (GET):
- retorna dados simples do curso

Vínculos:
- aluno ↔ curso → /inscricao/
- coordenador ↔ curso → /coordenacaoCurso/
*/