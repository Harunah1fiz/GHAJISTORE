
// ─── Sales Model ──────────────────────────────────────────────────────────────
// MVC Model layer — holds all application state and business logic.
// No DOM access here. All functions are pure data operations.
// ─────────────────────────────────────────────────────────────────────────────

import { OfflineSale, storage } from "./utils/storage.js";
import { generateTransactionId, getDeviceId, calculatePackPrice } from "./helper.js";

// ── Application State ─────────────────────────────────────────────────────────
export const state = {
  products: [], // full product catalogue
  cart: [], // items currently in the basket
  search: {
    query: "",
    results: [], // products shown in the search panel
  },
  Transaction: {
    total: 0,
    received: 0,
    method: "cash",
  },
};

// ── Internal helpers (not exported) ──────────────────────────────────────────

let fuse;

// Fast barcode → product lookup
const barcodeMap = new Map();

// Map a single raw API object to the shape the UI expects
const createProductObject = function (product) {
  return {
    id: product.id,
    slug: product.slug,
    barcode: product.barcode,
    name: product.name,
    image: product.image, // API field is "image"
    caseCount: product.caseCount,
    casePrice: product.casePrice,
    price: product.price,
    packSize: product.packSize,
    isPack: product.isPack,
    // stock is not provided by the API — default to a high number
    // so stock checks don't block sales; adjust when your API includes it
    stock: product.stock ?? 9999,
  };
};

// Re-calculate the basket total and update state
const calcCartTotal = function () {
  state.Transaction.total = state.cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
};

// Initialise Fuse + barcodeMap from whatever is in state.products
const buildSearchIndex = function () {
  fuse = new Fuse(state.products, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "barcode", weight: 0.8 },
    ],
    threshold: 0.25,
  });

  barcodeMap.clear();
  state.products.forEach((product) => {
    barcodeMap.set(String(product.barcode), product);
  });
};

// ── Products ──────────────────────────────────────────────────────────────────

// Fetch products from the server; fall back to IndexedDB → localStorage offline
// export const loadProducts = async function () {
//     try {
//         const res = await fetch('/product/api/products/active');
//         console.log(res);
//         if (!res.ok) throw new Error(`Server responded ${res.status}`);

//         const data = await res.json();

//         // FIX: map over the array, not a single object
//         state.products = data.map(createProductObject);

//         // Persist to IndexedDB for offline use (fire-and-forget is fine here;
//         // errors are non-critical and logged)
//         // saveProducts(data).catch(err =>
//         //     console.warn('IndexedDB save failed:', err)
//         // );
//         const existing = await getProducts();
//         if(existing.length === 0){
//             saveProducts(data).catch(err =>
//             console.warn('IndexedDB save failed:', err)
//         );
//         }

//         // Also keep localStorage as a secondary cache
//         localStorage.setItem('products', JSON.stringify(data));

//         buildSearchIndex();

//     } catch (err) {
//         console.warn('Network unavailable, loading offline cache…', err.message);

//         // Primary offline source: IndexedDB
//         try {
//             const cached = await getProducts();

//             if (cached.length > 0) {
//                 state.products = cached;
//                 buildSearchIndex();
//                 return;
//             }
//         } catch (dbErr) {
//             console.warn('IndexedDB read failed:', dbErr.message);
//         }

//         // Secondary offline source: localStorage
//         const lsCache = localStorage.getItem('products');
//         if (lsCache) {
//             state.products = JSON.parse(lsCache).map(createProductObject);
//             buildSearchIndex();
//             return;
//         }

//         // Nothing available — surface the error to the controller
//         throw new Error('No products available offline. Please connect to the internet.');
//     }
// };
export const loadProducts = async function () {
  try {
    // 1. Load from IndexedDB FIRST
    const cached = storage.getProducts();
    console.log(cached);
    if (cached.length > 0) {
      state.products = cached.map(createProductObject);
      buildSearchIndex();

      // 2. Background sync (don’t await)
      syncProducts();

      return; // stop here — fast UI
    }

    // 3. No cache → fallback to network
    await syncProducts();
    console.log(state.products);
  } catch (err) {
    console.error("Failed to load products:", err.message);

    // fallback to localStorage
    const lsCache = storage.getProducts();
    if (lsCache) {
      state.products = lsCache.map(createProductObject);
      buildSearchIndex();
      return;
    }

    throw new Error("No products available.");
  }
};

export const syncProducts = async function () {
  try {
    const res = await fetch("/product/api/products/active");

    if (!res.ok) throw new Error(`server responded ${res.status}`);

    const data = await res.json();

    const newProducts = data.map(createProductObject);

    if (isSameProducts(state.products, newProducts)) return;

    //update state
    state.products = newProducts;
    buildSearchIndex();

    //update IndexedDb
    storage.saveProducts(data);

    // localStorage.setItem('products', JSON.stringify(data))
  } catch (err) {
    console.warn("Background sync failed:", err.message);
  }
};
// const isSameProducts = function (OldProducts, newProducts){
//     if(OldProducts.length !== newProducts.length) return false;

