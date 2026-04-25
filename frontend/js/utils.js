async function fazerRequisicao(url, metodo = 'GET', dados = null) {
    const opcoes = {
        method: metodo
    };

    if (dados) {
        opcoes.headers = {
            'Content-Type': 'application/json'
        };
        opcoes.body = JSON.stringify(dados);
    }

    const resposta = await fetch(url, opcoes);

    let conteudo;
    try {
        conteudo = await resposta.json();
    } catch {
        conteudo = { mensagem: 'Resposta sem JSON' };
    }

    return {
        ok: resposta.ok,
        status: resposta.status,
        dados: conteudo
    };
}

function toggleMenu() {
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.toggle("active");
    }
}

function protegerPagina() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }
}