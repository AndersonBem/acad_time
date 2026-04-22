const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

let cursosDisponiveis = [];

function getCoordenadorId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function hojeISO() {
    return new Date().toISOString().split("T")[0];
}

function obterIdCurso(valor) {
    if (valor === null || valor === undefined) return null;

    if (!isNaN(Number(valor))) {
        return Number(valor);
    }

    const cursoEncontrado = cursosDisponiveis.find(curso =>
        (curso.nome || "").trim().toLowerCase() === String(valor).trim().toLowerCase()
    );

    return cursoEncontrado ? Number(cursoEncontrado.id_curso || cursoEncontrado.id) : null;
}

function obterIdVinculo(vinculo) {
    return (
        vinculo.id_coordenacao_curso ||
        vinculo.id ||
        vinculo.id_coordenacao ||
        vinculo.idCoordenacao ||
        vinculo.pk ||
        null
    );
}

function criarLinhaCurso(
    valorSelecionado = "",
    primeiraLinha = false,
    vinculoId = null,
    dataInicio = "",
    dataFim = ""
) {
    const div = document.createElement("div");
    div.className = "linha-curso";

    if (vinculoId) {
        div.dataset.vinculoId = vinculoId;
    }

    const select = document.createElement("select");
    select.className = "curso-select";
    select.innerHTML = `<option value="">Selecione um curso</option>`;

    cursosDisponiveis
        .filter(curso => curso.status === true)
        .forEach(curso => {
            const option = document.createElement("option");
            option.value = curso.id_curso || curso.id;
            option.textContent = curso.nome;

            if (String(option.value) === String(valorSelecionado)) {
                option.selected = true;
            }

            select.appendChild(option);
        });

    const inputInicio = document.createElement("input");
    inputInicio.type = "date";
    inputInicio.className = "data-inicio";
    inputInicio.value = dataInicio || hojeISO();
    inputInicio.readOnly = true;

    const inputFim = document.createElement("input");
    inputFim.type = "date";
    inputFim.className = "data-fim";
    inputFim.value = dataFim || "";

    div.appendChild(select);
    div.appendChild(inputInicio);
    div.appendChild(inputFim);

    if (primeiraLinha) {
        const btnAdd = document.createElement("button");
        btnAdd.type = "button";
        btnAdd.className = "btn-add-curso";
        btnAdd.textContent = "+";
        btnAdd.onclick = adicionarCampoCurso;
        div.appendChild(btnAdd);
    } else {
        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.className = "btn-remover-curso";
        btnRemover.textContent = "-";
        btnRemover.onclick = () => removerLinhaCurso(div);
        div.appendChild(btnRemover);
    }

    return div;
}

function removerLinhaCurso(div) {
    div.remove();
}

async function carregarCursos() {
    const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.curso}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const erro = await response.text();
        console.error("Erro ao carregar cursos:", erro);
        alert("Erro ao carregar cursos.");
        return;
    }

    cursosDisponiveis = await response.json();

    const container = document.getElementById("lista-cursos-coordenador");
    container.innerHTML = "";
    container.appendChild(criarLinhaCurso("", true));
}

function adicionarCampoCurso() {
    const container = document.getElementById("lista-cursos-coordenador");
    container.appendChild(criarLinhaCurso());
}

