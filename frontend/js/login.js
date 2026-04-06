document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    // 🔒 validação básica
    if (!email || !senha) {
        alert('Preencha todos os campos!');
        return;
    }

    const dados = {
        email: email,
        password: senha
    };

    try {
        // aqui vai o backend
        const response = await fetch('', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        // converter resposta
        const resultado = await response.json();

        //  resposta da API
        console.log('Resposta da API:', resultado);

        if (response.ok) {

            // token
            const token = resultado.token;

            //  salvar no local Storege
            if (token) {
                localStorage.setItem('token', token);
                console.log('Token salvo com sucesso!');
            } else {
                console.warn('Token não veio na resposta!');
            }

            alert('Login realizado com sucesso!');

            //  deixa preparado pro futuro
            // window.location.href = '/dashboard.html';

        } else {
            alert('Erro ao logar: ' + (resultado.message || 'Credenciais inválidas'));
        }

    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Não foi possível conectar ao servidor.');
    }
});