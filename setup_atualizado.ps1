Write-Host "=============================================="
Write-Host " Setup Django API + Frontend Separado (PostgreSQL)"
Write-Host "=============================================="

# 1) Criar pastas principais
Write-Host "`n[1/13] Criando estrutura base..."
New-Item -ItemType Directory -Force -Path ".\backend" | Out-Null
New-Item -ItemType Directory -Force -Path ".\frontend" | Out-Null

# =========================
# BACKEND (DJANGO API)
# =========================

Set-Location backend

# 2) Criar ambiente virtual
Write-Host "[2/13] Criando ambiente virtual..."
python -m venv venv

# 3) Ativar ambiente virtual
Write-Host "[3/13] Ativando ambiente virtual..."
& .\venv\Scripts\Activate.ps1

# 4) Atualizar pip
Write-Host "[4/13] Atualizando pip..."
python -m pip install --upgrade pip

# 5) Instalar dependências
Write-Host "[5/13] Instalando dependências..."
pip install django djangorestframework django-cors-headers python-decouple psycopg2-binary

# 6) Criar projeto Django
Write-Host "[6/13] Criando projeto Django..."
django-admin startproject config .

# 7) Criar app api
Write-Host "[7/13] Criando app api..."
python manage.py startapp api

# 8) Gerar requirements.txt
Write-Host "[8/13] Gerando requirements.txt..."
pip freeze > requirements.txt

# 9) Criar arquivo .env
Write-Host "[9/13] Criando arquivo .env..."
$envContent = @"
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

DB_NAME=acad_time
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_HOST=localhost
DB_PORT=5432
"@
Set-Content ".\.env" $envContent

# 10) Configurar settings.py
Write-Host "[10/13] Configurando settings.py..."

$settingsPath = ".\config\settings.py"
$settingsContent = @"
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-temp-key')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = [host.strip() for host in config('ALLOWED_HOSTS', default='127.0.0.1,localhost').split(',')]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='acad_time'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Recife'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://127\\.0\\.0\\.1:\\d+$',
    r'^http://localhost:\\d+$',
]

CORS_ALLOW_CREDENTIALS = True
"@
Set-Content $settingsPath $settingsContent

# 11) Criar urls base e arquivos iniciais do app
Write-Host "[11/13] Criando estrutura inicial da API..."

$apiViewsContent = @"
from rest_framework import viewsets

# Crie aqui seus serializers e viewsets conforme o projeto evoluir.
"@
Set-Content ".\api\views.py" $apiViewsContent

$apiSerializersContent = @"
from rest_framework import serializers

# Crie aqui seus serializers baseados nos models.
"@
Set-Content ".\api\serializers.py" $apiSerializersContent

$apiAdminContent = @"
from django.contrib import admin

# Registre aqui seus models quando necessário.
"@
Set-Content ".\api\admin.py" $apiAdminContent

$apiUrlsContent = @"
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
"@
Set-Content ".\api\urls.py" $apiUrlsContent

$configUrlsContent = @"
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
"@
Set-Content ".\config\urls.py" $configUrlsContent

Set-Location ..

# =========================
# FRONTEND (HTML/CSS/JS)
# =========================

Set-Location frontend

# 12) Criar estrutura frontend
Write-Host "[12/13] Criando estrutura do frontend..."
New-Item -ItemType Directory -Force -Path ".\css" | Out-Null
New-Item -ItemType Directory -Force -Path ".\js" | Out-Null
New-Item -ItemType Directory -Force -Path ".\assets" | Out-Null

$indexContent = @"
<!DOCTYPE html>
<html lang='pt-br'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Frontend Inicial</title>
    <link rel='stylesheet' href='./css/style.css'>
</head>
<body>
    <main class='container'>
        <h1>Frontend separado</h1>
        <p>Estrutura inicial pronta para consumir a API Django.</p>
        <p>Comece criando as telas e integrando com seus endpoints.</p>
    </main>

    <script src='./js/script.js'></script>
</body>
</html>
"@
Set-Content ".\index.html" $indexContent

