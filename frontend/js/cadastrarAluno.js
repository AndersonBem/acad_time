const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

function getAlunoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function carregarAluno() {
  const id = getAlunoId();
  if (!id) return;

  try {
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
    document.getElementById("curso").value = aluno.cursos?.[0]?.curso || "";

    if (aluno.cursos?.[0]?.status === "ATIVO") {
      document.getElementById("ativo").checked = true;
    } else {
      document.getElementById("inativo").checked = true;
    }
  } catch (error) {
    console.error("Erro ao carregar aluno:", error);
    alert("Erro ao carregar aluno.");
  }
}

async function salvarAluno() {
  const id = getAlunoId();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const statusSelecionado = document.querySelector('input[name="status"]:checked')?.value;

  const payload = {
    nome: nome,
    email: email,
    status: statusSelecionado === "ativo"
  };

  const url = id
    ? `${API_BASE_URL}${CONFIG.ENDPOINTS.alunos}${id}/`
    : `${API_BASE_URL}${CONFIG.ENDPOINTS.alunos}`;

  const method = id ? "PATCH" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const erro = await response.text();
      console.error("Erro ao salvar aluno:", erro);
      alert("Erro ao salvar aluno.");
      return;
    }

    alert("Aluno salvo com sucesso!");
    window.location.href = "alunos.html";
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão com o servidor.");
  }
}

carregarAluno();