/* LOCALSTORAGE TEMPORAIO*/
let cursos = JSON.parse(localStorage.getItem("cursos")) || [];
/* LOCALSTORAGE TEMPORAIO*/

function listarCursos() {
    const container = document.getElementById("lista-cursos");

    container.innerHTML = "";

    cursos.forEach((curso) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${curso.nome}</td>
            <td>${curso.status}</td>
            <td>${curso.coordenador}</td>
            <td>
                <button onclick="editarCurso(${curso.id})">Editar</button>
            </td>
            `;

        container.appendChild(tr);
    });
}


function listarCursos() {
    const container = document.getElementById("lista-cursos");
    const cursos = JSON.parse(localStorage.getItem("cursos")) || [];
    const busca = document.getElementById("buscar").value.toLowerCase();
    const cursosFiltrados = cursos.filter(curso => curso.nome.toLowerCase().includes(busca));

    container.innerHTML = "";

    cursosFiltrados.forEach((curso) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${curso.nome}</td>
            <td>${curso.status}</td>
            <td>${curso.coordenador}</td>
            <td>
                <button class ="btn-editar" onclick="editarCurso(${curso.id})">Editar</button>
                <button class="btn-excluir" onclick="excluirCurso(${curso.id})">Excluir</button>
            </td>
            `;
        container.appendChild(tr);
    });
}

listarCursos();
 document.getElementById("buscar").addEventListener("input", listarCursos);

function editarCurso(id) {
    window.location.href = `cadastrarCurso.html?id=${id}`;
}

function excluirCurso(id) {
    let cursos = JSON.parse(localStorage.getItem("cursos")) || [];
    cursos = cursos.filter(curso => curso.id !== id);
    localStorage.setItem("cursos", JSON.stringify(cursos));
    listarCursos();
}
