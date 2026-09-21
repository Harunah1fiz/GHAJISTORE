import { updateWeeklyRevenueChart, weeklyRevenueChart } from "../charts/weeklyRevenueChart.js";
import { formatCurrency } from "../helper.js";

class WeeklyRevenueView{
    _growthValue = document.querySelector('.growth-value');
    _summaryBoxes = document.querySelectorAll('.report-summary div');
    _chart
    render(data){
        this._growthValue.innerHTML = `${data.trend === 'up' ? '↑' : '↓'} ${Math.abs(data.change_pct)}%`;

        const [thisWeekEl, lastWeekEl] = this._summaryBoxes;

    thisWeekEl.querySelector('h2').textContent =
        formatCurrency(data.this_week_total);

    lastWeekEl.querySelector('h4').textContent =
        formatCurrency(data.last_week_total);

    this._renderChart(data);
    }
    _renderChart(data){
        const ctx = document.getElementById('weeklyRevenueChart');
        if(this._chart) this._chart.destroy();
        this._chart = weeklyRevenueChart(ctx);
        updateWeeklyRevenueChart(this._chart, data);
        
    }
}


export default new WeeklyRevenueView();