async function carregarCoordenador() {
    const id = getCoordenadorId();
    if (!id) return;

    const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}${id}/`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const erro = await response.text();
        console.error("Erro ao carregar coordenador:", erro);
        alert("Erro ao carregar coordenador.");
        return;
    }

    const coordenador = await response.json();

    document.getElementById("nome").value = coordenador.nome || "";
    document.getElementById("email").value = coordenador.email || "";

    if (
        coordenador.status === true ||
        coordenador.status === "ATIVO" ||
        coordenador.status === "Ativo"
    ) {
        document.getElementById("ativo").checked = true;
    } else {
        document.getElementById("inativo").checked = true;
    }

    const container = document.getElementById("lista-cursos-coordenador");
    container.innerHTML = "";

    const vinculos = await buscarVinculosCoordenador(id);
    const vinculosAtivos = vinculos.filter(vinculo => !vinculo.data_fim);

    if (Array.isArray(vinculosAtivos) && vinculosAtivos.length > 0) {
        vinculosAtivos.forEach((vinculo, index) => {
            const idCurso = obterIdCurso(
                vinculo.curso ||
                vinculo.curso_id ||
                vinculo.id_curso ||
                vinculo.cursoId ||
                vinculo.nome_curso
            );

            const idVinculo = obterIdVinculo(vinculo);

            container.appendChild(
                criarLinhaCurso(
                    idCurso || "",
                    index === 0,
                    idVinculo,
                    vinculo.data_inicio || hojeISO(),
                    vinculo.data_fim || ""
                )
            );
        });
    } else {
        container.appendChild(criarLinhaCurso("", true));
    }
}

async function buscarVinculosCoordenador(coordenadorId) {
    const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenacaoCurso}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const erro = await response.text();
        console.error("Erro ao buscar vínculos do coordenador:", erro);
        return [];
    }

    const vinculos = await response.json();

    return vinculos.filter(vinculo => {
        const idCoordenador =
            vinculo.coordenador ||
            vinculo.coordenador_id ||
            vinculo.id_coordenador ||
            vinculo.coordenadorId;

        return Number(idCoordenador) === Number(coordenadorId);
    });
}

async function encerrarVinculo(vinculoId, dataFim) {
    const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenacaoCurso}${vinculoId}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            data_fim: dataFim
        })
    });

    if (!response.ok) {
        const erro = await response.text();
        console.error("Erro ao encerrar vínculo de curso:", erro);
        return false;
    }

    return true;
}

async function criarVinculo(coordenadorId, cursoId) {
    const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenacaoCurso}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            coordenador: Number(coordenadorId),
            curso: Number(cursoId)
        })
    });

    if (!response.ok) {
        const erro = await response.text();
        console.error("Erro ao salvar vínculo coordenador-curso:", erro);
        return false;
    }

    return true;
}

async function salvarVinculosCursos(coordenadorId) {
    const linhas = Array.from(document.querySelectorAll(".linha-curso")).map(linha => {
        const select = linha.querySelector(".curso-select");
        const dataInicio = linha.querySelector(".data-inicio");
        const dataFim = linha.querySelector(".data-fim");

        return {
            vinculoId: linha.dataset.vinculoId ? Number(linha.dataset.vinculoId) : null,
            cursoId: select && select.value ? Number(select.value) : null,
            dataInicio: dataInicio ? dataInicio.value : "",
            dataFim: dataFim ? dataFim.value : ""
        };
    }).filter(item => item.cursoId);

    const vinculosAtuais = await buscarVinculosCoordenador(coordenadorId);
    const vinculosAtivos = vinculosAtuais.filter(vinculo => !vinculo.data_fim);

    const cursosTela = [...new Set(linhas.map(linha => Number(linha.cursoId)).filter(Boolean))];

    for (const vinculo of vinculosAtivos) {
        const idVinculo = obterIdVinculo(vinculo);
        const idCurso = obterIdCurso(
            vinculo.curso ||
            vinculo.curso_id ||
            vinculo.id_curso ||
            vinculo.cursoId ||
            vinculo.nome_curso
        );

        if (!idVinculo || !idCurso) continue;

        const linhaCorrespondente = linhas.find(linha => Number(linha.vinculoId) === Number(idVinculo));

        if (!linhaCorrespondente) {
            const sucesso = await encerrarVinculo(idVinculo, hojeISO());
            if (!sucesso) {
                alert("Erro ao atualizar cursos do coordenador.");
                return false;
            }
            continue;
        }

        if (linhaCorrespondente.dataFim && !vinculo.data_fim) {
            const sucesso = await encerrarVinculo(idVinculo, linhaCorrespondente.dataFim);
            if (!sucesso) {
                alert("Erro ao atualizar cursos do coordenador.");
                return false;
            }
        }
    }

    const cursosAtivosAtuais = vinculosAtivos
        .map(vinculo => obterIdCurso(
            vinculo.curso ||
            vinculo.curso_id ||
            vinculo.id_curso ||
            vinculo.cursoId ||
            vinculo.nome_curso
        ))
        .filter(id => id !== null);

    const cursosNovos = cursosTela.filter(cursoId => !cursosAtivosAtuais.includes(Number(cursoId)));

    for (const cursoId of cursosNovos) {
        const sucesso = await criarVinculo(coordenadorId, cursoId);
        if (!sucesso) {
            alert("Erro ao atualizar cursos do coordenador.");
            return false;
        }
    }

    return true;
}

async function salvarCoordenador() {
    const id = getCoordenadorId();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const statusSelecionado = document.querySelector('input[name="status"]:checked')?.value;

    const payload = {
        nome,
        email,
        status: statusSelecionado === "ativo"
    };

    if (!id || senha !== "") {
        payload.senha = senha;
    }

    const url = id
        ? `${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}${id}/`
        : `${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}`;

    const method = id ? "PATCH" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const erro = await response.text();
            console.error("Erro ao salvar coordenador:", erro);
            alert("Erro ao salvar coordenador.");
            return;
        }

        const coordenadorSalvo = await response.json().catch(() => null);
        const coordenadorId = id || coordenadorSalvo?.id || coordenadorSalvo?.id_coordenador;

        if (!coordenadorId) {
            alert("Coordenador salvo, mas não foi possível identificar o ID para vincular os cursos.");
            return;
        }

        const sucessoCursos = await salvarVinculosCursos(coordenadorId);

        if (!sucessoCursos) {
            return;
        }

        alert("Coordenador salvo com sucesso!");
        window.location.href = "coordenadores.html";
    } catch (error) {
        console.error("Erro ao salvar coordenador:", error);
        alert("Erro ao salvar coordenador.");
    }
}

async function iniciarTelaCoordenador() {
    await carregarCursos();
    await carregarCoordenador();
}

iniciarTelaCoordenador();