//     return OldProducts.every((oldProd, i)=>{
//         return oldProd.id === newProducts[i].id &&
//                 oldProd.price === newProducts[i].price &&
//                 oldProd.name === newProducts[i].name;
//     })
// }
const isSameProducts = function (oldProducts, newProducts) {
  if (oldProducts.length !== newProducts.length) return false;

  const oldMap = new Map(oldProducts.map((p) => [p.id, p]));

  return newProducts.every((newProd) => {
    const oldProd = oldMap.get(newProd.id);
    if (!oldProd) return false;

    return (
      oldProd.name === newProd.name &&
      oldProd.price === newProd.price &&
      oldProd.stock === newProd.stock &&
      oldProd.is_active === newProd.is_active
    );
  });
};

// ── Search ────────────────────────────────────────────────────────────────────
export const AddBarcodeProductCart = function (barcode, qty) {
  const barcodeHit = barcodeMap.get(String(barcode));
  addTocart(barcode, qty);
};
export const loadSearchProducts = function (query) {
  state.search.query = query;

  // Exact barcode match takes priority
  const barcodeHit = barcodeMap.get(String(query));

  if (barcodeHit) {
    console.log("this item used a scanner");
    state.search.results = [barcodeHit];

    return;
  }
  let results = [];
  if (!fuse) {
    console.log(state.products);
    const match = state.products.filter(
      (product) => product.name === query || product.barcode === query,
    );
    results = match;
  } else {
    results = fuse.search(query);
  }

  state.search.results = results
    .map((r) => r.item)
    .slice(0, 10)
    .filter((product) => product.stock > 0);

  if (state.search.results.length === 0) {
    throw new Error(`No products found for "${query}"`);
  }
};

// ── Cart Operations ───────────────────────────────────────────────────────────
// STOCK SAFETY: All cart operations validate stock before modification.
// Pack pricing is auto-calculated if packSize/packPrice are available.

export const addTocart = function (barcode, quantity) {
  // Find product by barcode from cache or search results
  let product;
  const barcodeHit = barcodeMap.get(String(barcode));
  if (barcodeHit) {
    console.log("barcode was given");
    product = barcodeHit;
  } else {
    product = state.search.results.find(
      (item) => String(item.barcode) === String(barcode),
    );
  }

  if (!product) throw new Error("Product not found");
  
  // STOCK SAFETY: Prevent adding out-of-stock items
  if (product.stock <= 0) throw new Error("Item is out of stock");
  
  // STOCK SAFETY: Prevent adding more than available
  let qty = Number(quantity);
  if (qty > product.stock) {
    throw new Error(`Only ${product.stock} ${product.name} available`);
  }

  const existingItem = state.cart.find(
    (item) => String(item.barcode) === String(barcode),
  );
  
  if (existingItem) {
    // STOCK SAFETY: Check if increasing quantity exceeds available stock
    // if (existingItem.qty + qty > product.stock) {
    //   throw new Error(`Cannot add ${qty}. Only ${product.stock} available.`);
    // }
    existingItem.qty += qty;
  } else {
    state.cart.unshift({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      price: +product.price,
      qty: qty,
      total: product.price * qty,
      // PACK PRICING: Store pack metadata for future calculations
      packSize: product.packSize || null,
      packPrice: product.packPrice || null,
    });
  }

  // STOCK SAFETY: Deduct from product stock only once
  product.stock -= qty;
  
  // Re-calculate total with pack pricing support
  updateCartItemTotal(existingItem || state.cart[0]);
  calcCartTotal();
};

/**
 * Update cart item total considering pack pricing
 * @private
 */
const updateCartItemTotal = (cartItem) => {
  if (cartItem.packSize && cartItem.packPrice) {
    // Use pack pricing logic if pack metadata available
    const pricing = calculatePackPrice(
      cartItem.qty,
      cartItem.packSize,
      cartItem.packPrice,
      cartItem.price
    );
    cartItem.total = pricing.totalPrice;
  } else {
    // Standard unit pricing
    cartItem.total = cartItem.price * cartItem.qty;
  }
};

// STOCK SAFETY: Increase quantity with validation
export const increaseQty = function (id) {
  const item = state.cart.find((p) => p.id == id);
  if (!item) return;
  console.log(state.search.results);
  const product = state.products.find((p) => p.id == id);
  
  if (!product) return;

  // STOCK SAFETY: Prevent quantity increase if out of stock
  if (product.stock <= 0) throw new Error("Item is out of stock");

  item.qty++;
  product.stock--;
    
  updateCartItemTotal(item);
  calcCartTotal();
};

// STOCK SAFETY: Decrease quantity with safe restoration
export const decreaseQty = function (id) {
  const item = state.cart.find((p) => p.id == id);
  if (!item) return;

  // STOCK SAFETY: Restore stock when quantity decreases
  const product = state.products.find((p) => p.id == id);
  if (product) product.stock++;

  if (item.qty === 1) {
    state.cart = state.cart.filter((p) => p.id != id);
  } else {
    item.qty--;
    updateCartItemTotal(item);
  }

  calcCartTotal();
};

