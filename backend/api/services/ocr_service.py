import re
import pdfplumber


class CertificadoExtracaoService:
    @staticmethod
    def extrair_texto_pdf(arquivo):
        texto = ""

        with pdfplumber.open(arquivo) as pdf:
            for pagina in pdf.pages:
                conteudo = pagina.extract_text()
                if conteudo:
                    texto += conteudo + "\n"

        return texto.strip()

    @staticmethod
    def extrair_dados(texto):
        dados = {
            "carga_horaria": "",
            "data_certificado": "",
            "curso": "",
            "instituicao": "",
            "texto_extraido": texto or ""
        }

        match_carga = re.search(r'(\d+)\s*(horas|hora|h)\b', texto, re.IGNORECASE)
        if match_carga:
            dados["carga_horaria"] = match_carga.group(1)

        match_data = re.search(r'\b\d{2}/\d{2}/\d{4}\b', texto)
        if match_data:
            data_br = match_data.group()
            dia, mes, ano = data_br.split("/")
            dados["data_certificado"] = f"{ano}-{mes}-{dia}"

        return dados