class DateChangeView{
    _parentElement = document.querySelector(".report-view")

    _btnPrev = document.querySelector(".left");
    _btnNext = document.querySelector(".right");
    _label = document.querySelector("#current-day-label");

    addHandlerDateNavigation(handler) {

        this._btnPrev.addEventListener("click", () => {
            handler("prev");
        });

        this._btnNext.addEventListener("click", () => {
            handler("next");
        });

    }

    updateNavigation({label, canGoNext}){
        this._label.textContent = label;
        this._btnNext.disabled = !canGoNext;
    }
}

export default new DateChangeView();