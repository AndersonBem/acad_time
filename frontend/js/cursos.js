const token = localStorage.getItem('access_token');

async function listarCursos() {
    const container = document.getElementById("lista-cursos");
    const busca = document.getElementById("buscar").value.toLowerCase();

    try {
        const res = await fetch('https://acad-time.onrender.com/curso/', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        const cursos = await res.json();

        const cursosFiltrados = cursos.filter(curso =>
            curso.nome.toLowerCase().includes(busca)
        );

        container.innerHTML = "";

        cursosFiltrados.forEach((curso) => {
            const tr = document.createElement("tr");

            const cursoId = curso.id || curso.id_curso;
            
            tr.innerHTML = `
                <td>${curso.nome}</td>
                <td>${curso.status ? 'Ativo' : 'Inativo'}</td>
                <td>${curso.coordenador_nome || '-'}</td>
                <td>
                    <button class="btn-editar" onclick="editarCurso(${cursoId})">Editar</button>
                    <button class="btn-excluir" onclick="excluirCurso(${cursoId})">Excluir</button>
                </td>
            `;

            container.appendChild(tr);
        });

    } catch (err) {
        console.error("Erro ao buscar cursos:", err);
    }
}

document.getElementById("buscar").addEventListener("input", listarCursos);

listarCursos();

function editarCurso(id) {
    window.location.href = `cadastrarCurso.html?id=${id}`;
}

async function excluirCurso(id) {
    try {
        await fetch(`https://acad-time.onrender.com/curso/${id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        listarCursos();

    } catch (err) {
        console.error("Erro ao excluir:", err);
    }
}