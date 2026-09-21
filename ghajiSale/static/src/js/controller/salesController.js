// ─── Sales Controller ─────────────────────────────────────────────────────────
// MVC Controller layer — wires Views to Model.
// No business logic here; no direct DOM manipulation.
// ─────────────────────────────────────────────────────────────────────────────

import { showToast, focusScannerInput } from "../helper.js";
import * as model from "../salesModel.js";
import { playSound } from "../utils/sound.js";
import cartview from "../views/cartview.js";
import productsView from "../views/productsView.js";
import recieptView from "../views/recieptView.js";
import searchView from "../views/searchView.js";
import totalView from "../views/totalView.js";

// ── Search ────────────────────────────────────────────────────────────────────
console.log("JS LOADED");
let searchTimer;

// LOOKUP MODE INTEGRATION: Track whether lookup mode is enabled
let isLookupMode = false;

// Get lookup mode checkbox state from DOM
const getLookupModeState = () => {
  const checkbox = document.querySelector("#cCB1");
  return checkbox ? checkbox.checked : false;
};

// Run the actual search and hand results to the view
const controlSearchResults = function () {
  try {
    const query = searchView.getQuery();

    if (!query) {
      productsView.renderMessage("Type a product name or scan a barcode");
      return;
    }

    model.loadSearchProducts(query);
    productsView.render(model.state.search.results);
  } catch (err) {
    productsView.renderError(err.message);
  }
};

// Debounced wrapper — waits 500 ms after the last keystroke
const controlSearchDebounced = function () {
  clearTimeout(searchTimer);
  productsView.renderSpinner();

  searchTimer = setTimeout(() => {
    controlSearchResults();
  }, 500);
};

// Handle lookup button click
const controlLookup = function () {
  controlSearchResults();
};

// Handle clear button click
const controlClear = function () {
  productsView.renderMessage("Type a product name or scan a barcode");
};

// add Product to cart when scanned
// LOOKUP MODE INTEGRATION: When lookup mode is enabled, scan performs search only (no cart add)

/**
 * Handle barcode scan from search input
 * LOOKUP MODE INTEGRATION: In lookup mode, only show product info without adding to cart
 */
const controlBarcodeAddtoCart = function () {
  try {
    const query = searchView.getQuery().trim();

    // LOOKUP MODE INTEGRATION: Check if lookup mode is active
    isLookupMode = getLookupModeState();

    if (isLookupMode) {
      // LOOKUP MODE: Perform search only, don't add to cart
      playSound("success"); // Audio feedback for lookup
      showToast("Product lookup: " + query);
      return;
    }

    // NORMAL MODE: Add to cart
    model.AddBarcodeProductCart(query, 1);
    cartview.render(model.state.cart);

    // SCAN SUCCESS UX: Highlight the newly added item and show toast
    const product = model.state.products.find(
      (p) => String(p.barcode) === String(query),
    );
    if (product) {
      showToast(`${product.name} added x1`);
      // Highlight cart row (animation via CSS)
      cartview.highlightLastItem();
    }

    // POS AUDIO FEEDBACK: Play success sound
    playSound("success");

    searchView.clearInput();
    productsView.render(model.state.search.results);
    totalView.render(model.state.Transaction);
    console.log(model.state.search.results);
  } catch (Err) {
    // POS AUDIO FEEDBACK: Play error sound on failure
    playSound("error");
    productsView.renderError(Err);
  }
};

// ── Product Loading ───────────────────────────────────────────────────────────

const controlLoadProducts = async function () {
  try {
    console.log("CONTROL RUNNING");
    await model.loadProducts();
    // Show all products on initial load so the shelf isn't empty
  } catch (err) {
    productsView.renderError(err.message);
  }
};

// ── Cart ──────────────────────────────────────────────────────────────────────

const controlAddtoCart = function (barcode, qty) {
  try {
    const product = model.state.products.find(
      (p) => String(p.barcode) === String(barcode),
    );
    if (!product) throw new Error("Product not found");

    if (product.stock <= 0) {
      playSound("error"); // POS AUDIO: Stock error
      return cartview.renderErrorAlert(
        `Sorry, ${product.name} is out of stock!`,
      );
    }

    if (qty > product.stock) {
      playSound("error");
      return cartview.renderErrorAlert(
        `Only ${product.stock} ${product.name} left in stock!`,
      );
    }

    model.addTocart(barcode, qty);
    cartview.render(model.state.cart);
    productsView.updateProduct(product);
    totalView.render(model.state.Transaction);

    // POS AUDIO + SCAN UX: Success sound and toast on add
    playSound("success");
    showToast(`${product.name} added x${qty}`);
  } catch (err) {
    playSound("error");
    productsView.renderError(err.message);
  }
};

