const revenueExpenses = [
    {m:"Jan", profit:12000},
    {m:"Feb", profit:14000},
    {m:"Mar", profit:13500},
    {m:"Apr", profit:17000},
    {m:"May", profit:19500},
    {m:"Jun", profit:22000},
    {m:"Jul", profit:21000},
    {m:"Aug", profit:24000},
    {m:"Sep", profit:26000},
    {m:"Oct", profit:28000},
    {m:"Nov", profit:31000},
    {m:"Dec", profit:35000}
];

const ctx = document
    .getElementById("weeklyRevenueChart");

new Chart(ctx, {
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
                data: [
                    6400,
                    6900,
                    7200,
                    8400,
                    10100,
                    12200,
                    11400
                ],
                backgroundColor:
                    "#2A354F",
                borderRadius: 12
            },

            {
                label: "This Week",
                data: [
                    8200,
                    7400,
                    9100,
                    10200,
                    12800,
                    15400,
                    13100
                ],
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
new Chart(ctx2, {

    type: "line",

    data: {

        labels:
        revenueExpenses.map(
            item => item.m
        ),

        datasets: [

            {

                data:
                revenueExpenses.map(
                    item => item.profit
                ),

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

});

const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
];

const revenue = [
    450000,520000,480000,610000,
    720000,800000,770000,850000,
    900000,980000,1050000,1200000
];

const expenses = [
    280000,310000,300000,350000,
    420000,460000,450000,490000,
    510000,550000,580000,620000
];

const profit = revenue.map(
    (r, i) => r - expenses[i]
);

const revenueCanvas =
document.getElementById("revenueChart");

const revenueCtx =
revenueCanvas.getContext("2d");

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

new Chart(
    document.getElementById("revenueChart"),
    {
        type: "line",

        data: {

            labels: months,

            datasets: [

                {
                    label: "Revenue",
                    data: revenue,
                    borderColor: "#3b82f6",
                    backgroundColor: revenueGradient,
                    fill: true,
                    tension: .4
                },

                {
                    label: "Expenses",
                    data: expenses,
                    borderColor: "#ef4444",
                    backgroundColor: expenseGradient,
                    fill: true,
                    tension: .4
                },

                {
                    label: "Profit",
                    data: profit,
                    borderColor: "#22c55e",
                    backgroundColor: profitGradient,
                    fill: true,
                    tension: .4
                }
            ]
        }
    }
);


new Chart(document.getElementById("expenseChart"), {
    type: "doughnut",

    data: {
        labels: ["Salaries", "Suppliers", "Electricity", "Transport"],

        datasets: [{
            data: [450000, 1200000, 85000, 70000],

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

// 

const metrics = [
  { k: "Avg Order Value", v: "$42.18", d: "+6.2%" },
  { k: "Daily Transactions", v: "1,284", d: "+12.4%" },
  { k: "Customer Retention", v: "87.4%", d: "+3.1%" },
  { k: "Net Profit Margin", v: "52.2%", d: "+2.8%" },
  { k: "Employee Salary", v: "$38.5k", d: "+6.2%" },
];

const container = document.getElementById("metrics");

container.innerHTML = metrics.map(m => `
  <div class="flex neu-inset items-center justify-between p-3 rounded-2xl bg-white/5 shadow-inner">
    <div>
      <div class="text-[10px] uppercase tracking-wider text-gray-400">${m.k}</div>
      <div class="text-base font-bold tabular-nums mt-0.5">${m.v}</div>
    </div>
    <div class="text-xs font-semibold text-green-400">${m.d}</div>
  </div>
`).join("");



const peakHours = [
  { h: "9AM", v: 5 },
  { h: "10AM", v: 12 },
  { h: "11AM", v: 18 },
  { h: "12PM", v: 25 },
  { h: "1PM", v: 20 },
  { h: "2PM", v: 30 },
  { h: "3PM", v: 35 },
  { h: "4PM", v: 28 },
  { h: "5PM", v: 40 },
  { h: "6PM", v: 55 },
  { h: "7PM", v: 45 }
];

const ctx3 = document.getElementById("peakChart");

new Chart(ctx3, {
  type: "line",
  data: {
    labels: peakHours.map(d => d.h),
    datasets: [{
      label: "Transactions",
      data: peakHours.map(d => d.v),

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


function miniChart(id, color) {
  const ctx = document.getElementById(id);

new Chart(ctx, {
    type: "line",
    data: {
      labels: ['week 1','week 2','week 3','week 4'],
      datasets: [{
        label: "profit",
        data: [3,5,4,6],
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

miniChart("c1", "#7c3aed");
miniChart("c2", "#ef4444");
miniChart("c3", "#22c55e");


new Chart(document.getElementById("yearChart"), {
  type: "bar",

  data: {
    labels: ["2020", "2021", "2022", "2023", "2024"],

    datasets: [
      {
        label: "Revenue",
        data: [50000, 65000, 72000, 81000, 95000],
        backgroundColor: "#1D4ED8",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      },
      {
        label: "Expenses",
        data: [30000, 40000, 45000, 50000, 52000],
        backgroundColor: "#ef4444",
        borderRadius: 8,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      },
      {
        label: "Profit",
        data: [20000, 25000, 27000, 31000, 43000],
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
