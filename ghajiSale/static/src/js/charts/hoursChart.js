export function peakHoursChart(hrs){
    return new Chart(hrs, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Transactions",
      data: [],

      borderColor: "#1D4ED8",
      backgroundColor: "rgba(44, 100, 230, 0.159)",
      fill: true,
      tension: 0.4,

      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: "#1D4ED8",
      pointBorderWidth: 0
    }]
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10
      }
    },

    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } }
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#9ca3af", font: { size: 11 } }
      }
    }
  }
});
}

export function updatePeakHoursChart(chart, data){
  chart.data.labels = data.labels
  chart.data.datasets[0].data = data.transactions
  chart.update()
}