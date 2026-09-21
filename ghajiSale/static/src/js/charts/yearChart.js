export function yearComperrisonChart(yearChart){
    return new Chart(yearChart, {
  type: "bar",

  data: {
    labels: [],

    datasets: [
      {
        label: "Revenue",
        data: [],
        backgroundColor: "#1D4ED8",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      },
      {
        label: "Expenses",
        data: [],
        backgroundColor: "#ef4444",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      },
      {
        label: "Profit",
        data: [],
        backgroundColor: "#22c55e",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      }
    ]
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false
    },

    animation: {
      duration: 1400,
      easing: "easeOutQuart"
    },

    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94a3b8",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20
        }
      },

      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 10,
        displayColors: true
      }
    },

    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { display: false }
      },

      y: {
        ticks: {
          color: "#94a3b8",
          callback: value => "₦" + value / 1000 + "k"
        },
        grid: {
          color: "rgba(255,255,255,0.06)"
        }
      }
    }
  }
});
}

export function updateYearChart(chart, data){
    chart.data.labels = data.map(item => item.year);
    chart.data.datasets[0].data = data.map(item => item.revenue);
    chart.data.datasets[1].data = data.map(item => item.expenses);
    chart.data.datasets[2].data = data.map(item => item.profit);
    chart.update();
}
