
export function expenseChart(expenseChart){
    return new Chart(expenseChart, {
    type: "doughnut",

    data: {
        labels: [],

        datasets: [{
            data: [],

            backgroundColor: [
                "#3b82f6",
                "#22c55e",
                "#f59e0b",
                "#ef4444"
            ],

            borderWidth: 6,
            borderColor: "#e2e8f0", // same as your neumorphic background
            hoverOffset: 10
        }]
    },

    options: {
        cutout: "60%", // IMPORTANT: makes it sleek (not chunky)

        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#94a3b8",
                    usePointStyle: true,
                    pointStyle: "circle"
                }
            },

            tooltip: {
                backgroundColor: "#1e293b",
                titleColor: "#fff",
                bodyColor: "#fff",
                padding: 12,
                cornerRadius: 10
            }
        },

        animation: {
            animateRotate: true,
            duration: 1500,
            easing: "easeOutQuart"
        },
    }
});
}

export function updateExpenseChart(chart, data){
    const {breakdown} = data
    chart.data.labels = breakdown.map(item => item.category);
    chart.data.datasets[0].data = breakdown.map(item => item.amount);
    chart.update();
}
