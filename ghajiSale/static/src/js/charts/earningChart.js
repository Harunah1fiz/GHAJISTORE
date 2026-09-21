const ctx2 =
document.getElementById("earningsChart");

const chartCtx =
ctx2.getContext("2d");

const gradient =
chartCtx.createLinearGradient(
    0,
    0,
    0,
    350
);

gradient.addColorStop(
    0,
    "rgba(29,78,216,.6)"
);

gradient.addColorStop(
    .6,
    "rgba(29,78,216,.15)"
);

gradient.addColorStop(
    1,
    "rgba(29,78,216,0)"
);


export function earningsChart(earningChart){
    const chartCtx =
    earningChart.getContext("2d");

const gradient =
chartCtx.createLinearGradient(
    0,
    0,
    0,
    350
);

gradient.addColorStop(
    0,
    "rgba(29,78,216,.6)"
);

gradient.addColorStop(
    .6,
    "rgba(29,78,216,.15)"
);

gradient.addColorStop(
    1,
    "rgba(29,78,216,0)"
);

    return new Chart(earningChart, {
    type: "line",

    data: {

        labels:[],

        datasets: [

            {
                data:[],

                borderColor:"#1D4ED8",

                borderWidth:4,

                fill:true,

                backgroundColor:gradient,

                tension:.4,

                pointRadius: 3,
                pointHoverRadius: 7,
                pointBackgroundColor: "#fff",
                pointBorderColor: "#1D4ED8",
                pointBorderWidth: 2,

            }

        ]

    },

    options: {

        responsive:true,

        maintainAspectRatio:false,

        plugins:{

            legend:{
                display:false
            },
                tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 10,

        callbacks: {
            label: function(context) {
                return `Profit: ₦${context.parsed.y.toLocaleString()}`;
            }
        }
    }

        },

        scales:{

            x:{

                ticks:{
                    color:"#94a3b8"
                },

                grid:{
                    display:false
                }

            },

            y:{

                ticks:{
                    color:"#94a3b8",

                    callback:
                    value =>
                    "₦" + value/1000 + "k"
                },

                grid:{
                    color:
                    "rgba(255,255,255,.05)"
                }

            }

        }

    }

})
}

export function updateEarningsChart(chart, data){
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.data;
    chart.update();
}