$styleContent = @"
body {
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
    padding: 40px;
    background: #f5f5f5;
    color: #222;
}

.container {
    max-width: 700px;
    margin: 0 auto;
    background: #fff;
    padding: 24px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
"@
Set-Content ".\css\style.css" $styleContent

$scriptContent = @"
console.log('Frontend inicial carregado.');
"@
Set-Content ".\js\script.js" $scriptContent

Set-Location ..

# 13) README + instruções
Write-Host "[13/13] Criando README.md e instrucoes.txt..."

$readme = @"
# Projeto com backend e frontend separados

## Estrutura

- backend -> projeto Django API
- frontend -> HTML, CSS e JavaScript puro

## Objetivo

Este projeto foi preparado para trabalhar com:

- Django como API
- frontend separado
- PostgreSQL
- consumo da API via fetch
- organização no estilo estudado na Alura

## Observações

- O arquivo `.env` é criado automaticamente dentro de `backend`.
- Antes de rodar o projeto, ajuste as variáveis do banco PostgreSQL no `.env`.
- O banco configurado por padrão no setup é `acad_time`.
- O CORS continua configurado para desenvolvimento local.
"@
Set-Content ".\README.md" $readme

$instrucoes = @"
INSTRUCOES DO PROJETO

1. GITIGNORE
Antes de subir o projeto corretamente no GitHub, gere um .gitignore.
Sugestão:
Python, Django, VisualStudioCode, macOS, Windows

2. ESTRUTURA DO PROJETO
A pasta backend contém a API em Django.
A pasta frontend contém o front separado com HTML, CSS e JavaScript.

3. VENV
Cada integrante precisa criar ou usar a própria venv localmente dentro da pasta backend.

4. ATIVAR A VENV
No PowerShell:
cd backend
.\venv\Scripts\Activate.ps1

5. INSTALAR AS DEPENDENCIAS
Ainda dentro da pasta backend:
pip install -r requirements.txt

6. ARQUIVO .ENV
Dentro da pasta backend existe um arquivo .env.
Esse arquivo precisa ser ajustado antes de rodar o projeto.

Campos principais:
- SECRET_KEY
- DEBUG
- ALLOWED_HOSTS
- DB_NAME
- DB_USER
- DB_PASSWORD
- DB_HOST
- DB_PORT

7. BANCO DE DADOS
O setup já deixa o PostgreSQL preparado para uso com o banco acad_time.
Mas você ainda precisa:
- conferir se o banco foi criado no PostgreSQL
- preencher usuario e senha no .env
- confirmar host e porta corretos

8. SETTINGS
O settings.py já foi preparado para:
- usar PostgreSQL
- ler variáveis do .env
- usar corsheaders no desenvolvimento
- incluir rest_framework e o app api

9. FLUXO DE DESENVOLVIMENTO
A ideia é seguir o fluxo estudado:
- criar models
- registrar no admin se precisar
- criar serializers
- criar viewsets/views
- registrar rotas no router e urls

10. CORS
O CORS continua habilitado para desenvolvimento local.
Isso ajuda quando o frontend estiver rodando separado em outra porta.

11. RODAR O BACKEND
Depois de configurar o .env:
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 7000

12. RODAR O FRONTEND
A pasta frontend pode ser aberta com Live Server no VS Code, ou outra forma de servidor local.

13. PROXIMOS PASSOS RECOMENDADOS
- conferir o .env
- testar conexão com o PostgreSQL
- criar os models do projeto
- criar serializers base
- criar viewsets
- registrar as rotas
"@
Set-Content ".\instrucoes.txt" $instrucoes

Write-Host "`n=============================================="
Write-Host " Setup finalizado com sucesso!"
Write-Host "=============================================="
Write-Host ""
Write-Host "Estrutura criada:"
Write-Host "  backend -> Django API"
Write-Host "  frontend -> HTML/CSS/JS"
Write-Host ""
Write-Host "Proximo passo:"
Write-Host "  Ajustar o arquivo backend/.env antes de rodar o projeto"