// Handle cart quantity changes
const controlUpdateCart = function (type, id) {
  try {
    const product = model.state.products.find((p) => p.id == id);
    if (!product) return;

    // STOCK SAFETY: Prevent increasing beyond stock
    if (type === "add" && product.stock <= 0) {
      playSound("error");
      return cartview.renderErrorAlert(
        `Sorry, ${product.name} is out of stock!`,
      );
    }

    if (type == "add") model.increaseQty(id);
    if (type === "sub") model.decreaseQty(id);
    if (type === "del") model.removeItem(id);

    cartview.render(model.state.cart);
    totalView.render(model.state.Transaction);

    productsView.updateProduct(product);
  } catch (err) {
    playSound("error");
    cartview.renderErrorAlert(err.message);
    console.warn("Cart update error:", err.message);
  }
};

// ── Transaction ───────────────────────────────────────────────────────────────

const controlCheckOut = function () {
  totalView.render(model.state.Transaction);
};

const controlAmountReceived = function (value) {
  model.transaction(value);

  const { total, received } = model.state.Transaction;
  const balance = received - total;

  totalView.updateBalance({ balance, isEnough: balance >= 0 });
};

/**
 * Handle transaction actions: hold, cancel, checkout
 * AUTO-FOCUS: Auto-focus scanner after transaction actions
 * POS AUDIO: Play success/warning sounds
 */
const controlActionBtn = async function (action) {
  try {
    if (action === "hold") {
      model.holdTransaction();
      showToast("Transaction held");
    }

    if (action === "cancel") {
      model.cancelTransaction();
      playSound("success"); // Cancellation confirmation
      showToast("Transaction cancelled");
      // AUTO-FOCUS: Refocus scanner after cancel
      focusScannerInput();
    }

    if (action.startsWith("checkout")) {
      totalView.renderSpinner?.();
      const transaction = model.prepareTransaction();
      recieptView.render(transaction);
      recieptView.open();
    }

    // Re-render the whole UI to its post-action state
    cartview.render(model.state.cart);
    totalView.render(model.state.Transaction);
    searchView.clearInput();
    productsView.render(model.state.search.results);
  } catch (err) {
    console.error("Action button error:", err.message);
    playSound("error");
    totalView.renderErrorAlert(err);
    totalView.render(model.state.Transaction);
  }
};

// ─── Print Feature ────────────────────────────────────────────────────────────

/**
 * Save and print receipt
 * AUTO-FOCUS: Refocus scanner after successful transaction
 * POS AUDIO: Play success sound on completion
 */
const controlSaveAndPrint = async function () {
  try {
    // 1. Prepare transaction with ID
    const transaction = model.prepareTransaction();

    // 2. Send to backend / offline queue
    const result = await model.checkoutTransaction(transaction);

    // 3. Decide UI message based on result
    if (result.savedOnline) {
      playSound("success"); // POS AUDIO: Success for online save
      cartview.renderSuccessAlert("Transaction saved");
    } else {
      playSound("warning"); // POS AUDIO: Warning for offline save
      cartview.renderWarningAlert("Saved offline. Will sync later");
    }

    // 4. Update UI state
    cartview.render(model.state.cart);
    totalView.render(model.state.Transaction);

    // 5. Print receipt ONLY after successful save (online or offline)
    recieptView.printReceipt(transaction);

    // 6. Close receipt modal
    recieptView.close();

    // AUTO-FOCUS: Refocus scanner after successful transaction
    focusScannerInput();
  } catch (err) {
    console.error(err);
    playSound("error");
    cartview.renderErrorAlert(err.message || "Transaction failed");
  }
};

// ── Offline Sync ──────────────────────────────────────────────────────────────

// When the browser comes back online, automatically flush any queued sales
// const controlOnlineSync = async function () {
//     try {
//         await model.syncOfflineSales();
//     } catch {

//     }
// };

// // ── Offline Sync ──────────────────────────────────────────────────────────────
// // OFFLINE QUEUE VISIBILITY + POS AUDIO: Update queue indicator and play sounds

// const controlSync = async function () {
//   try {
//     const syncBtn = document.querySelector(".btn-sync");
//     const syncText = document.querySelector(".sync-text");

//     syncBtn.disabled = true;
//     syncText.textContent = "Syncing...";

//     await model.syncOfflineSales();

//     syncText.textContent = "Sync";
//     syncBtn.disabled = false;

//     playSound("success");
//     cartview.renderSuccessAlert("Sync completed");
//     updateOfflineQueueIndicator();
//   } catch (err) {
//     console.error("Sync error:", err);
//     playSound("error");
//     cartview.renderErrorAlert("Sync failed: " + err.message);

//     const syncText = document.querySelector(".sync-text");
//     syncText.textContent = "Sync";

//     const syncBtn = document.querySelector(".btn-sync");
//     syncBtn.disabled = false;
//   }
// };

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────
// KEYBOARD SHORTCUTS: F2, F4, F8, Esc, Ctrl+Delete, Ctrl+L, Ctrl+S

