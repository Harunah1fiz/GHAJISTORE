# Code Comments Reference Guide

## Comment Tag System

This POS enhancement uses a consistent comment tagging system throughout the codebase to make features easy to locate and understand.

---

## Comment Tag Legend

### Section Headers

```javascript
// ─── Feature Name ────────────────────────────────────────────────────────────
// Marks a major section or feature area
```

Example uses:

- `// ─── Lookup Mode Integration ────────`
- `// ─── Keyboard Shortcuts ────────`
- `// ─── Stock Safety ────────`

---

### Feature Tags

```javascript
// FEATURE_NAME: Description of what this code does
```

These appear inline to explain specific features:

#### Audio Feedback Tags

```javascript
// POS AUDIO FEEDBACK: Play success sound on transaction complete
playSound("success");

// POS AUDIO: Stock error
playSound("error");

// POS AUDIO: Warning for offline save
playSound("warning");
```

#### Lookup Mode Tags

```javascript
// LOOKUP MODE INTEGRATION: Check if lookup mode is active
isLookupMode = getLookupModeState();

// LOOKUP MODE INTEGRATION: When lookup mode is enabled, scan performs search only
if (isLookupMode) {
  // Only search, don't add to cart
}

// LOOKUP MODE: Perform search only, don't add to cart
model.loadSearchProducts(query);
```

#### Keyboard Shortcuts Tags

```javascript
// KEYBOARD SHORTCUTS: F2 focuses scanner input
focusScannerInput();

// KEYBOARD SHORTCUTS: F4 toggles lookup mode
checkbox.checked = !checkbox.checked;

// KEYBOARD SHORTCUTS: Ctrl+Delete clears cart after confirmation
if (confirm("Clear cart? This cannot be undone.")) {
  model.cancelTransaction();
}
```

#### Pack Pricing Tags

```javascript
// PACK PRICING: Store pack metadata for future calculations
packSize: product.packSize || null,
packPrice: product.packPrice || null,

// PACK PRICING: Use pack pricing logic if pack metadata available
const pricing = calculatePackPrice(
  cartItem.qty,
  cartItem.packSize,
  cartItem.packPrice,
  cartItem.price
);
```

#### Stock Safety Tags

```javascript
// STOCK SAFETY: Prevent adding out-of-stock items
if (product.stock <= 0) throw new Error("Item is out of stock");

// STOCK SAFETY: Prevent adding more than available
if (qty > product.stock) {
  throw new Error(`Only ${product.stock} available`);
}

// STOCK SAFETY: Check if increasing quantity exceeds available stock
if (existingItem.qty + qty > product.stock) {
  throw new Error(`Cannot add ${qty}. Only ${product.stock} available.`);
}

// STOCK SAFETY: Deduct from product stock only once
product.stock -= qty;

// STOCK SAFETY: Restore stock when quantity decreases
if (product) product.stock++;

// STOCK SAFETY: Restore full quantity to stock
if (product) product.stock += state.cart[index].qty;

// STOCK SAFETY: Full restoration on cancellation
if (product) product.stock += cartItem.qty;
```

#### Transaction ID Tags

```javascript
// TRANSACTION ID GENERATION: Every transaction gets a unique ID for offline sync
// Comment at section start

// TRANSACTION ID GENERATION: Generate unique ID for this transaction
return {
  transactionId: generateTransactionId(),
  deviceId: getDeviceId(),
  createdAt: new Date().toISOString(),
  // ...
};

// TRANSACTION ID GENERATION + OFFLINE QUEUE: Store transaction with ID metadata
currOfflineSale.push({
  ...transaction,
  syncStatus: "pending",
  lastSyncAttempt: null,
});
```

#### Auto-Focus Tags

```javascript
// AUTO-FOCUS: Refocus scanner after successful transaction
focusScannerInput();

// AUTO-FOCUS: Refocus scanner after cancel
focusScannerInput();

// AUTO-FOCUS: Refocus after modal closes
recieptView.addHandlerClose(() => {
  focusScannerInput();
});
```

