import { fmt } from "../helper.js"

class MonthCompView{
    _thisMonthProfit = document.querySelector('.this-yr')
    _lastYearProfit = document.querySelector('.last-yr')
    _growthParcentage = document.querySelector('.growth-percent')
    _growthAmount = document.querySelector('.growth-amount')

    render(data){
        let Amount = data.this_month * (data.change_percent/100)
        this._thisMonthProfit.textContent = data.this_month ? fmt(data.this_month) : '₦0.00'
        this._lastYearProfit.textContent = data.same_month_last_year ? fmt(data.same_month_last_year) : '₦0.00'
        this._growthParcentage.textContent = `${data.trend}${data.change_percent}%`
        this._growthAmount.textContent= `${data.trend}${fmt(Amount)}`
    }
}

export default new MonthCompView()