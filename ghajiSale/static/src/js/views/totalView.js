import { formatCurrency } from "../helper.js";
import View from "./View.js";

class TotalView extends View {
    _parentElement = document.querySelector('.subTotal')
    // checkout
    _modalOverlay = document.querySelector('.modal-overlay');
    _checkoutModal = document.querySelector('.modal[data-modal="check-out"]');
    addHandlerRender(handler){
        ['load'].forEach(ev => window.addEventListener(ev, handler))
    }

    addHandlerActionBtn(handler){
        this._parentElement.addEventListener('click', (e)=>{
            const btn = e.target.closest('.neo-btn');
            if(!btn) return;

            const action =  btn.classList.contains('hold') ? 'hold' :
                            btn.classList.contains('cancel') ? 'cancel' :
                            btn.classList.contains('checkout') ? 'checkout' : null;

            if(!action) return;
            handler(action);
        })
    }


    addHandlerChangeInput(handler){
        this._parentElement.addEventListener('input', function(e){
            const input = e.target.closest('.amount__recieved')

            if(!input) return
            console.log(input);
            handler(+input.value);
        })

    }

    updateBalance({balance, isEnough}){
        let pTag = this._parentElement.querySelector('.changeDisplay')
        console.log(pTag);
        pTag.classList.remove('hidden')
        pTag.innerHTML = `the change left:<span class="change text-[13px] font-bold ${isEnough ? 'text-green-600':'text-red-600'}">${formatCurrency(balance)}</span>`
        
        
    }
    _generateMarkup(){
        return `
        
            <div class="flex justify-between text-xl font-bold border-t border-b border-gray-300 pt-3">
                <span>Total</span>
                <span class="totalPrice">${formatCurrency(this._data.total)}</span>
            </div>
            <div class="mt-4 flex gap-4 ">
                <div class="basis-1/2">
                <label class="block text-sm font-medium mb-1">Payment Method</label>
                <select id="transaction_method" class="inputText w-full border rounded-md px-3 py-2">
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="Transfer">Transfer</option>
                </select>
                </div>
        <div class="">
        <label class="block text-sm font-medium mb-1">Amount Received (₦)</label>
        <input type="number" class="amount__recieved w-full px-3 py-2 border rounded-md">
        <p class="changeDisplay hidden animate-fadeInLeft delay-200 linear">j</p>
        </div>
        </div>
        <div class="neo-actions">
            <button class="neo-btn neutral hold">Hold</button>
            <button class="neo-btn danger cancel" >Cancel</button>
            <button class="neo-btn success checkout">CheckOut</button>
        </div>
        `
    }
}

export default new TotalView()