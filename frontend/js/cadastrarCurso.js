const form = document.getElementById("form-curso");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

async function carregarCurso(id) {
  try {
    const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.curso}${id}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao carregar curso");
    }

    const curso = await response.json();

    document.getElementById("nome").value = curso.nome || "";
    document.getElementById("codigo").value = curso.codigo || "";
    document.getElementById("cargaHoraria").value = curso.cargaHoraria || curso.carga_horaria || curso.carga_horaria_minima || "";
    document.getElementById("descricao").value = curso.descricao || "";

    if (curso.status === true || curso.status === "Ativo" || curso.status === "ativo") {
      document.getElementById("ativo").checked = true;
    } else {
      document.getElementById("inativo").checked = true;
    }
  } catch (error) {
    console.error("Erro ao carregar curso:", error);
    alert("Erro ao carregar curso.");
  }
}

if (id) {
  carregarCurso(id);
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value;
  const codigo = document.getElementById("codigo").value;
  const cargaHoraria = document.getElementById("cargaHoraria").value;
  const descricao = document.getElementById("descricao").value;
  const statusSelecionado = document.querySelector('input[name="status"]:checked')?.value;

  const payload = {
    nome: nome,
    codigo: codigo,
    carga_horaria_minima: Number(cargaHoraria),
    descricao: descricao,
    status: statusSelecionado === "ativo"
  };

  const url = id
    ? `${API_BASE_URL}${CONFIG.ENDPOINTS.curso}${id}/`
    : `${API_BASE_URL}${CONFIG.ENDPOINTS.curso}`;

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

    if (response.ok) {
      alert("Curso salvo com sucesso!");
      window.location.href = "cursos.html";
    } else {
      const erro = await response.text();
      console.error("Erro ao salvar curso:", erro);
      alert("Erro ao salvar curso.");
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão com o servidor.");
  }
});



function logout() {
    // Limpar dados de sessão
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para a página de login
    window.location.href = "login.html";
}

function toggleMenu() {
  document.querySelector('.sidebar').classList.toggle('active');
}