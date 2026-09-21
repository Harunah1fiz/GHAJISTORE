import { formatCurrency, formatCurrencysm } from "../helper.js";
import View from "../views/View.js";
class SuggestionView extends View {
    _errorMessage = "No item with this name found";

    constructor(parentElement){
        super()
        this._parentElement=parentElement
    }

     addHandlerSelect(handler){
        this._parentElement.addEventListener("click", e=>{
            const item = e.target.closest("li");
            if(!item) return;

            handler({
                id: item.dataset.id,
                barcode:item.dataset.barcode
            })
        })
    }
    _generateMarkup(){
        return this._data
        .map(product => this._markUp(product))
        .join('');
    }

    show() {
    
    this._parentElement.classList.add('active');
    }

    hide() {
    this._parentElement.classList.remove('active');
    this._parentElement.innerHTML = '';
    }
_markUp(product){
    const url = editProductBaseUrl.replace("0", product.id);
    let productTitle = product.name.slice(0,2)
    return `
            <li class=" cursor-pointer animate-fadeInDown delay-200 border-b border-gray-300 mb-1" data-id="${product.id}" data-barcode="${product.barcode}">
                <a href="${url}">
                <div class="flex items-center gap-4 p-1">
                    <div class="avater out-shadow bg-white rounded-md w-12 h-12 flex items-center justify-center mr-3 font-semibold grow-0 shrink-0">
                        ${product.image ? `<img src="/media/${product.image}" alt="" srcset="" class="w-12 h-12">` : `<p class=" text-2xl ">${productTitle}</p>`}
                    </div>
                    <div class="w-9/10 flex flex-col ">
                    <div class="font-md text-sm flex item-center justify-between ">
                        <span class="mt-2">${product.name}</span>
                        
                    <div class="out-shadow avater bg-white rounded-full w-7 h-7 relative bottom-[3px] right-1">
                    ${product.is_pack ? `<i data-lucide="boxes" class="w-4 h-4"></i>` : `<i data-lucide="shopping-bag" class="w-4 h-4"></i> `}
                    </div>
                        
                    </div>
                    <div class="flex justify-between align-center font-bold">
                        <span class="text-sm 
                        text-green-600">${formatCurrencysm(product.price)}</span>
                        <span class="text-xs text-gray-400 mt-1">${product.stock}-left</span>
                    </div>
                    </div>
                    
                </div>
            </a>
        </li>
    `
}
}

export default SuggestionView;