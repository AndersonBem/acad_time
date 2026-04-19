const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

function getAlunoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function marcarStatus(status) {
  const statusUpper = (status || "").toUpperCase();

  if (statusUpper === "ATIVO") {
    document.getElementById("ativo").checked = true;
  } else if (statusUpper === "TRANCADO") {
    document.getElementById("trancado").checked = true;
  } else if (statusUpper === "CANCELADO") {
    document.getElementById("cancelado").checked = true;
  } else if (statusUpper === "CONCLUIDO") {
    document.getElementById("concluido").checked = true;
  }
}

function mapearStatusParaId(status) {
  const statusUpper = (status || "").toUpperCase();

  if (statusUpper === "ATIVO") return 1;
  if (statusUpper === "TRANCADO") return 2;
  if (statusUpper === "CANCELADO") return 3;
  if (statusUpper === "CONCLUIDO") return 4;

  return null;
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

async function carregarAluno() {
  const id = getAlunoId();
  if (!id) return;

  const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.alunos}${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const erro = await response.text();
    console.error("Erro ao carregar aluno:", erro);
    alert("Erro ao carregar aluno.");
    return;
  }

  const aluno = await response.json();

  document.getElementById("nome").value = aluno.nome || "";
  document.getElementById("email").value = aluno.email || "";
  document.getElementById("matricula").value = aluno.matricula || "";

  marcarStatus(aluno.cursos?.[0]?.status || "");

  const nomeCursoAluno = aluno.cursos?.[0]?.curso || "";
  const selectCurso = document.getElementById("curso");

  if (nomeCursoAluno) {
    const optionEncontrada = Array.from(selectCurso.options).find(
      option => option.textContent.trim().toLowerCase() === nomeCursoAluno.trim().toLowerCase()
    );

    if (optionEncontrada) {
      selectCurso.value = optionEncontrada.value;
    }
  }
}

async function salvarAluno() {
  const id = getAlunoId();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const matricula = document.getElementById("matricula").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const curso = Number(document.getElementById("curso").value);
  const statusSelecionado = document.querySelector('input[name="status"]:checked')?.value;

  const statusMatriculaId = mapearStatusParaId(statusSelecionado);

  const payloadAluno = {
    nome,
    email,
    matricula
  };

  if (!id || senha !== "") {
    payloadAluno.senha = senha;
  }

  if (!curso) {
    alert("Selecione um curso.");
    return;
  }

  if (!statusMatriculaId) {
    alert("Selecione um status.");
    return;
  }

  const urlAluno = id
    ? `${API_BASE_URL}${CONFIG.ENDPOINTS.alunos}${id}/`
    : `${API_BASE_URL}${CONFIG.ENDPOINTS.alunos}`;

  const methodAluno = id ? "PATCH" : "POST";

  const responseAluno = await fetch(urlAluno, {
    method: methodAluno,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payloadAluno)
  });

  if (!responseAluno.ok) {
    const erro = await responseAluno.text();
    console.error("Erro ao salvar aluno:", erro);
    alert("Erro ao salvar aluno.");
    return;
  }

  const alunoSalvo = await responseAluno.json();
  const alunoId = id || alunoSalvo.id;

  const payloadInscricao = {
    aluno: Number(alunoId),
    curso: curso,
    status_matricula: statusMatriculaId
  };

  const responseInscricao = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.inscricao}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payloadInscricao)
  });

  if (!responseInscricao.ok) {
    const erroInscricao = await responseInscricao.text();
    console.error("Erro ao salvar inscrição:", erroInscricao);
    alert("Aluno salvo, mas houve erro ao vincular curso/status.");
    return;
  }

  alert("Aluno salvo com sucesso!");
  window.location.href = "alunos.html";
}

async function iniciarTelaAluno() {
  await carregarCursos();
  await carregarAluno();
}

iniciarTelaAluno();