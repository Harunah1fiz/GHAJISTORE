import { showToast } from "../helper.js";
import View from "../views/View.js";

class ProductView extends View{
    _parentElement = document.querySelector('.tab-menu');
    _tabsContent = document.querySelectorAll('.panel__content');
    _tabs = document.querySelectorAll('.tab-link');
    _expiration = this._parentElement.querySelector('#expiry')
    addHandlerTab() {
        this._parentElement.addEventListener('click', e => {
            const clicked = e.target.closest('.tab-link');
            if (!clicked) return;

            // Activate tab
            this._tabs.forEach(t => t.classList.remove('active'));
            clicked.classList.add('active');

            // Activate panel
            this._tabsContent.forEach(c =>
                c.classList.remove('panel--active')
            );

            document
                .querySelector(`.panel-${clicked.dataset.tab}`)
                .classList.add('panel--active');
        });
    }

addHandlerExpiredCheck() {
    const checkbox = this._parentElement.querySelector('#expired');

    checkbox.addEventListener('change', () => {
        this._expiration.classList.toggle('hidden', !checkbox.checked);
    });
}

addHandlerAddStock(handler) {
    const addStockBtn = this._parentElement.querySelector(".confirm__addstock");

    addStockBtn.addEventListener("click", () => {

        const quantityInput = this._parentElement.querySelector("#Add-quantity");
        const lowInventoryInput = this._parentElement.querySelector("#inventory-report");
        const expiryInput = this._parentElement.querySelector("#batch-expiry");
        const productId = document.querySelector("#product_id").value;

        const quantity = Number(quantityInput.value);
        const lowInventory = Number(lowInventoryInput.value);
        const expiry_date = expiryInput.value;

        if (!productId) return;

        if (!Number.isInteger(quantity) || quantity <= 0) {
            showToast("Enter a valid quantity.",'e');
            quantityInput.focus();
            return;
        }

        if (!Number.isInteger(lowInventory) || lowInventory < 0) {
            showToast("Enter a valid low inventory level.",'e');
            lowInventoryInput.focus();
            return;
        }

        handler({
            id: productId,
            quantity,
            lowInventory,
            expiry_date,
        });

        quantityInput.value = 0;
        lowInventoryInput.value = 10;
        expiryInput.value = "";
    });
}


_renderUpdateStock(data) {
    const additionalInfo = this._parentElement.querySelector('.additional-info');
    additionalInfo.innerHTML = `
        <p>Product in stock now: ${data.quantity}</p>
        <p>Last time restocked:${new Date(data.last_restocked).toLocaleDateString()}</p>
        <p>Total stock over lifetime: ${data.total_stock_lifetime}</p>
    `;
}
}

export default new ProductView();
