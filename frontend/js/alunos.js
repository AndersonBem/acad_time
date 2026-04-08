const alunos = [
  { nome: 'João Silva', 
    email: 'joao.silva@example.com',
    status: 'ativo',
    curso: 'Engenharia de Software'
    },
    { nome: 'Maria Santos',
     email: 'maria.santos@example.com',
     status: 'ativo',
     curso: 'Ciência da Computação'
    }
];

function listarAlunos() {
    const container = document.getElementById('lista-alunos');
    container.innerHTML = '';
    alunos.forEach((aluno) => {
        const tr = document.createElement('tr');
    
        tr.innerHTML = `
            <td>${aluno.nome}</td>
            <td>${aluno.email}</td>
            <td>${aluno.status}</td>
            <td>${aluno.curso}</td>
        `;
        container.appendChild(tr);
    });
}

function editarAluno(id) {
    window.location.href = `editarAluno.html?id=${id}`;
}

listarAlunos();