#### Scan Success UX Tags

```javascript
// SCAN SUCCESS UX: Highlight the newly added item and show toast
const product = model.state.products.find(p => String(p.barcode) === String(query));
if (product) {
  showToast(`${product.name} added x1`);
  cartview.highlightLastItem();
}

// SCAN SUCCESS UX: Highlight cart row after scan
highlightLastItem() {
  const lastRow = rows[0];
  lastRow.style.backgroundColor = '#d1fae5';
}
```

#### Offline Queue Indicator Tags

```javascript
// OFFLINE QUEUE VISIBILITY: Show count of pending offline transactions
const count = model.getPendingOfflineCount();

// OFFLINE QUEUE VISIBILITY: Used to show "Pending Sync: X" in topbar
export const getPendingOfflineCount = function () {
  const sales = OfflineSale.getOfflineSales() || [];
  return sales.filter((s) => s.syncStatus !== "synced").length;
};

// OFFLINE QUEUE VISIBILITY + POS AUDIO: Update queue indicator and play sounds
updateOfflineQueueIndicator();
```

---

## Where to Find Each Feature

### Lookup Mode

- **Controller**: `salesController.js:113-137`
- **Search**: `controlBarcodeAddtoCart()` function
- **Tags**: LOOKUP MODE, LOOKUP MODE INTEGRATION, NORMAL MODE

### Audio Feedback

- **Utility**: `utils/sound.js` (entire file)
- **Controller**: `salesController.js` (multiple locations)
- **Tags**: POS AUDIO, POS AUDIO FEEDBACK

### Keyboard Shortcuts

- **Controller**: `salesController.js:458-517`
- **Function**: `handleKeyboardShortcuts(e)`
- **Tags**: KEYBOARD SHORTCUTS

### Pack Pricing

- **Helper**: `helper.js:155-192`
- **Model**: `salesModel.js:550-585`
- **Function**: `calculatePackPrice()`, `updateCartItemTotal()`
- **Tags**: PACK PRICING

### Stock Safety

- **Model**: `salesModel.js:515-603`
- **Functions**: `addTocart()`, `increaseQty()`, `decreaseQty()`, `removeItem()`
- **Tags**: STOCK SAFETY

### Transaction IDs

- **Helper**: `helper.js:95-110` (generation)
- **Model**: `salesModel.js:616-646` (implementation)
- **Functions**: `generateTransactionId()`, `getDeviceId()`, `prepareTransaction()`
- **Tags**: TRANSACTION ID GENERATION, TRANSACTION ID

### Auto-Focus

- **Helper**: `helper.js:59-68`
- **Controller**: `salesController.js` (multiple locations)
- **Function**: `focusScannerInput()`
- **Tags**: AUTO-FOCUS

### Scan Success UX

- **Controller**: `salesController.js:78-82` (toast)
- **CartView**: `cartview.js:107-122` (highlight)
- **Tags**: SCAN SUCCESS UX

### Offline Queue

- **Controller**: `salesController.js:499-540` (indicator update)
- **Model**: `salesModel.js:724-728` (count function)
- **Functions**: `updateOfflineQueueIndicator()`, `getPendingOfflineCount()`
- **Tags**: OFFLINE QUEUE VISIBILITY, OFFLINE QUEUE

---

## Reading the Codebase with Comments

### Start Here

1. Open `salesController.js`
2. Look for section headers: `// ─── Name ────────`
3. Read the feature tags within each section
4. Follow the function calls to the model

### Example Reading Path for Lookup Mode

1. **Controller** (salesController.js:113)

   ```javascript
   // LOOKUP MODE INTEGRATION: Check if lookup mode is active
   isLookupMode = getLookupModeState();
   ```

2. **Search in Model** (salesModel.js:476)

   ```javascript
   // ─── Search ────────────────────────────────────────────────────────────────
   ```

