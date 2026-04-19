const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

function getCoordenadorId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function carregarCursos() {
    const selectCurso = document.getElementById("curso");

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

    const cursos = await response.json();

    selectCurso.innerHTML = `<option value="">Selecione um curso</option>`;

    cursos
    .filter((curso) => curso.status === true)
    .forEach((curso) => {
        const option = document.createElement("option");
        option.value = curso.id_curso || curso.id;
        option.textContent = curso.nome;
        selectCurso.appendChild(option);
    });
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

    const nomeCursoCoordenador =
        coordenador.curso ||
        coordenador.curso_nome ||
        coordenador.cursos?.[0]?.curso ||
        "";

    const selectCurso = document.getElementById("curso");

    if (nomeCursoCoordenador) {
        const optionEncontrada = Array.from(selectCurso.options).find(
            option => option.textContent.trim().toLowerCase() === nomeCursoCoordenador.trim().toLowerCase()
        );

        if (optionEncontrada) {
            selectCurso.value = optionEncontrada.value;
        }
    }
}

async function salvarCoordenador() {
    const id = getCoordenadorId();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const curso = Number(document.getElementById("curso").value);
    const statusSelecionado = document.querySelector('input[name="status"]:checked')?.value;

    const payloadCoordenador = {
        nome,
        email,
        status: statusSelecionado === "ativo"
    };

    if (!id || senha !== "") {
        payloadCoordenador.senha = senha;
    }

    const urlCoordenador = id
        ? `${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}${id}/`
        : `${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}`;

    const methodCoordenador = id ? "PATCH" : "POST";

    const responseCoordenador = await fetch(urlCoordenador, {
        method: methodCoordenador,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payloadCoordenador)
    });

    if (!responseCoordenador.ok) {
        const erro = await responseCoordenador.text();
        console.error("Erro ao salvar coordenador:", erro);
        alert("Erro ao salvar coordenador.");
        return;
    }

    const coordenadorSalvo = await responseCoordenador.json();
    const coordenadorId = id || coordenadorSalvo.id;

    if (curso) {
        const payloadCoordenacaoCurso = {
            coordenador: Number(coordenadorId),
            curso: Number(curso)
        };

        const responseCoordenacaoCurso = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenacaoCurso}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payloadCoordenacaoCurso)
        });

        if (!responseCoordenacaoCurso.ok) {
            const erro = await responseCoordenacaoCurso.text();
            console.error("Erro ao vincular curso ao coordenador:", erro);
            alert("Coordenador salvo, mas houve erro ao vincular o curso.");
            return;
        }
    }

    alert("Coordenador salvo com sucesso!");
    window.location.href = "coordenadores.html";
}

async function iniciarTelaCoordenador() {
    await carregarCursos();
    await carregarCoordenador();
}

iniciarTelaCoordenador();