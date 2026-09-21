import View from "./View.js";

export default class ModalView extends View {
    _overlay = document.querySelector(".modal-overlay");

    open() {
        this._parentElement.classList.remove("hidden");
        this._overlay.classList.remove("hidden");
    }

    close() {
        this._parentElement.classList.add("hidden");
        this._overlay.classList.add("hidden");
    }

    toggle() {
        this._parentElement.classList.toggle("hidden");
        this._overlay.classList.toggle("hidden");
    }

    addHandlerClose() {
        this._parentElement.addEventListener("click", (e) => {
            if (
                e.target.closest(".close-modal") ||
                e.target.classList.contains("modal-overlay")
            ) {
                this.close();
            }
        });

        this._overlay.addEventListener("click", () => {
            this.close();
        });
    }

    addHandlerOpen(handler, selector = ".edit") {
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(selector);

            if (!btn) return;

            const id = btn.dataset.id;

            handler(id);

            this.open();
        });
    }
}