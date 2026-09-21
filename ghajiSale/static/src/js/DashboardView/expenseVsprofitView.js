import { revenueChart, updateRevenueChart } from "../charts/revenueChart.js";
import { formatCurrency } from "../helper.js"

class ExpenseVsProfit{
    _proftEle = document.querySelector('.business-status')
    _chart

    render(data){
        this._proftEle.textContent = `Business is healthy. Profit increased by ${formatCurrency(data.this_month_profit)} this month.`

        this._renderChart(data)
    }
    _renderChart(data){
        const ctx = document.getElementById('revenueChart');

        if(this._chart) this._chart.destroy()
        this._chart = revenueChart(ctx)
        updateRevenueChart(this._chart, data)

        
    }
}

export default new ExpenseVsProfit()