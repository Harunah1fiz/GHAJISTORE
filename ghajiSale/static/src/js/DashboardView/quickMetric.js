import View from '../views/View.js'
import { formatCurrencysm } from '../helper.js'
class KpiView extends View {
    _parentElement = document.querySelector('#metrics')

    _generateMarkup(){
        console.log(this._data);
        return `
        ${this._renderKpi('Transaction this Month', this._data.transactions_this_month)}
        ${this._renderKpi('Average Transaction Value', formatCurrencysm(this._data.avg_transaction_value))}
        ${this._renderKpi('Unit Sold this Month', this._data.units_sold_this_month)}
        ${this._renderKpi('Low Stock Product', this._data.low_stock_products)}
        ${this._renderKpi('Top Payment Method', this._data.top_payment_method)}
        ` 
    }

    _renderKpi(title,value){
        return `
    <div class="flex neu-inset items-center justify-between p-3 rounded-2xl bg-white/5 shadow-inner">
    <div>
        <div class="text-[10px] uppercase tracking-wider text-gray-400">${title}</div>
        <div class="text-base font-bold tabular-nums mt-0.5">${value}</div>
        </div>
        
    </div>
        `
    }
}

export default new KpiView()