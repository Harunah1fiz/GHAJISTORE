# POS System Quick Reference - New Features

## 🎯 Quick Keyboard Shortcuts

| Shortcut          | Action             | Purpose                                          |
| ----------------- | ------------------ | ------------------------------------------------ |
| **F2**            | Focus Scanner      | Quick refocus for re-scanning                    |
| **F4**            | Toggle Lookup Mode | Switch between search-only and add-to-cart modes |
| **F8**            | Open Checkout      | Quick checkout modal                             |
| **Esc**           | Close Modal        | Close any open dialog                            |
| **Ctrl + Delete** | Clear Cart         | Clear current cart (with confirmation)           |
| **Ctrl + L**      | Focus Search       | Alternative focus shortcut                       |
| **Ctrl + S**      | Clear & Focus      | Clear input and focus scanner (NEW)              |

## 🔍 Lookup Mode

- **What it does**: When enabled, barcode scans show product info WITHOUT adding to cart
- **How to use**: Check the "Look-Up" checkbox or press **F4**
- **When to use**:
  - Price checking
  - Stock verification
  - Customer inquiries
- **Normal Mode**: Barcode scans immediately add products to cart

## 🔊 Audio Feedback

Your POS system now provides helpful sounds:

- **Success Beep** ↑↑ - Product added, transaction complete
- **Error Buzz** ↓ - Out of stock, invalid item, errors
- **Toast Messages** - Brief text notifications (e.g., "Coke added x1")

## 📦 Pack Pricing

The system now supports bulk/pack pricing:

- Buy 12 bottles individually: ₦500 each = ₦6,000
- Buy 1 pack of 12: ₦5,000 (discounted)
- Buy 13 items: 1 pack (₦5,000) + 1 unit (₦500) = ₦5,500

The system automatically calculates the lowest price!

## 🔄 Offline Transactions

- **Pending Sync Indicator**: Shows "Pending Sync: 3" in top-right when transactions await sync
- **Automatic Queuing**: Transactions saved offline if connection lost
- **Sync on Reconnect**: Manually click sync button or wait for auto-sync

## ⚙️ Stock Safety Features

The system prevents:

- ❌ Adding items that are out of stock
- ❌ Increasing quantity beyond available stock
- ❌ Accidentally losing stock data

Example: If you have 10 cokes and try to scan 15, the system prevents it!

## 🎨 Scan Success Experience

- Product row highlights briefly when added ✨
- Toast message confirms: "Coke added x1"
- Auto-focus returns to scanner for next item

## 💾 Transaction Details

Every transaction now includes:

- **Unique ID**: Automatic, never duplicated
- **Device ID**: Identifies which POS terminal
- **Timestamp**: When transaction occurred
- Used for offline tracking and sync

---

## 🚀 Pro Tips for Faster Checkout

1. **Use F2/F4 for Speed**: Don't reach for mouse
2. **Bulk Items**: Let system handle pack pricing automatically
3. **Quick Clear**: Ctrl+Delete + Enter clears cart instantly
4. **Listen for Sounds**: Success beep confirms scan (don't watch screen!)
5. **Lookup Mode**: Use F4 to quickly check prices without adding

---

## 🔧 Troubleshooting

**Sound not working?**

- Check browser volume
- Some browsers require user interaction first
- Sound may not work in full offline mode

**Keyboard shortcuts not responding?**

- Don't use shortcuts while typing in search box
- Press Esc first, then try shortcut

**Pack pricing not applying?**

- Ensure products have pack metadata configured
- Falls back to unit pricing if pack data missing

**Offline queue not syncing?**

- Check connection status (green/red dot)
- Click sync button manually
- Clear browser cache if issues persist

---

## 📊 New Indicators You'll See

| Indicator            | Meaning                                  |
| -------------------- | ---------------------------------------- |
| 🟢 Green dot         | Server is online                         |
| 🔴 Red dot           | Server is offline (queuing transactions) |
| 📦 "Pending Sync: 5" | 5 transactions waiting to sync           |

---

**Need Help?** All features are documented in `POS_ENHANCEMENTS_DOCUMENTATION.md`
