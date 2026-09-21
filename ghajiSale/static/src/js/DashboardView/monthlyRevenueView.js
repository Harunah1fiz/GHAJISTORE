import { earningsChart, updateEarningsChart } from "../charts/earningChart.js";
import { fmt } from "../helper.js";

class MonthlyRevenueView{
    _earningAmountEle = document.querySelector(".earnings-amount h2");
    
    render(data){
        
        this._earningAmountEle.textContent = data.total_revenue ? fmt(data.total_revenue) : '₦0.00';
        this._renderChart(data)
    }

    _renderChart(data){
        const ctx = document.getElementById('earningsChart');
        if(this._chart) this._chart.destroy();
        this._chart = earningsChart(ctx);
        updateEarningsChart(this._chart, data);
    }
}

export default new MonthlyRevenueView();