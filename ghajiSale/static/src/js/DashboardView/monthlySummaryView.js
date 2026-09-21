import { fmt, pctBadge } from "../helper.js";
import View from "../views/View.js"
class MonthlySummaryView extends View{
    _parentElement = document.querySelector('.monthly-summary');


    _generateMarkup(){
        return`
        ${this._generateCard('Sales', this._data.sales_this_month, 'banknote-arrow-up', `${pctBadge(this._data.tiny_label.sales_growth)} vs LastMonth`, 'text-emerald-700')}
        ${this._generateCard('Net Profit', this._data.net_profit, 'trending-up', `${pctBadge(this._data.tiny_label.profit_change)} vs LastMonth`, 'text-sky-700')}
        ${this._generateCard('Expenses', this._data.expenses_this_month, 'banknote-arrow-down', `${pctBadge(this._data.tiny_label.expense_change)} vs LastMonth`, 'text-amber-700')}
        ${this._generateCard('Inventory Value', this._data.inventory_value, 'trending-up', 'Current stock valuation', 'text-violet-700')}
        `

    }

    _generateCard(title, amount, icon, label = '', accent = '') {
    return `
        <div class="mini-stat relative  p-4 rounded-lg shadow-md">
        <div class="mini-stat-header flex items-center gap-4 mb-1">
        <div class="mini-icon">
            <i data-lucide="${icon}"></i>
        </div>
            <p>${title}</p>
        </div>

        <div class="mini-content">
            <h3 class="${accent}">${fmt(amount)}</h3>
            <p>${label}</p>
        </div>
        </div>
    `;
}
}

export default new MonthlySummaryView();
