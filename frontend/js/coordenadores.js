const coordenadores = [
    {
        id: 1,
        nome: "João Silva",
        email: "joao.silva@acadtime.com",
        curso: "Engenharia de Software",
        status: "Ativo"
    },
    {
        id: 2,
        nome: "Maria Oliveira",
        email: "maria.oliveira@acadtime.com",
        curso: "Design de Interface",
        status: "Ativo"
    }
];

function  listarCoordenadores() {
    const container = document.getElementById("lista-coordenadores");
    container.innerHTML = "";

    coordenadores.forEach(coordenador => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${coordenador.nome}</td>
            <td>${coordenador.email}</td>
            <td>${coordenador.curso}</td>
            <td>${coordenador.status}</td>
            <td>
                <button onclick="editarCoordenador(${coordenador.id})">Editar</button>
                <button onclick="excluirCoordenador(${coordenador.id})">Excluir</button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function editarCoordenador(id) {
    window.location.href = `editarCoordenador.html?id=${id}`;   
}

listarCoordenadores();