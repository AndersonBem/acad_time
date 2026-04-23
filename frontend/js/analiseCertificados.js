const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

let submissaoAtual = null;
let atividadeAtual = null;
let statusDisponiveis = [];
let logsAuditoria = [];

function getSubmissaoId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatarData(data) {
  if (!data) return "-";

  const d = new Date(data);

  if (isNaN(d.getTime())) return data;

  return d.toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "-";

  const d = new Date(data);

  if (isNaN(d.getTime())) return data;

  return d.toLocaleString("pt-BR");
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function obterStatusPorNome(nome) {
  const nomeNormalizado = normalizarTexto(nome);

  return statusDisponiveis.find(status =>
    normalizarTexto(status.nome_status) === nomeNormalizado
  );
}

async function buscarSubmissao(id) {
  const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.submissao}${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao carregar submissão.");
  }

  return await response.json();
}

async function buscarAtividadeComplementar(id) {
  const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.atividadeComplementar}${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao carregar atividade complementar.");
  }

  return await response.json();
}

async function buscarStatusSubmissao() {
  const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.statusSubmissao}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(erro || "Erro ao carregar status de submissão.");
  }

  return await response.json();
}

async function buscarAluno(idAluno) {
  if (!idAluno) return null;

  const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.alunos}${idAluno}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function buscarLogsAuditoria() {
  const response = await fetch(`${API_BASE_URL}/logauditoria/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

function preencherDadosAluno(aluno = null) {
  document.getElementById("alunoNome").textContent =
    submissaoAtual?.aluno_nome || aluno?.nome || "-";

  document.getElementById("alunoEmail").textContent =
    aluno?.email || "-";

  document.getElementById("cursoNome").textContent =
    submissaoAtual?.curso_nome || "-";

  document.getElementById("dataEnvio").textContent =
    formatarData(submissaoAtual?.data_envio);

  document.getElementById("statusSubmissaoAtual").textContent =
    submissaoAtual?.status_submissao_nome || "-";
}

function preencherDadosAtividade() {
  document.getElementById("categoria").value =
    atividadeAtual?.tipo_atividade_nome || "-";

  document.getElementById("descricao").value =
    atividadeAtual?.descricao || "-";

  document.getElementById("carga").value =
    atividadeAtual?.carga_horaria_solicitada != null
      ? `${atividadeAtual.carga_horaria_solicitada}h`
      : "-";

  document.getElementById("atividadeId").value =
    atividadeAtual?.id_atividade_complementar || "-";
}

function preencherArquivo() {
  const nomeArquivo = document.getElementById("arquivoNome");

  if (submissaoAtual?.certificado) {
    nomeArquivo.textContent = `Certificado #${submissaoAtual.certificado}`;
  } else {
    nomeArquivo.textContent = "Nenhum arquivo";
  }
}

function preencherOCR() {
  document.getElementById("ocrNome").textContent =
    submissaoAtual?.aluno_nome || "-";

  document.getElementById("ocrCurso").textContent =
    submissaoAtual?.curso_nome || "-";

  document.getElementById("ocrCarga").textContent =
    atividadeAtual?.carga_horaria_solicitada != null
      ? `${atividadeAtual.carga_horaria_solicitada}h`
      : "-";

  document.getElementById("ocrData").textContent =
    formatarData(submissaoAtual?.data_envio);
}

function preencherObservacao() {
  document.getElementById("observacoes").value =
    submissaoAtual?.observacao_coordenador || "";
}

function preencherSelectStatus() {
  const select = document.getElementById("novoStatus");
  select.innerHTML = `<option value="">Selecione um status</option>`;

  statusDisponiveis
    .sort((a, b) => (a.nome_status || "").localeCompare(b.nome_status || "", "pt-BR"))
    .forEach(status => {
      const option = document.createElement("option");
      option.value = status.id;
      option.textContent = status.nome_status;

      if (Number(status.id) === Number(submissaoAtual?.status_submissao)) {
        option.selected = true;
      }

      select.appendChild(option);
    });
}

