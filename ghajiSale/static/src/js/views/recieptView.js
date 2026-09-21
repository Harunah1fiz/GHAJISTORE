import { formatCurrency } from "../helper.js";
import { playSound } from "../utils/sound.js";
import View from "./View.js";

class ReceiptView extends View {
  _overlay = document.querySelector(".modal-overlay");
  _modal = document.querySelector('[data-modal="check-out"]');
  _parentElement = this._modal.querySelector(".content");

  open() {
    this._overlay.classList.remove("hidden");
    this._modal.classList.remove("hidden");
  }

  close() {
    this._overlay.classList.add("hidden");
    this._modal.classList.add("hidden");
  }

  addHandlerClose() {
    this._modal.addEventListener("click", (e) => {
      if (e.target.closest(".modal-close")) {
        this.close();
      }
    });
  }
  addHandlerPrint(handler) {
    this._modal.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-print");
      if (!btn) return;
      console.log(btn);
      playSound("success");
      handler();
    });
  }
  addHandlerSaveAndPrint(handler) {
    this._modal.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-save-print");
      if (!btn) return;
      console.log(btn);
      playSound("success");
      handler();
    });
  }

  _generateMarkup() {
    return `
            <div class="text-center mb-3">
                <h3 class="font-bold text-2xl">Ghaji Store</h3>
                <p class="text-xs">${this._data.date}</p>
            </div>

            <div class="border-t border-b py-2">
                ${this._data.items
                  .map(
                    (item) => `
                    <div class="flex justify-between text-sm">
                        <span>${item.name} x${item.qty}</span>
                        <span>${formatCurrency(item.total)}</span>
                    </div>
                `,
                  )
                  .join("")}
            </div>

            <div class="mt-2 text-sm">
                <div class="flex justify-between">
                    <span>Total:</span>
                    <span>${formatCurrency(this._data.total)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Received:</span>
                    <span>${formatCurrency(this._data.received)}</span>
                </div>
                <div class="flex justify-between font-bold">
                    <span>Balance:</span>
                    <span>${formatCurrency(this._data.received - this._data.total)}</span>
                </div>
            </div>
        `;
  }

  printReceipt(transaction) {
    const receiptHTML = `
    <html>
    <head>
        <title>Receipt</title>
        <style>
            body { 
                font-family: monospace; 
                width: 80mm;
                margin: 0 auto;
                font-size: 12px;
            }

            .center { text-align: center; }

            .row {
                display: flex;
                justify-content: space-between;
            }

            .divider {
                border-top: 1px dashed #000;
                margin: 8px 0;
            }
        </style>
    </head>
    <body>
        <div class="center">
            <h3>Ghaji Store</h3>
            <p>${new Date().toLocaleString()}</p>
        </div>

        <div class="divider"></div>

        ${transaction.items
          .map(
            (item) => `
            <div class="row">
                <span>${item.name} x${item.qty}</span>
                <span>₦${item.total}</span>
            </div>
        `,
          )
          .join("")}

        <div class="divider"></div>

        <div class="row">
            <strong>Total</strong>
            <strong>₦${transaction.total}</strong>
        </div>

        <div class="row">
            <span>Received</span>
            <span>₦${transaction.received}</span>
        </div>

        <div class="row">
            <span>Change</span>
            <span>₦${transaction.received - transaction.total}</span>
        </div>

        <script>
            window.onload = function() {
                window.print();

                // 🔥 Notify parent window after print
                setTimeout(() => {
                    window.opener.postMessage('PRINT_DONE', '*');
                    window.close();
                }, 500);
            }
        </script>
    </body>
    </html>
    `;

    const win = window.open("", "", "width=300,height=600");
    win.document.write(receiptHTML);
    win.document.close();
  }
}

export default new ReceiptView();