// STOCK SAFETY: Remove item with complete stock restoration
export const removeItem = function (id) {
  const index = state.cart.findIndex((item) => item.id == id);
  if (index === -1) return;

  // STOCK SAFETY: Restore full quantity to stock
  const product = state.search.results.find((p) => p.id == id);
  if (product) product.stock += state.cart[index].qty;

  state.cart.splice(index, 1);
  calcCartTotal();
};

// ── Transaction ───────────────────────────────────────────────────────────────
// TRANSACTION ID GENERATION: Every transaction gets a unique ID for offline sync

export const holdTransaction = function () {
  // Placeholder — could be saved to sessionStorage or IndexedDB later
  console.log("Transaction held:", state.cart, state.Transaction);
};

export const transaction = function (input) {
  state.Transaction.received = input;
};

export const cancelTransaction = function () {
  // Restore stock for every item in the cart
  state.cart.forEach((cartItem) => {
    // STOCK SAFETY: Full restoration on cancellation
    const product = state.search.results.find((p) => p.id === cartItem.id);
    if (product) product.stock += cartItem.qty;
  });

  state.cart = [];
  state.Transaction = { total: 0, received: 0 };
};

/**
 * Prepare a transaction for checkout with unique transaction ID
 * TRANSACTION ID GENERATION: Creates transactionId, deviceId, createdAt
 */
export const prepareTransaction = function () {
  if (state.cart.length === 0) throw new Error("Cart is empty");
  
  const receiptDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  // TRANSACTION ID GENERATION: Generate unique ID for this transaction
  return {
    transactionId: generateTransactionId(),
    deviceId: getDeviceId(),
    createdAt: new Date().toISOString(),
    items: [...state.cart],
    total: state.Transaction.total,
    received: state.Transaction.received,
    method: state.Transaction.method,
  };
};
export const checkServer = async function () {
  try {
    const res = await fetch("api/health", { cache: "no-store" });

    return res.ok;
  } catch (err) {
    return false;
  }
};

export const checkoutTransaction = async function (transaction) {
  console.log(JSON.stringify(transaction, null, 2));

  const canReachServer = await checkServer();

  let savedOnline = false;

  try {
    if (!canReachServer) {
      throw new Error("Server unreachable (offline mode)");
    }

    const res = await fetch("/sales/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Transaction rejected by server");
    }

    savedOnline = true;
    // alert("Transaction saved online ✔");
  } catch (err) {
    console.warn("Switching to offline save:", err.message);

    try {
      let currOfflineSale = OfflineSale.getOfflineSales() || [];

      // TRANSACTION ID GENERATION + OFFLINE QUEUE: Store transaction with ID metadata
      currOfflineSale.push({
        ...transaction,
        syncStatus: "pending",
        syncAttempt: 0,
      });

      OfflineSale.saveOfflineSale(currOfflineSale);

      // alert("Saved offline. Will sync later ⚠");
    } catch (offlineErr) {
      console.error("Offline save failed:", offlineErr.message);
      // alert("Critical error: transaction lost!");
      throw offlineErr;
    }
  }

  // Reset POS state after transaction
  state.cart = [];
  state.Transaction = {
    total: 0,
    received: 0,
    method: "cash",
  };

  return {
    transaction,
    savedOnline,
  };
};

// ── Offline Sync ──────────────────────────────────────────────────────────────
// Offline queue management with transaction ID tracking

/**
 * Get count of pending offline transactions for UI indicator
 * OFFLINE QUEUE VISIBILITY: Used to show "Pending Sync: X" in topbar
 */
export const getPendingOfflineCount = function () {
  const sales = OfflineSale.getOfflineSales() || [];
  return sales.filter((s) => s.syncStatus !== "synced").length;
};

// Call this when the app regains connectivity to flush queued sales.
export const syncOfflineSales = async function () {
  const sales = OfflineSale.getOfflineSales() || [];
  if (sales.length === 0) {
    console.log("No offline sales to sync");
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (let tx of sales) {
    console.log("Syncing transaction:", tx.transactionId);
    if (tx.syncStatus === "synced") continue;

    try {
      tx.syncStatus = "syncing";
      tx.lastSyncAttempt = new Date().toISOString();

      const res = await fetch("/sales/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        tx.syncStatus = "pending";
        const err = data.error || "Sync failed";
        throw new Error(err);
      }

      tx.syncStatus = "synced";
      synced++;
      console.log(`Transaction ${tx.transactionId} synced successfully`);
    } catch (err) {
      tx.syncStatus = "pending";
      let retryCount = tx.syncAttempt || 0;
      tx.syncAttempt = retryCount + 1;
      failed++;
      console.error(
        `Failed to sync sale (attempt ${tx.syncAttempt}):`,
        err.message,
      );
    }
  }

  // Save updated sales list
  const syncedSales = sales.filter((s) => s.syncStatus !== "synced");
  if (syncedSales.length === 0) {
    OfflineSale.clearOfflineSales();
    console.log("All transactions synced. Clearing offline queue.");
  } else {
    OfflineSale.saveOfflineSale(sales);
    console.log(`${syncedSales.length} transactions still pending.`);
  }

  return { synced, failed, total: sales.length };
};
