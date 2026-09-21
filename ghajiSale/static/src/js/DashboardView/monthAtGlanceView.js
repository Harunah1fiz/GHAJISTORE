import View from "../views/View.js"

class MonthAtGlanceView extends View{
    _parentElement = document.querySelector('.story-grid')

    _generateMarkup(){
        const data = this._data.insights.map(insight=>{
            return`<div class="story-card ${insight.type}">
            <p>${insight.text}.</p>
            </div>`
        }).join('')
        return data
    }


}
export default new MonthAtGlanceView()