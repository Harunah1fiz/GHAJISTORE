export function weeklyRevenueChart(ctx){
    return new Chart(ctx, {
    type: "bar",
    data: {
        labels: [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun"
        ],

        datasets: [
            {
                label: "Last Week",
                data: [],
                backgroundColor:
                    "#2A354F",
                borderRadius: 12
            },

            {
                label: "This Week",
                data: [],
                backgroundColor:
                    "rgb(20, 71, 230)",
                borderRadius: 12
            }
        ]
    },

    options: {
        responsive:true,
        animation: {
        y: {
            from: 500,
            duration: 1500,
            easing: "easeOutQuart"
        }
    },
        plugins:{
            legend:{
                labels:{
                    color:"#fff"
                }
            }
        },

        scales:{
            x:{
                grid:{
                    display:false
                },

                ticks:{
                    color:"#94a3b8"
                }
            },

            y:{
                ticks:{
                    color:"#94a3b8"
                },

                grid:{
                    color:"rgba(255,255,255,0.05)"
                }
            }
        }
    }
});
}
export function updateWeeklyRevenueChart(chart, data){
    const last_week = data.last_week;
    const this_week = data.this_week;
    chart.data.datasets[0].data = last_week;
    chart.data.datasets[1].data = this_week;
    chart.update();
}