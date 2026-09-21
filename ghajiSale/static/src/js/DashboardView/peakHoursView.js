import { peakHoursChart, updatePeakHoursChart } from "../charts/hoursChart.js"

class PeakHourChartView{
    
    _peakHourele = document.querySelector('.peak-time')
    render(data){
        let tranArr = data.transactions
        let maxIndex = 0
        for(let i =1; i <tranArr.length; i++){
            if(tranArr[i] > tranArr[maxIndex]){
                maxIndex = i
            }
        }
        this._peakHourele.textContent = data.labels[maxIndex]
        this._renderChart(data)

    }
    _renderChart(data){
        const ctx = document.getElementById('peakChart')
        if(this._chart) this._chart.destroy()
        this._chart = peakHoursChart(ctx)
        console.log(data);
        updatePeakHoursChart(this._chart, data)
    }
}

export default new PeakHourChartView()