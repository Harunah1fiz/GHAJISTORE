import PreviewView from "./previewView.js";
import View from "./View.js";
class ProductView extends View {
    _parentElement = document.querySelector('.product__list');
    _errorMessage = 'No item found with this detail! Please try again!';
    _message = 'Start by searching for a product. thank you';

    _generateMarkup(){
        return this._data
        .map(product => PreviewView._generateMarkup(product))
        .join('');
    }
        addHandlerLoad(handler){
        window.addEventListener('load', handler)
    }
    addHandlerClick(handler) {
    this._parentElement.addEventListener('click', e => {
        console.log('hkll');
        const btnPack = e.target.closest('.add-pack') || e.target.closest('.add-single');
        console.log(btnPack);
        if (!btnPack) return;
        
        const qty = btnPack.dataset.pack
        console.log(qty);
        const item = btnPack.closest('.item-list');
        if (!item) return;
        console.log(item);
        const { barcode } = item.dataset;
        if (!barcode) return;

        handler(barcode,qty);
    });

}

        updateProduct(product) {
        const el = this._parentElement.querySelector(
            `[data-id="${product.id}"]`
        );
        console.log(el);
        if (!el) return;

        // update stock
        const stockEl = el.querySelector('.stock');
        const addBtn = el.querySelector('.add-pack') || el.querySelector('.add-single');
        if (addBtn) {
            if (product.isPack) {
                addBtn.disabled = product.stock < product.packSize;
                addBtn.title = product.stock < product.packSize ? 'Not enough stock' : '';
                addBtn.textContent = product.stock < product.packSize ? 'Out of pack' : '+1 PKg';

            } else {
                // addBtn.disabled = product.stock <= 0;

            }
        }
        if (stockEl) {
            if (product.stock <= 0) {
                stockEl.textContent = 'Out of stock';
                stockEl.classList.add('text-red-500');
                
            } else {
                stockEl.textContent = `Stock: ${product.stock}`;
                stockEl.classList.remove('text-red-500');
            }
            stockEl.textContent = `Stock: ${product.stock}`;
        }
    }





}


export default new ProductView()