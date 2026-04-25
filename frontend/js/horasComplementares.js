protegerPagina();
const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("access_token");

let cursosCarregados = [];
let regrasCarregadas = [];
let tiposAtividadeCarregados = [];

function normalizarTexto(texto) {
	return (texto || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLowerCase();
}

async function carregarCursos() {
	const selectCurso = document.getElementById("curso");

	const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.curso}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		const erro = await response.text();
		console.error("Erro ao carregar cursos:", erro);
		alert("Erro ao carregar cursos.");
		return;
	}

	cursosCarregados = await response.json();

	selectCurso.innerHTML = `<option value="">Selecione um curso</option>`;

	cursosCarregados.forEach((curso) => {
		const option = document.createElement("option");
		option.value = curso.id_curso || curso.id;
		option.textContent = curso.nome;
		selectCurso.appendChild(option);
	});
}

async function carregarTiposAtividade() {
	const response = await fetch(
		`${API_BASE_URL}${CONFIG.ENDPOINTS.tipoAtividade}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	if (!response.ok) {
		const erro = await response.text();
		console.error("Erro ao carregar tipos de atividade:", erro);
		alert("Erro ao carregar tipos de atividade.");
		return;
	}

	tiposAtividadeCarregados = await response.json();
}

async function carregarRegras() {
	const response = await fetch(
		`${API_BASE_URL}${CONFIG.ENDPOINTS.regraAtividade}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	if (!response.ok) {
		const erro = await response.text();
		console.error("Erro ao carregar regras:", erro);
		alert("Erro ao carregar regras.");
		return;
	}

	regrasCarregadas = await response.json();
}

function atualizarCargaMinima() {
	const cursoIdSelecionado = Number(document.getElementById("curso").value);
	const inputCargaMinima = document.getElementById("cargaMinima");

	const cursoSelecionado = cursosCarregados.find(
		(curso) => Number(curso.id_curso || curso.id) === cursoIdSelecionado,
	);

	inputCargaMinima.value = cursoSelecionado
		? cursoSelecionado.carga_horaria_minima || ""
		: "";
}

function limparCamposRegras() {
	document.querySelectorAll(".linha-regra").forEach((linha) => {
		const inputLimite = linha.querySelector(".limite input");
		const textareaRegra = linha.querySelector(".regra textarea");
		const checkboxComprovante = linha.querySelector(
			'.comprovante input[type="checkbox"]',
		);
		const checkboxStatus = linha.querySelector(
			'.status input[type="checkbox"]',
		);

		if (inputLimite) inputLimite.value = 0;
		if (textareaRegra) textareaRegra.value = "";
		if (checkboxComprovante) checkboxComprovante.checked = false;
		if (checkboxStatus) checkboxStatus.checked = false;
	});
}

function preencherCamposRegras() {
	const cursoIdSelecionado = Number(document.getElementById("curso").value);

	limparCamposRegras();

	if (!cursoIdSelecionado) {
		validarSomaHoras();
		return;
	}

	const regrasCurso = regrasCarregadas.filter(
		(regra) => Number(regra.curso) === cursoIdSelecionado,
	);

	regrasCurso.forEach((regra) => {
		const tipoNome = (regra.tipo_atividade_nome || "").trim();
		const linha = document.querySelector(
			`.linha-regra[data-tipo="${tipoNome}"]`,
		);

		if (!linha) return;

		const inputLimite = linha.querySelector(".limite input");
		const textareaRegra = linha.querySelector(".regra textarea");
		const checkboxComprovante = linha.querySelector(
			'.comprovante input[type="checkbox"]',
		);
		const checkboxStatus = linha.querySelector(
			'.status input[type="checkbox"]',
		);

		if (inputLimite) inputLimite.value = regra.limite_horas || 0;
		if (textareaRegra) textareaRegra.value = regra.regra_validacao || "";
		if (checkboxComprovante)
			checkboxComprovante.checked = regra.exige_comprovante === true;
		if (checkboxStatus) checkboxStatus.checked = Number(regra.limite_horas) > 0;
	});

	validarSomaHoras();
}

function calcularSomaHorasAtivas() {
	const linhas = document.querySelectorAll(".linha-regra");
	let soma = 0;

	linhas.forEach((linha) => {
		const checkboxStatus = linha.querySelector(
			'.status input[type="checkbox"]',
		);
		const inputLimite = linha.querySelector(".limite input");

		if (checkboxStatus && checkboxStatus.checked && inputLimite) {
			soma += Number(inputLimite.value) || 0;
		}
	});

	return soma;
}

function validarSomaHoras() {
	const cargaMinima = Number(document.getElementById("cargaMinima").value) || 0;
	const somaHoras = calcularSomaHorasAtivas();
	const botaoSalvar = document.getElementById("btnSalvarRegras");

	if (somaHoras === cargaMinima && cargaMinima > 0) {
		botaoSalvar.disabled = false;
		botaoSalvar.style.opacity = "1";
		botaoSalvar.style.cursor = "pointer";
	} else {
		botaoSalvar.disabled = true;
		botaoSalvar.style.opacity = "0.6";
		botaoSalvar.style.cursor = "not-allowed";
	}
}

function configurarValidacaoHoras() {
	const inputsLimite = document.querySelectorAll(".limite input");
	const checkboxesStatus = document.querySelectorAll(
		'.status input[type="checkbox"]',
	);
	const inputCargaMinima = document.getElementById("cargaMinima");

	inputsLimite.forEach((input) => {
		input.addEventListener("input", validarSomaHoras);
	});

	checkboxesStatus.forEach((checkbox) => {
		checkbox.addEventListener("change", validarSomaHoras);
	});

	inputCargaMinima.addEventListener("input", validarSomaHoras);

	validarSomaHoras();
}

function obterPayloadLinha(linha, cursoId, tipoAtividadeId) {
	const inputLimite = linha.querySelector(".limite input");
	const textareaRegra = linha.querySelector(".regra textarea");
	const checkboxComprovante = linha.querySelector(
		'.comprovante input[type="checkbox"]',
	);
	const checkboxStatus = linha.querySelector('.status input[type="checkbox"]');

	const horasDigitadas = Number(inputLimite.value) || 0;

	return {
		tipo_atividade: tipoAtividadeId,
		curso: cursoId,
		limite_horas: checkboxStatus.checked ? horasDigitadas : 0,
		regra_validacao: textareaRegra.value.trim(),
		exige_comprovante: checkboxComprovante.checked,
	};
}

async function salvarRegras() {
	const cursoId = Number(document.getElementById("curso").value);
	const cargaMinima = Number(document.getElementById("cargaMinima").value) || 0;
	const somaHoras = calcularSomaHorasAtivas();

	if (!cursoId) {
		alert("Selecione um curso.");
		return;
	}

	if (somaHoras !== cargaMinima) {
		alert(
			`A soma dos limites ativos (${somaHoras}h) deve ser igual à carga horária mínima do curso (${cargaMinima}h).`,
		);
		return;
	}

	const linhas = document.querySelectorAll(".linha-regra");

	for (const linha of linhas) {
		const tipoNome = linha.dataset.tipo;

		const regraExistente = regrasCarregadas.find(
			(regra) =>
				Number(regra.curso) === cursoId &&
				normalizarTexto(regra.tipo_atividade_nome) ===
					normalizarTexto(tipoNome),
		);

		if (regraExistente) {
			const payload = obterPayloadLinha(
				linha,
				cursoId,
				regraExistente.tipo_atividade,
			);

			const response = await fetch(
				`${API_BASE_URL}${CONFIG.ENDPOINTS.regraAtividade}${regraExistente.id}/`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				},
			);

			if (!response.ok) {
				const erro = await response.text();
				console.error("Erro ao atualizar regra:", erro);
				alert("Erro ao salvar regras.");
				return;
			}
		} else {
			const tipoBase = tiposAtividadeCarregados.find(
				(tipo) =>
					normalizarTexto(tipo.nome || tipo.tipo_atividade_nome) ===
					normalizarTexto(tipoNome),
			);

			if (!tipoBase) {
				console.error(`Tipo de atividade não encontrado para ${tipoNome}`);
				alert(`Não foi possível identificar o tipo de atividade ${tipoNome}.`);
				return;
			}

			const payload = obterPayloadLinha(
				linha,
				cursoId,
				tipoBase.id || tipoBase.tipo_atividade || tipoBase.id_tipo_atividade,
			);

			const response = await fetch(
				`${API_BASE_URL}${CONFIG.ENDPOINTS.regraAtividade}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				},
			);

			if (!response.ok) {
				const erro = await response.text();
				console.error("Erro ao criar regra:", erro);
				alert("Erro ao salvar regras.");
				return;
			}
		}
	}

	await carregarRegras();
	preencherCamposRegras();
	alert("Regras salvas com sucesso!");
}

document.getElementById("curso").addEventListener("change", async function () {
	atualizarCargaMinima();
	await carregarRegras();
	preencherCamposRegras();
});

document
	.getElementById("btnSalvarRegras")
	.addEventListener("click", salvarRegras);

async function iniciarTelaHorasComplementares() {
	await carregarCursos();
	await carregarTiposAtividade();
	await carregarRegras();
	configurarValidacaoHoras();
}

iniciarTelaHorasComplementares();

function logout() {
	// Limpar dados de sessão
	localStorage.removeItem("access_token");
	sessionStorage.clear();

	// Redirecionar para a página de login
	window.location.href = "login.html";
}

function toggleMenu() {
	document.querySelector(".sidebar").classList.toggle("active");
}
