import View from "./View.js";

export default class ReportModalView extends View {
  _parentElement = document.querySelector(".report-modal");
  _overlay = document.querySelector(".modal-overlay");

  open() {
    this._parentElement.classList.remove("hidden");
    this._overlay.classList.remove("hidden");
  }

  close() {
    this._parentElement.classList.add("hidden");
    this._overlay.classList.add("hidden");
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
}
