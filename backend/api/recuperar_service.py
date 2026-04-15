import secrets
import threading
from datetime import timedelta
from django.conf import settings

from django.core.mail import send_mail
from django.utils import timezone

from api.models import Usuario, RecuperacaoSenha

def enviar_email_recuperacao_async(assunto, corpo, destinatario):
    try:
        send_mail(
            subject=assunto,
            message=corpo,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[destinatario],
            fail_silently=False
        )
        print(f'E-mail de recuperação enviado para {destinatario}')
    except Exception as e:
        print(f'Erro ao enviar e-mail de recuperação: {e}')

class RecuperacaoSenhaService:
    @staticmethod
    def solicitar_recuperacao(email):
        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return

        RecuperacaoSenha.objects.filter(
            usuario=usuario,
            usado=False
        ).update(usado=True)

        token = secrets.token_urlsafe(32)
        expira_em = timezone.now() + timedelta(hours=1)

        RecuperacaoSenha.objects.create(
            usuario=usuario,
            token=token,
            expira_em=expira_em,
            usado=False,
            data_criacao=timezone.now()
        )

        link = f'{settings.FRONTEND_URL}/pages/redefinirsenha.html?token={token}'

        assunto = 'AcadTime - Recuperação de senha'
        corpo = (
            f'Olá, {usuario.nome}.\n\n'
            f'Recebemos uma solicitação para redefinir sua senha.\n\n'
            f'Acesse o link abaixo para continuar:\n'
            f'{link}\n\n'
            f'Esse link expira em 1 hora.\n\n'
            f'Se você não solicitou isso, ignore este e-mail.'
        )

        threading.Thread(
            target=enviar_email_recuperacao_async,
            args=(assunto, corpo, usuario.email),
            daemon=True
        ).start()