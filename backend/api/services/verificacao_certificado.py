import hashlib
import os

from PIL import Image
import imagehash

from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from api.models import Submissao

LIMITE_RAPIDFUZZ = 85
LIMITE_COSSENO = 70
TAMANHO_MINIMO_TEXTO = 20
LIMITE_DISTANCIA_HASH_VISUAL = 8

def normalizar_texto(texto):
    return ' '.join(str(texto or '').lower().split())

def calcular_hash_arquivo(arquivo):
    arquivo.seek(0)

    sha256 = hashlib.sha256()

    for parte in arquivo.chunks():
        sha256.update(parte)

    arquivo.seek(0)

    return sha256.hexdigest()

def arquivo_eh_imagem(nome_arquivo):
    extensao = os.path.splitext(nome_arquivo or '')[1].lower()

    return extensao in ['.jpg', '.jpeg', '.png']

def calcular_hash_visual(arquivo, nome_arquivo):
    if not arquivo_eh_imagem(nome_arquivo):
        return None

    try:
        arquivo.seek(0)

        imagem = Image.open(arquivo)
        hash_visual = imagehash.phash(imagem)

        arquivo.seek(0)

        return str(hash_visual)
    except Exception:
        arquivo.seek(0)
        return None

def montar_texto_comparacao(submissao):
    certificado = submissao.certificado
    atividade = submissao.atividade_complementar

    partes = [
        certificado.texto_extraido_ocr if certificado else '',
        certificado.curso_ocr if certificado else '',
        certificado.instituicao_ocr if certificado else '',
        certificado.carga_horaria_ocr if certificado else '',
        certificado.data_certificado_ocr if certificado else '',
        atividade.descricao if atividade else '',
        atividade.carga_horaria_solicitada if atividade else '',
        atividade.tipo_atividade.nome if atividade and atividade.tipo_atividade else '',
        submissao.curso.nome if submissao.curso else '', 
    ]

    texto = ' '.join([str(parte) for parte in partes if parte])

    return normalizar_texto(texto)



def calcular_score_cosseno(texto_novo, texto_antigo):

    try:
        textos = [texto_novo, texto_antigo]

        vectorizer = TfidfVectorizer()
        matriz = vectorizer.fit_transform(textos)

        score = cosine_similarity(matriz[0:1], matriz[1:2])[0][0]

        return round(score * 100, 2)
    except ValueError:
        return 0

def comparar_textos(texto_novo, texto_antigo):
    texto_novo = normalizar_texto(texto_novo)
    texto_antigo = normalizar_texto(texto_antigo)

    if len(texto_novo) < TAMANHO_MINIMO_TEXTO or len(texto_antigo) < TAMANHO_MINIMO_TEXTO:
        return {
            'score_rapidfuzz': 0,
            'score_cosseno': 0,
            'suspeito': False,
            'motivo': 'Texto insuficiente para comparacao',
        }
    
    score_rapidfuzz = fuzz.token_sort_ratio(texto_novo, texto_antigo)
    score_cosseno = calcular_score_cosseno(texto_novo, texto_antigo)

    suspeito_rapidfuzz = score_rapidfuzz >= LIMITE_RAPIDFUZZ
    suspeito_cosseno = score_cosseno >= LIMITE_COSSENO
    suspeito = suspeito_rapidfuzz or suspeito_cosseno

    motivos =[]

    if suspeito_rapidfuzz:
        motivos.append('Texto quase identico ao de outro certificado.')

    if suspeito_cosseno:
        motivos.append('Conteudo muito parecido com outro certificado.')

    return {
        'score_rapidfuzz': round(score_rapidfuzz, 2),
        'score_cosseno': score_cosseno,
        'suspeito': suspeito,
        'motivo': ' '.join(motivos) if motivos else 'Nenhuma suspeita encontrada.',
    }


def calcular_distancia_hash_visual(hash_novo, hash_antigo):
    if not hash_novo or not hash_antigo:
        return None
    
    try:
        hash_novo_convertido = imagehash.hex_to_hash(hash_novo)
        hash_antigo_convertido = imagehash.hex_to_hash(hash_antigo)

        return hash_novo_convertido - hash_antigo_convertido
    
    except Exception:
        return None
    
def comparar_hashes(certificado_novo, certificado_antigo):
    suspeitas = []

    if certificado_novo.hash_arquivo and certificado_antigo.hash_arquivo:
        if certificado_novo.hash_arquivo == certificado_antigo.hash_arquivo:
            suspeitas.append({
                'tipo': 'hash_arquivo',
                'motivo': 'Arquivo exatamente igual a outro certificado enviado.',
            })

    distancia_visual = calcular_distancia_hash_visual(
        certificado_novo.hash_visual,
        certificado_antigo.hash_visual
    )

    if distancia_visual is not None and distancia_visual <= LIMITE_DISTANCIA_HASH_VISUAL:
        suspeitas.append({
            'tipo': 'hash_visual',
            'motivo': 'Certificado visualmente parecido com outro arquivo enviado.',
            'distancia_visual': distancia_visual,
        })

    return suspeitas

def verificar_submissao(submissao):
    texto_novo = montar_texto_comparacao(submissao)
    certificado_novo = submissao.certificado

    if not certificado_novo:
        return {
            'submissao_id': submissao.id_submissao,
            'texto_suficiente': False,
            'total_suspeitas': 0,
            'suspeitas': [],
        }

    submissoes_antigas = Submissao.objects.select_related(
        'aluno',
        'aluno__usuario',
        'curso',
        'atividade_complementar',
        'atividade_complementar__tipo_atividade',
        'certificado'
    ).exclude(
        id_submissao=submissao.id_submissao
    ).filter(
        certificado__isnull=False
    )

    suspeitas = []

    for antiga in submissoes_antigas:
        texto_antigo = montar_texto_comparacao(antiga)

        resultado_texto = comparar_textos(texto_novo, texto_antigo)
        suspeitas_hash = comparar_hashes(certificado_novo, antiga.certificado)

        suspeito = resultado_texto['suspeito'] or bool(suspeitas_hash)

        if not suspeito:
            continue

        motivos = []

        if resultado_texto['suspeito']:
            motivos.append(resultado_texto['motivo'])

        if suspeitas_hash:
            motivos.extend([item['motivo'] for item in suspeitas_hash])

        suspeitas.append({
            'certificado_id': antiga.certificado.id_certificado if antiga.certificado else None,
            'certificado_url': antiga.certificado.url_arquivo if antiga.certificado else None,
            'submissao_id': antiga.id_submissao,
            'aluno_id': antiga.aluno.usuario.id_usuario if antiga.aluno else None,
            'aluno_nome': antiga.aluno.usuario.nome if antiga.aluno else None,
            'curso_id': antiga.curso.id_curso if antiga.curso else None,
            'curso_nome': antiga.curso.nome if antiga.curso else None,
            'score_rapidfuzz': resultado_texto['score_rapidfuzz'],
            'score_cosseno': resultado_texto['score_cosseno'],
            'suspeito': True,
            'motivo': ' '.join(motivos),
            'suspeitas_hash': suspeitas_hash,
        })

    suspeitas.sort(
            key=lambda item: (
                1 if item['suspeitas_hash'] else 0,
                max(item['score_rapidfuzz'], item['score_cosseno'])
            ),
        reverse=True
    )

    return {
        'submissao_id': submissao.id_submissao,
        'texto_suficiente': len(texto_novo) >= TAMANHO_MINIMO_TEXTO,
        'total_suspeitas': len(suspeitas),
        'suspeitas': suspeitas,
    }