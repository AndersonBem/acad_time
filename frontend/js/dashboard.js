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

// ===== CONTROLE DO MENU LATERAL (CORRIGIDO) =====
document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const botaoMenu = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const btnAbrir = document.getElementById('btnAbrirMenu');
    const menuLateral = document.querySelector('.menu-lateral');
    
    // Verifica se os elementos existem
    if (!botaoMenu || !sidebar || !btnAbrir) {
        console.log('Elementos não encontrados');
        return;
    }
    
    // Função para esconder o sidebar
    function esconderSidebar() {
        sidebar.classList.add('escondido');
        botaoMenu.innerHTML = '☰';
        btnAbrir.style.display = 'block';
    }
    
    // Função para mostrar o sidebar
    function mostrarSidebar() {
        sidebar.classList.remove('escondido');
        botaoMenu.innerHTML = '☰';
        btnAbrir.style.display = 'none';
    }
    
    // Função para alternar (abrir/fechar)
    function alternarSidebar() {
        if (sidebar.classList.contains('escondido')) {
            mostrarSidebar();
        } else {
            esconderSidebar();
        }
    }
    
    // Quando clicar no botão dentro do sidebar
    botaoMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        alternarSidebar();
    });
    
    // Quando clicar no botão flutuante
    btnAbrir.addEventListener('click', function(e) {
        e.stopPropagation();
        mostrarSidebar();
    });
    
    // Verificar tamanho da tela
    function verificarTamanhoTela() {
        if (window.innerWidth > 900) {
            mostrarSidebar();
        } else {
            esconderSidebar();
        }
    }
    
    // Fechar menu ao clicar fora (apenas mobile)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 900) {
            if (menuLateral && !menuLateral.contains(e.target) && !btnAbrir.contains(e.target)) {
                if (!sidebar.classList.contains('escondido')) {
                    esconderSidebar();
                }
            }
        }
    });
    
    // Verificar quando redimensionar
    window.addEventListener('resize', verificarTamanhoTela);
    
    // Executar ao carregar
    verificarTamanhoTela();
});
