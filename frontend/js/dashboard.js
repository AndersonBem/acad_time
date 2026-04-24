// GRÁFICO 1 - DONUT
const ctx1 = document.getElementById('grafico1');

new Chart(ctx1, {
    type: 'doughnut',
    data: {
        labels: ['Aprovados', 'Pendentes', 'Reprovados'],
        datasets: [{
            data: [15, 5, 7],
            backgroundColor: [
                '#5c7cfa',
                '#aab5e2',
                '#102164'
            ]
        }]
    },
    options: {
        responsive: true
    }
});


// GRÁFICO 2 - BARRAS
const ctx2 = document.getElementById('grafico2');

new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: ['Aprovados', 'Reprovados', 'Pendentes',],
        datasets: [{
            label: 'Solicitações',
            data: [12, 19, 8, 15, 10, 20],
            backgroundColor: '#5c7cfa'
        }]
    },
    options: {
        responsive: true
    }
});

function toggleMenu() {
  document.querySelector('.sidebar').classList.toggle('active');
}