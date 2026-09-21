
export default class View{
    _data;
    alertContainer = document.querySelector('.alert-container')
    

    render(data,orientation = 'afterbegin'){
        this._data = data;
        const markup = this._generateMarkup();
        this._clear()
        
        this._parentElement.insertAdjacentHTML("afterbegin", markup);
        lucide.createIcons();
    }
    update(data){

            this._data = data;
            console.log(data);
            const newMarkup = this._generateMarkup();

            const newDOM = document.createRange().createContextualFragment(newMarkup)
            const newElements = Array.from(newDOM.querySelectorAll('*'))
            const curElements = Array.from(this._parentElement.querySelectorAll('*'))

            newElements.forEach((newEle, i)=>{
                const curEle = curElements[i]
                //update changed text
                if(!newEle.isEqualNode(curEle) && newEle.firstChild?.nodeValue?.trim() !== ''){
                    curEle.textContent = newEle.textContent
                }
                // update change attributes
                if(!newEle.isEqualNode(curEle)){
                    Array.from(newEle.attributes).forEach(attr=>{
                        curEle.setAttribute(attr.name, attr.value)
                    })

                }
            })
        }

   
    renderSpinner(large){
        let lg = large === "lg" ? "larger" : ""
        const markup = `
        <div class="spinner center ${lg}">
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        </div>
        `
        this._clear()
        this._parentElement.insertAdjacentHTML('afterbegin', markup)
    }

    _handleAlertLifecycle(alertEl) {
    // auto remove
    setTimeout(() => {
        alertEl.classList.add('fade-out');
        setTimeout(() => alertEl.remove(), 300);
    }, 4000);

    // manual close
    alertEl.querySelector('.close')?.addEventListener('click', () => {
        alertEl.remove();
    });
}


    renderErrorAlert(message = this._errorMessage){
        const markup = `
        <div class="alert danger animate-fadeInRight delay-200">
        <i data-lucide="circle-x"></i>
        <p><span>Oh snap!</span> ${message}</p>
        <button class="close"><span>×</span></button>
        </div>
        `
        this.alertContainer.classList.add('flex')
        this.alertContainer.insertAdjacentHTML('afterbegin', markup)
        
        const alertEl = this.alertContainer.firstElementChild;

        this._handleAlertLifecycle(alertEl);
    }
    renderHeadsUpAlert(message = this._errorMessage){
        const markup = `
        <div class="alert headsup">
        <i data-lucide="bell"></i>
        <p><span>Oh snap!</span> ${message}</p>
        <button class="close"><span>×</span></button>
        </div>
        `
        this._clear();
        this.alertContainer.insertAdjacentHTML('afterbegin', markup)
    }

    renderHeadsUpAlert(message = this._errorMessage){
        const markup = `
        <div class="alert headsup">
        <i data-lucide="bell"></i>
        <p><span>Heads up!</span> ${message}</p>
        <button class="close"><span>×</span></button>
        </div>
        `
        this._clear();
        this.alertContainer.insertAdjacentHTML('afterbegin', markup)
    }

    renderWarningAlert(message = this._errorMessage){
        const markup = `
        <div class="alert warning">
        <i data-lucide="circle-alert"></i>
        <p><span>Warning!</span> ${message}</p>
        <button class="close"><span>×</span></button>
        </div>
        `
        this.alertContainer.classList.add('flex')

        this.alertContainer.insertAdjacentHTML('afterbegin', markup)
        
        const alertEl = this.alertContainer.firstElementChild;

        this._handleAlertLifecycle(alertEl);
    }

    renderSuccessAlert(message = this.message){
        const markup = `
        <div class="alert success animate-fadeInRight delay-200">
        <i data-lucide="thumbs-up"></i>
        <p><span>Weldone!</span> ${message}</p>
        <button class="close"><span>×</span></button>
        </div>
        `
        this.alertContainer.insertAdjacentHTML('afterbegin', markup)
        const alertEl = this.alertContainer.firstElementChild;
        
        this._handleAlertLifecycle(alertEl);
    }

    renderError(message = this._errorMessage){
            const markup = `
            <div class="absolute top-1 font-bold text-[15px] text-red-600 left-5 flex items-center gap-1.5">
                <i data-lucide="circle-alert" class="w-8 h-8"></i>
                <span>${message}</span>
            </div>
            `;
            this._clear();
            this._parentElement.insertAdjacentHTML('afterbegin', markup)
        }
    
            renderMessage(message = this._message){
            const markup = `
            <div class="absolute top-1 font-bold text-[15px] text-blue-600 left-5 flex items-center gap-1.5">
                🙂
                <span>${message}</span>
            </div>
            `;
            this._clear();
            this._parentElement.insertAdjacentHTML('afterbegin', markup)
        }

    
     _clear(){
        this._parentElement.innerHTML = '';
    }



}