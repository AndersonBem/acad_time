async function fazerRequisicao(url, metodo = 'GET', dados = null) {
    const opcoes = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (dados) {
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