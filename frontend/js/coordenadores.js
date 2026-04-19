const token = localStorage.getItem("access_token");
const API_BASE_URL = CONFIG.BASE_URL.replace(/\/$/, "");

async function listarCoordenadores() {
    const container = document.getElementById("lista-coordenadores");
    const busca = document.getElementById("buscar").value.toLowerCase().trim();

    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const coordenadores = await response.json();
        coordenadores.sort((a, b) => (a.nome || "").localeCompare((b.nome || ""), "pt-BR"))

        const idsUsados = new Set();

        const coordenadoresFiltrados = coordenadores.filter(coordenador => {
            const id =
                coordenador.id ||
                coordenador.id_coordenador ||
                coordenador.idCoordenador;

            if (idsUsados.has(id)) return false;

            idsUsados.add(id);

            return (
                (coordenador.nome || "").toLowerCase().includes(busca) ||
                (coordenador.email || "").toLowerCase().includes(busca)
            );
        });

        container.innerHTML = "";

        if (coordenadoresFiltrados.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5">Nenhum coordenador encontrado.</td>
                </tr>
            `;
            return;
        }

        coordenadoresFiltrados.forEach((coordenador) => {
            const tr = document.createElement("tr");

            const coordenadorId =
                coordenador.id ||
                coordenador.id_coordenador ||
                coordenador.idCoordenador;

            const statusTexto = coordenador.status ? "Ativo" : "Inativo";

            const cursoTexto =
                Array.isArray(coordenador.cursos) && coordenador.cursos.length
                    ? coordenador.cursos.map(item => item.curso).join(", ")
                    : "-";

            tr.innerHTML = `
                <td>${coordenador.nome || "-"}</td>
                <td>${coordenador.email || "-"}</td>
                <td>${cursoTexto}</td>
                <td>${statusTexto}</td>
                <td>
                    <button class="btn-editar" onclick="editarCoordenador(${coordenadorId})">Editar</button>
                    <button class="btn-excluir" onclick="excluirCoordenador(${coordenadorId})">Excluir</button>
                </td>
            `;

            container.appendChild(tr);
        });

    } catch (error) {
        container.innerHTML = `
            <tr>
                <td colspan="5">Erro ao carregar coordenadores.</td>
            </tr>
        `;
    }
}

function editarCoordenador(id) {
    window.location.href = `cadastrarCoordenador.html?id=${id}`;
}

async function excluirCoordenador(id) {
    const confirmar = confirm("Deseja realmente excluir este coordenador?");
    if (!confirmar) return;

    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.coordenadores}${id}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            alert("Coordenador excluído com sucesso!");
            listarCoordenadores();
        } else {
            alert("Não foi possível excluir o coordenador.");
        }
    } catch (error) {
        alert("Erro ao conectar com o servidor.");
    }
}

document.getElementById("buscar").addEventListener("input", listarCoordenadores);

listarCoordenadores();