function preencherHistorico() {
  const container = document.getElementById("historicoAnalise");
  container.innerHTML = "";

  const logsSubmissao = logsAuditoria.filter(log =>
    String(log.nome_entidade || "").toUpperCase() === "SUBMISSAO" &&
    Number(log.id_entidade_afetada) === Number(submissaoAtual?.id_submissao)
  );

  if (!logsSubmissao.length) {
    container.innerHTML = `
      <div class="item-historico">
        <span class="bolinha"></span>
        <div>
          <strong>-</strong>
          <p>Nenhum histórico disponível</p>
        </div>
      </div>
    `;
    return;
  }

  logsSubmissao
    .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))
    .forEach(log => {
      const item = document.createElement("div");
      item.className = "item-historico";

      item.innerHTML = `
        <span class="bolinha"></span>
        <div>
          <strong>${formatarDataHora(log.data_hora)}</strong>
          <p>${log.descricao || "-"}</p>
        </div>
      `;

      container.appendChild(item);
    });
}

async function atualizarSubmissao(statusId, observacao) {
  const id = getSubmissaoId();

  const payload = {
    status_submissao: Number(statusId),
    observacao_coordenador: observacao
  };

  const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.submissao}${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const erro = await response.text();

    if (response.status === 403) {
      alert("Você não tem permissão para atualizar esta submissão.");
      return false;
    }

    alert(erro || "Não foi possível atualizar a submissão.");
    return false;
  }

  return true;
}

async function salvarAnaliseComStatus(nomeStatus) {
  const status = obterStatusPorNome(nomeStatus);

  if (!status) {
    alert(`Status "${nomeStatus}" não encontrado.`);
    return;
  }

  const observacao = document.getElementById("observacoes").value.trim();
  const sucesso = await atualizarSubmissao(status.id, observacao);

  if (!sucesso) return;

  alert("Submissão atualizada com sucesso!");
  await iniciarTelaAnalise();
}

async function salvarStatusSelecionado() {
  const statusId = document.getElementById("novoStatus").value;
  const observacao = document.getElementById("observacoes").value.trim();

  if (!statusId) {
    alert("Selecione um status.");
    return;
  }

  const sucesso = await atualizarSubmissao(statusId, observacao);

  if (!sucesso) return;

  alert("Submissão atualizada com sucesso!");
  await iniciarTelaAnalise();
}

function configurarBotoes() {
  const btnAprovar = document.getElementById("btnAprovar");
  const btnReprovar = document.getElementById("btnReprovar");
  const btnSolicitarCorrecao = document.getElementById("btnSolicitarCorrecao");
  const btnVisualizarArquivo = document.getElementById("btnVisualizarArquivo");
  const btnBaixarArquivo = document.getElementById("btnBaixarArquivo");
  const selectNovoStatus = document.getElementById("novoStatus");

  btnAprovar.onclick = () => salvarAnaliseComStatus("Aprovado");
  btnReprovar.onclick = () => salvarAnaliseComStatus("Rejeitado");
  btnSolicitarCorrecao.onclick = () => salvarAnaliseComStatus("Correção solicitada");

  selectNovoStatus.onchange = () => {
    if (selectNovoStatus.value) {
      salvarStatusSelecionado();
    }
  };

  btnVisualizarArquivo.onclick = () => {
    if (!submissaoAtual?.certificado) {
      alert("Nenhum arquivo disponível.");
      return;
    }

    alert("A visualização do arquivo depende da URL/endpoint do certificado no backend.");
  };

  btnBaixarArquivo.onclick = () => {
    if (!submissaoAtual?.certificado) {
      alert("Nenhum arquivo disponível.");
      return;
    }

    alert("O download do arquivo depende da URL/endpoint do certificado no backend.");
  };
}

async function iniciarTelaAnalise() {
  const id = getSubmissaoId();

  if (!id) {
    alert("ID da submissão não informado.");
    return;
  }

  try {
    submissaoAtual = await buscarSubmissao(id);
    atividadeAtual = await buscarAtividadeComplementar(submissaoAtual.atividade_complementar);
    statusDisponiveis = await buscarStatusSubmissao();

    const aluno = await buscarAluno(submissaoAtual.aluno);
    logsAuditoria = await buscarLogsAuditoria();

    preencherDadosAluno(aluno);
    preencherDadosAtividade();
    preencherArquivo();
    preencherOCR();
    preencherObservacao();
    preencherSelectStatus();
    preencherHistorico();
    configurarBotoes();
  } catch (error) {
    console.error("Erro ao carregar análise:", error);
    alert("Erro ao carregar os dados da submissão.");
  }
}

iniciarTelaAnalise();



function logout() {
    // Limpar dados de sessão
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para a página de login
    window.location.href = "login.html";
}