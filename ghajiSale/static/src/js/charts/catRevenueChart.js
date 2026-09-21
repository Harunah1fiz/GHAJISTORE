function miniChart(id, color) {
  const ctx = document.getElementById(id);

new Chart(ctx, {
    type: "line",
    data: {
      labels: ['week 1','week 2','week 3','week 4'],
      datasets: [{
        label: "profit",
        data: [],
        borderColor: color,
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 1,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { 
         
    } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

export function updateMiniChart(chart, data){
    chart.data.datasets[0].data = data;
    chart.update();
}