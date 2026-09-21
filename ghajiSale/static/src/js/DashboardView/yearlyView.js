import { updateYearChart, yearComperrisonChart } from "../charts/yearChart.js"

class YearlyView {
    render(data){
        this._renderchart(data)
    }

    _renderchart(data){
        const ctx = document.getElementById('yearChart')
        if(this._chart)this._chart.destroy()
        this._chart = yearComperrisonChart(ctx)
        updateYearChart(this._chart, data)
    }
}
export default new YearlyView()