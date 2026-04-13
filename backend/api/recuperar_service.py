import secrets
from datetime import timedelta

from django.core.mail import send_mail
from django.utils import timezone

from api.models import Usuario, RecuperacaoSenha


class RecuperacaoSenhaService:
    @staticmethod
    def solicitar_recuperacao(email):
        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return

        token = secrets.token_urlsafe(32)
        expira_em = timezone.now() + timedelta(hours=1)

        RecuperacaoSenha.objects.create(
            usuario=usuario,
            token=token,
            expira_em=expira_em,
            usado=False,
            data_criacao=timezone.now()
        )

        link = f'http://127.0.0.1:5500/frontend/pages/redefinirsenha.html?token={token}'

        assunto = 'AcadTime - Recuperação de senha'
        corpo = (
            f'Olá, {usuario.nome}.\n\n'
            f'Recebemos uma solicitação para redefinir sua senha.\n\n'
            f'Acesse o link abaixo para continuar:\n'
            f'{link}\n\n'
            f'Esse link expira em 1 hora.\n\n'
            f'Se você não solicitou isso, ignore este e-mail.'
        )

        send_mail(
            subject=assunto,
            message=corpo,
            from_email=None,
            recipient_list=[usuario.email],
            fail_silently=False
        )