import { expenseChart, updateExpenseChart } from "../charts/expenseChart.js"
import { formatCurrencysm } from "../helper.js"

class ExpensesView{
    _expenseParent = document.querySelector('.expense-list')

    render(data){
        this._expenseParent.innerHTML = `
        <li class="danger">
            <span>Total expenses </span>
            <strong>${formatCurrencysm(data.total_expenses)}</strong>
        </li>
        ${this._breakdown(data)}
        `;
        this._renderChart(data)
    }

    _renderChart(data){
        const ctx = document.getElementById('expenseChart')
        if(this._chart) this._chart.destroy()
        this._chart = expenseChart(ctx)
        updateExpenseChart(this._chart, data)
    }

    _breakdown(data){
        
        let breakdown =data.breakdown.map(item =>{
            
            return `
            <li class="warning">
            <span>${item.category}</span>
            <strong>${formatCurrencysm(item.amount)}</strong>
            </li>
            `
        }).join('')
        
        return breakdown
    }
}

export default new ExpensesView()