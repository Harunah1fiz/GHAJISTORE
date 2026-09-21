class InventoryView {
    _parentElement = document.querySelector('.inventory__view')

    addHandlerRemoveMessage(){
    const alertEl = document.querySelector(".alert")
    if (!alertEl) return;

    setTimeout(() => {
        alertEl.classList.add("fade-out");

        setTimeout(() => {
            alertEl.remove();
        }, 300);

    }, 4000);

    alertEl.querySelector(".close")?.addEventListener("click", () => {
        alertEl.remove();
    });
        
    }
}

export default new InventoryView()