/**
 * Handle global keyboard shortcuts
 * KEYBOARD SHORTCUTS: F2 (focus scanner), F4 (toggle lookup), F8 (checkout),
 *                     Esc (close modal), Ctrl+Delete (clear cart), Ctrl+L (focus search),
 *                     Ctrl+S (clear and focus scanner)
 */
const handleKeyboardShortcuts = (e) => {
  // Don't intercept shortcuts when typing in certain inputs
  const isTextInput =
    document.activeElement.tagName === "INPUT" &&
    !["checkbox", "radio", "submit", "button"].includes(
      document.activeElement.type,
    );

  if (e.key === "F2" || e.key === "f2") {
    e.preventDefault();
    focusScannerInput();
    showToast("Scanner focused");
  }

  if (e.key === "F4" || e.key === "f4") {
    e.preventDefault();
    const checkbox = document.querySelector("#cCB1");
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      isLookupMode = checkbox.checked;
      showToast(isLookupMode ? "Lookup mode: ON" : "Lookup mode: OFF");
    }
  }

  if (e.key === "F8" || e.key === "f8") {
    e.preventDefault();
    if (model.state.cart.length > 0) {
      const checkoutBtn = document.querySelector(".neo-btn.checkout");
      if (checkoutBtn) checkoutBtn.click();
      showToast("Opening checkout...");
    } else {
      showToast("Cart is empty");
    }
  }

  if (e.ctrlKey && (e.key === "Delete" || e.key === "Backspace")) {
    e.preventDefault();
    if (model.state.cart.length > 0) {
      if (confirm("Clear cart? This cannot be undone.")) {
        model.cancelTransaction();
        cartview.render(model.state.cart);
        totalView.render(model.state.Transaction);
        focusScannerInput();
        showToast("Cart cleared");
        playSound("success");
      }
    }
  }

  if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
    e.preventDefault();
    focusScannerInput();
    showToast("Search focused");
  }

  // CTRL+S SHORTCUT: Clear and focus scanner input
  if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    searchView.clearInput();
    focusScannerInput();
    showToast("Scanner cleared and focused");
  }
};

// ─── Update Offline Queue Indicator ────────────────────────────────────────────
/**
 * Update "Pending Sync" indicator in topbar
 * OFFLINE QUEUE VISIBILITY: Show count of pending offline transactions
 */
const updateOfflineQueueIndicator = () => {
  try {
    const count = model.getPendingOfflineCount();
    let indicator = document.querySelector(".pending-sync-indicator");

    if (count > 0) {
      if (!indicator) {
        const topbar =
          document.querySelector(".top-bar") ||
          document.querySelector("header");
        if (topbar) {
          indicator = document.createElement("div");
          indicator.className = "pending-sync-indicator";
          indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 30rem;
            background: #f59e0b;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 12px;
            z-index: 999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          `;
          document.body.appendChild(indicator);
        }
      }
      if (indicator) {
        indicator.textContent = `Pending Sync: ${count}`;
        indicator.style.display = "block";
      }
    } else if (indicator) {
      indicator.style.display = "none";
    }
  } catch (err) {
    console.warn("Offline queue indicator failed:", err.message);
  }
};
// ─── Online Status Monitor ────────────────────────────────────────────────────
const statusDot = document.getElementById("online-status");
const updateStatus = async () => {
  if (!statusDot) return;

  const isOnline = await model.checkServer();

  statusDot.classList.toggle("bg-green-400", isOnline);
  statusDot.classList.toggle("bg-red-500", !isOnline);

  console.log("Server online:", isOnline);
};
updateStatus();
// ── Init ──────────────────────────────────────────────────────────────────────

const init = function () {
  // 1. Bind all view event handlers
  searchView.addHandlerSearch(controlSearchDebounced);
  searchView.addhandlerScannerSearch(controlBarcodeAddtoCart);
  searchView.addHandlerClear(controlClear);

  productsView.addHandlerLoad(controlLoadProducts);
  productsView.addHandlerClick(controlAddtoCart);

  cartview.addHandlerUpdateQty(controlUpdateCart);

  totalView.addHandlerRender(controlCheckOut);
  totalView.addHandlerChangeInput(controlAmountReceived);
  totalView.addHandlerActionBtn(controlActionBtn);

  recieptView.addHandlerPrint(() =>
    recieptView.printReceipt(model.prepareTransaction()),
  );
  recieptView.addHandlerSaveAndPrint(controlSaveAndPrint);
  recieptView.renderSpinner("lg");
  recieptView.addHandlerClose(() => {
    // AUTO-FOCUS: Focus scanner after receipt modal closes
    focusScannerInput();
  });

  // 2. Setup keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);

  // 3. Setup offline queue indicator
  updateOfflineQueueIndicator();
  setInterval(updateOfflineQueueIndicator, 3000);

  // 4. offline status
  setInterval(updateStatus,3000)
};

// Top-level await is valid in ES modules
init();
lucide.createIcons();



