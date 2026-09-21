export function revenueChart(revenueChart){
    const revenueCtx =
    revenueChart.getContext("2d");

const revenueGradient =
revenueCtx.createLinearGradient(
    0,
    0,
    0,
    350
);

revenueGradient.addColorStop(
    0,
    "rgba(59,130,246,.4)"
);

revenueGradient.addColorStop(
    1,
    "rgba(59,130,246,0)"
);

const expenseGradient =
revenueCtx.createLinearGradient(
    0,
    0,
    0,
    350
);

expenseGradient.addColorStop(
    0,
    "rgba(239,68,68,.4)"
);

expenseGradient.addColorStop(
    1,
    "rgba(239,68,68,0)"
);

const profitGradient =
revenueCtx.createLinearGradient(
    0,
    0,
    0,
    350
);

profitGradient.addColorStop(
    0,
    "rgba(34,197,94,.4)"
);

profitGradient.addColorStop(
    1,
    "rgba(34,197,94,0)"
);
    return new Chart(
    revenueChart,
    {
        type: "line",

        data: {

            labels: [],

            datasets: [

                {
                    label: "Revenue",
                    data: [],
                    borderColor: "#3b82f6",
                    backgroundColor: revenueGradient,
                    fill: true,
                    tension: .4
                },

                {
                    label: "Expenses",
                    data: [],
                    borderColor: "#ef4444",
                    backgroundColor: expenseGradient,
                    fill: true,
                    tension: .4
                },

                {
                    label: "Profit",
                    data: [],
                    borderColor: "#22c55e",
                    backgroundColor: profitGradient,
                    fill: true,
                    tension: .4
                }
            ]
        }
    }
);
}

export function updateRevenueChart(chart, data){
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.revenue;
    chart.data.datasets[1].data = data.expenses;
    let profit = data.revenue.map((rev,i)=>{
        return rev - data.expenses[i]
    })
    chart.data.datasets[2].data = profit;
    chart.update();
}