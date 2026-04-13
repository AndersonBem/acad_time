document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

  
    if (!email || !senha) {
        alert('Preencha todos os campos!');
        return;
    }

    const dados = {
        email: email,
        senha: senha
    };

    const url = CONFIG.BASE_URL.replace(/\/$/, '') + CONFIG.ENDPOINTS.login;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        console.log('Resposta da API:', resultado);

        if (response.ok) {
            const token = resultado.access;
            const usuario = resultado.usuario;

            if (token) {
                localStorage.setItem('access_token', token);
            }

            if (usuario) {
                localStorage.setItem('usuario_logado', JSON.stringify(usuario));
            }

            alert(resultado.mensagem || 'Login realizado com sucesso.');
            window.location.href = '../pages/alunos.html';
        } else {
            alert(resultado.erro || 'Email ou senha inválidos.');
        }

    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Não foi possível conectar ao servidor.');
    }
});