3. **Helper** (helper.js:59)
   ```javascript
   export const focusScannerInput = () => {
     const scannerInput = document.querySelector('.product__search_field');
   ```

---

## Comment Density & Purpose

### High Density Areas

These sections have more comments because they contain complex logic:

- Stock safety checks (multiple validations)
- Pack pricing calculations (math-heavy)
- Transaction ID generation (data structures)

### Low Density Areas

These are self-explanatory:

- Simple function calls (`focusScannerInput()`)
- UI updates (`showToast()`)
- Event listeners

### Principle

Comments explain "WHY", not "WHAT"

❌ Bad: `// Increment x` → Obviously the code does this

✅ Good: `// Increment quantity and decrease stock inventory` → Explains the business logic

---

## Maintenance Guide

### Adding a New Feature

1. Create a section header: `// ─── Feature Name ────────`
2. Tag all related code with `// FEATURE_NAME: Description`
3. Document edge cases inline
4. Add comments to helper functions explaining parameters

### Modifying Existing Features

1. Check existing comment tags
2. Update comments if logic changes
3. Add new tags if adding branches
4. Ensure comments remain accurate

### Debugging with Comments

1. Search for feature tag to find all related code
2. Check comment markers to understand decision points
3. Look for "// FIX:" or "// TODO:" comments (if any)
4. Reference edge case documentation

---

## Quick Search Patterns

Use Ctrl+F (Cmd+F on Mac) to find features:

| Search Term      | Finds                      |
| ---------------- | -------------------------- |
| `LOOKUP MODE`    | All lookup mode code       |
| `POS AUDIO`      | All audio feedback code    |
| `KEYBOARD`       | All keyboard shortcut code |
| `PACK PRICING`   | All pack pricing code      |
| `STOCK SAFETY`   | All stock validation code  |
| `TRANSACTION ID` | All ID generation code     |
| `AUTO-FOCUS`     | All auto-focus code        |
| `SCAN SUCCESS`   | All scan UX code           |
| `OFFLINE QUEUE`  | All offline queue code     |
| `─── `           | All section headers        |

---

## Documentation Files

Each feature has multiple documentation levels:

1. **Code Comments** (inline)
   - Located in: All modified `.js` files
   - Purpose: Explain decisions in context

2. **Feature Documentation** (detailed)
   - Located in: `POS_ENHANCEMENTS_DOCUMENTATION.md`
   - Purpose: Complete implementation details

3. **Quick Reference** (user-friendly)
   - Located in: `POS_QUICK_REFERENCE.md`
   - Purpose: End-user explanations

4. **Implementation Summary** (overview)
   - Located in: `IMPLEMENTATION_SUMMARY.md`
   - Purpose: High-level summary of all changes

---

## Examples of Well-Commented Sections

### Stock Safety (Complex Logic)

```javascript
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

  // ... rest of logic
};
```

### Pack Pricing (Calculation)

```javascript
/**
 * Calculate the final price for items considering pack pricing
 * Packs use packPrice, remaining units use unitPrice
 *
 * @param {number} qty - Total quantity ordered
 * @param {number} packSize - Size of each pack (e.g., 12)
 * @param {number} packPrice - Price of a full pack (e.g., 5000)
 * @param {number} unitPrice - Price of a single unit (e.g., 500)
 * @returns {object} { totalPrice, packCount, remainingUnits }
 *
 * Example: qty=13, packSize=12, packPrice=5000, unitPrice=500
 *   → 1 pack (5000) + 1 unit (500) = 5500 total
 */
export const calculatePackPrice = (qty, packSize, packPrice, unitPrice) => {
  // ... implementation
};
```

---

## Best Practices for Code Review

When reviewing code with these comments:

1. ✅ Check that all feature tags match their implementation
2. ✅ Verify comments stay accurate after changes
3. ✅ Ensure new features add appropriate comment tags
4. ✅ Look for consistency in comment placement
5. ✅ Verify all edge cases are documented

---

**This comment system makes the codebase self-documenting and maintainable for future developers.**
