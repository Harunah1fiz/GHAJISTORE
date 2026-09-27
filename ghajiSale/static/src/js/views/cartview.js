import View from "./View.js";

class CartView extends View {
  _parentElement = document.querySelector(".tableBody");
  _message = "item added to cart";
  _errorMessage = "item removed";

  _generateMarkup() {
    return this._data.map((item) => this._Markup(item)).join("");
  }

  addHandlerUpdateQty(handler) {
    this._parentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn--update-cart");
      if (!btn) return;
      console.log(btn);
      const item = btn.closest(".cartItem");
      if (!item) return;

      const { id } = item.dataset;
      const { updateCart } = btn.dataset;
      console.log(id,updateCart);

      if (!updateCart || !id) return;

      handler(updateCart, id);
    });
  }

  _Markup(product) {
    const unitLabel = product.saleMode === "pack" ? "case" : "unit";
    return `
    <tr class="cartItem relative" data-id="${product.id}">
        <td>
            <div class="font-medium">${product.name}</div>
            ${product.saleMode === "pack" ? `<div class="text-xs text-blue-600">${product.packQty || product.qty} case(s)</div>` : ""}
            ${product.saleMode === "mixed" ? `<div class="text-xs text-blue-600">${product.packQty || 0} case(s) + ${product.unitQty || 0} units</div>` : ""}
        </td>
        <td>${product.saleMode === "pack" ? Number(product.price).toLocaleString() : Number(product.price).toLocaleString()}</td>
        <td>
            <div class="flex items-center gap-2">
                <button class="button add negative btn--update-cart" data-update-cart="sub">
                <div class="button-outer">
                    <div class="button-inner">
                    <i data-lucide="minus" class="w-4 h-4"></i>
                    </div>
                </div>
                </button>
                <span class="w-6 text-center">${product.qty}</span>
                <span class="text-[10px] uppercase text-slate-500">${unitLabel}</span>

                <button class="button add positive btn--update-cart" data-update-cart="add">
                <div class="button-outer">
                    <div class="button-inner">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    </div>
                </div>
                </button>
            </div>
        </td>
        <td>${Number(product.total).toLocaleString()}</td>

        <td class="delete absolute -right-4 animate-fadeInLeft delay-100 hidden btn--update-cart" data-update-cart="del">❌</td>
    </tr>
    `;
  }

  printReceipt(transaction) {
    console.log(transaction);
    const receiptHTML = `
        <html>
        <head>
            <title>Receipt</title>
            <style>
                body { font-family: monospace; }
                .center { text-align: center; }
            </style>
        </head>
        <body>
            <div class="center">
                <h3>My Store</h3>
                <p>${new Date().toLocaleString()}</p>
            </div>

            <hr/>

            ${transaction.items
              .map(
                (item) => `
                <p>${item.name} x${item.qty} - ₦${item.price}</p>
            `,
              )
              .join("")}

            <hr/>

            <p>Total: ₦${transaction.total}</p>
            <p>Received: ₦${transaction.received}</p>
            <p>Change: 100</p>

            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                }
            </script>
        </body>
        </html>
    `;

    const win = window.open("", "", "width=300,height=600");
    win.document.write(receiptHTML);
    win.document.close();
  }

  /**
   * SCAN SUCCESS UX: Highlight the most recently added cart item
   * Adds a subtle animation to draw attention to the new item
   */
  highlightLastItem() {
    try {
      const rows = this._parentElement.querySelectorAll(".cartItem");
      if (rows.length === 0) return;

      const lastRow = rows[0]; // Most recent item is first
      lastRow.style.backgroundColor = "#d1fae5";
      lastRow.style.transition = "background-color 0.3s ease";

      setTimeout(() => {
        lastRow.style.backgroundColor = "";
      }, 800);
    } catch (err) {
      console.warn("Highlight animation failed:", err.message);
    }
  }
}

export default new CartView();
