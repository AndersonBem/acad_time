# 📚 AcadTime

Sistema web para gerenciamento de Atividades Complementares em instituições de ensino, permitindo o envio, validação e acompanhamento de submissões por alunos, coordenadores e administradores.

## 🚀 Tecnologias Utilizadas

- **Backend:** Django + Django REST Framework
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT customizado
- **Armazenamento de arquivos:** AWS S3
- **Documentação:** Swagger / drf-yasg
- **Deploy:** Render
- **Frontend:** HTML, CSS e JavaScript

---

## 🎯 Objetivo

O AcadTime foi desenvolvido para facilitar o controle de atividades complementares acadêmicas, centralizando o envio de certificados, a análise das submissões e o acompanhamento da carga horária validada pelos alunos.

O sistema busca reduzir processos manuais, melhorar a organização das informações e oferecer mais segurança no controle das atividades complementares.

---

## 👥 Perfis de Usuário

### Coordenador

- Visualiza submissões dos cursos sob sua responsabilidade
- Avalia atividades enviadas pelos alunos
- Aprova ou rejeita submissões

### SuperAdmin

- Gerencia usuários
- Gerencia cursos
- Gerencia tipos de atividades
- Gerencia regras de carga horária
- Acompanha logs e auditorias do sistema

---

## ⚙️ Funcionalidades

- Autenticação com JWT
- Controle de permissões por tipo de usuário
- Cadastro e gerenciamento de alunos, coordenadores e administradores
- Cadastro de cursos
- Cadastro de tipos de atividades complementares
- Definição de regras por curso e tipo de atividade
- Envio de submissões com certificado
- Upload de arquivos PDF ou imagem
- Armazenamento de certificados na AWS S3
- Avaliação de submissões por coordenadores
- Status de submissão, como pendente, aprovado e rejeitado
- Sistema de auditoria com registro de ações importantes
- Notificações por e-mail
- Recuperação e redefinição de senha
- Documentação da API com Swagger

---

## 🗂️ Estrutura Geral do Projeto

```text
acad_time/
│
├── backend/
│   ├── apps/
│   ├── core/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── pages/
│   ├── css/
│   ├── js/
│   └── assets/
│
└── README.md
```

> A estrutura pode variar conforme a organização final do repositório.

---

## 🔐 Autenticação

O sistema utiliza autenticação baseada em JWT. Após o login, o usuário recebe um token de acesso que deve ser enviado nas requisições protegidas.

### Exemplo de login

```http
POST /login/
```

### Exemplo de resposta

```json
{
  "mensagem": "Login realizado com sucesso.",
  "access": "token_jwt",
  "usuario": {
    "id": 1,
    "nome": "Usuário Teste",
    "email": "usuario@email.com",
    "tipo": "aluno"
  }
}
```

---

## 📤 Submissão de Atividades

O aluno pode enviar uma atividade complementar informando os dados da atividade e anexando o certificado correspondente.

```http
POST /submissao/
```

A submissão é criada inicialmente com status **PENDENTE**, aguardando análise de um coordenador responsável pelo curso.

---

## 📊 Auditoria

O sistema possui controle de auditoria para registrar ações relevantes, como criação e alteração de dados importantes.

Esse recurso ajuda a manter rastreabilidade das operações realizadas no sistema, permitindo maior controle e segurança.

---

## 📧 Notificações por E-mail

O AcadTime possui recursos de envio de e-mails para apoiar fluxos importantes, como:

- Recuperação de senha
- Redefinição de senha
- Notificações relacionadas às submissões

---

## 📘 Documentação da API

A API possui documentação com Swagger, facilitando o teste dos endpoints e a compreensão das rotas disponíveis.

```http
/swagger/
```

---

## 🧪 Como Rodar Localmente

### 1. Clone o repositório

```bash
git clone https://github.com/AndersonBem/acad_time.git
cd acad_time
```

### 2. Crie e ative um ambiente virtual

```bash
python -m venv venv
```

No Windows:

```bash
venv\Scripts\activate
```

No Linux/Mac:

```bash
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` com as configurações necessárias, como:

```env
DEBUG=True
SECRET_KEY=sua_chave_secreta
DATABASE_URL=sua_url_do_banco
AWS_ACCESS_KEY_ID=sua_chave_aws
AWS_SECRET_ACCESS_KEY=sua_secret_aws
AWS_STORAGE_BUCKET_NAME=nome_do_bucket
```

### 5. Execute o servidor

```bash
python manage.py runserver
```

---

## 🐳 Deploy

O projeto foi preparado para deploy em ambiente web, utilizando serviços como Render para o backend e banco PostgreSQL externo.

Também foram utilizadas variáveis de ambiente para proteger dados sensíveis, como credenciais do banco, chave secreta do Django e credenciais da AWS.

---


## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.
