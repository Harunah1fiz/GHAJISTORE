import inventoryView from "../views/inventoryView.js"

const init =()=>{
    inventoryView.addHandlerRemoveMessage();
    inventoryView.bindSummaryModal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}

if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}