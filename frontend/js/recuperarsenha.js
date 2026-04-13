document.querySelector('.btn-login').onclick = function() {
    window.location.href = 'login.html';
};

//montar URL
function montarURL(endpoint) {
    return CONFIG.BASE_URL.replace(/\/$/, '') + endpoint;
}

//  pegar token
function getToken() {
    return localStorage.getItem('access_token');
}

document.getElementById('recuperarForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) {
        alert('Digite seu email!');
        return;
    }

    const dados = { email };

    // USANDO PADRÃO
    const url = CONFIG.BASE_URL.replace(/\/$/, '') + CONFIG.ENDPOINTS.recuperarsenha;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        console.log('Resposta API:', resultado);

        if (response.ok) {
            //  BACKEND FUNCIONOU
            localStorage.setItem('email_recuperacao', email);

            if (resultado.token) {
                localStorage.setItem('token_recuperacao', resultado.token);
            }

            alert(resultado.mensagem || 'Email enviado com sucesso!');
        } else {
            //  API respondeu com erro
            localStorage.setItem('email_recuperacao', email);

            alert(resultado.erro || 'Erro na API, mas email salvo localmente.');
        }

    } catch (error) {
        //  SEM BACKEND / ERRO DE CONEXÃO
        console.error('Erro:', error);

        localStorage.setItem('email_recuperacao', email);

        alert(' No momento sem conexão com servidor, mas salvamos localmente');
    }
});