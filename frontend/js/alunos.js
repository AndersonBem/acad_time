async function listarAlunos() {
    const container = document.getElementById('lista-alunos');
    container.innerHTML = '';

    const token = localStorage.getItem('access_token');
    const url = CONFIG.BASE_URL.replace(/\/$/, '') + CONFIG.ENDPOINTS.alunos;

    try {
        const headers = token
            ? { 'Authorization': `Bearer ${token}` }
            : {};

        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        const alunos = await response.json().catch(() => null);

        if (!response.ok) {
            container.innerHTML = `
                <tr>
                    <td colspan="4">Erro ao carregar alunos.</td>
                </tr>
            `;
            return;
        }

        if (!Array.isArray(alunos) || alunos.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="4">Nenhum aluno encontrado.</td>
                </tr>
            `;
            return;
        }

        alunos.forEach((aluno) => {
            const tr = document.createElement('tr');

            const cursosTexto = Array.isArray(aluno.cursos) && aluno.cursos.length
                ? aluno.cursos.map(item => item.curso).join(', ')
                : 'Sem curso';

            const statusTexto = Array.isArray(aluno.cursos) && aluno.cursos.length
                ? aluno.cursos.map(item => item.status).join(', ')
                : 'Sem status';

            tr.innerHTML = `
                <td>${aluno.nome ?? '-'}</td>
                <td>${statusTexto}</td>
                <td>${cursosTexto}</td>
                <td>
                    <button onclick="editarAluno(${aluno.id})">Editar</button>
                </td>
            `;

            container.appendChild(tr);
        });

    } catch (error) {
        container.innerHTML = `
            <tr>
                <td colspan="4">Não foi possível conectar ao servidor.</td>
            </tr>
        `;
    }
}

function editarAluno(id) {
    window.location.href = `cadastrarAluno.html?id=${id}`;
}

listarAlunos();