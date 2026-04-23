function getUrl(endpoint) {
  return CONFIG.BASE_URL + CONFIG.ENDPOINTS[endpoint];
}


async function carregarDashboard() {
  try {
    const [
      cursosRes,
      coordenadoresRes,
      alunosRes,
      solicitacoesRes
    ] = await Promise.all([
      fetch(getUrl("curso")),
      fetch(getUrl("coordenadores")),
      fetch(getUrl("alunos")),
      fetch(getUrl("submissao"))
    ]);

    const cursos = await cursosRes.json();
    const coordenadores = await coordenadoresRes.json();
    const alunos = await alunosRes.json();
    const solicitacoes = await solicitacoesRes.json();

    // 👉 aqui depende de como tua API retorna
    document.getElementById("numCursos").textContent = cursos.length || cursos.data?.length || 0;
    document.getElementById("numCoordenadores").textContent = coordenadores.length || coordenadores.data?.length || 0;
    document.getElementById("numAlunos").textContent = alunos.length || alunos.data?.length || 0;
    document.getElementById("numSolicitacoes").textContent = solicitacoes.length || solicitacoes.data?.length || 0;

  } catch (erro) {
    console.error("Erro ao carregar dashboard:", erro);
  }
}

carregarDashboard();


const ctx2 = document.getElementById('meuGrafico2');

new Chart(ctx2, {
  type: 'bar',
  data: {
    labels: ['Aprovados', 'Pendentes', 'Reprovados'],
    datasets: [{
      label: 'Quantidade',
      data: [10, 5, 2],
      backgroundColor: ['#6893FF', '#1A3FBA', '#6B7FC4']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  }
});

const ctx = document.getElementById('meuGrafico');

new Chart(ctx, {
  type: 'doughnut',
  data: {
    labels: ['Aprovados', 'Pendentes', 'Reprovados'],
    datasets: [{
      data: [10, 5, 2],
      backgroundColor: ['#6893FF', '#1A3FBA', '#6B7FC4'],
      borderWidth: 0
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    },
    cutout: '60%'
  }
});


    
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

menuToggle.addEventListener('click', function() {
  sidebar.classList.toggle('small');
  
  if (sidebar.classList.contains('small')) {
    menuToggle.innerHTML = '☰';
  } else {
    menuToggle.innerHTML = '✕';
  }
});

function logout() {
    // Limpar dados de sessão
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para a página de login
    window.location.href = "login.html";
}

function logout() {
    // Limpar dados de sessão
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para a página de login
    window.location.href = "login.html";
}