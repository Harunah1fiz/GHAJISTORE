export const Products = [
  {
    id: 1,
    name: "Rice 25kg",
    price: 12000,
    barcode: "1234567890123",
    stock: 10,
    category: "Grains",
    img: "product-23.png",
  },
  {
    id: 2,
    name: "Vegetable Oil 1L",
    price: 3000,
    barcode: "2345678901234",
    stock: 5,
    category: "Cooking Oil",
    img: "product-24.png",
  },
  {
    id: 3,
    name: "Tomatoes 1kg",
    price: 500,
    barcode: "3456789012345",
    stock: 15,
    category: "Vegetables",
    img: "product-25.png",
  },
  {
    id: 4,
    name: "Garri 5kg",
    price: 2500,
    barcode: "4567890123456",
    stock: 20,
    category: "Grains",
    img: "product-26.png",
  },
  {
    id: 5,
    name: "Sugar 5kg",
    price: 4000,
    barcode: "5678901234567",
    stock: 12,
    category: "Sweeteners",
  },
  {
    id: 6,
    name: "Maggi Cubes 12pcs",
    price: 800,
    barcode: "6789012345678",
    stock: 50,
    category: "Spices",
  },
  {
    id: 7,
    name: "Bread 1 loaf",
    price: 400,
    barcode: "7890123456789",
    stock: 25,
    category: "Bakery",
  },
  {
    id: 8,
    name: "Eggs 12pcs",
    price: 1500,
    barcode: "8901234567890",
    stock: 30,
    category: "Dairy",
  },
  {
    id: 9,
    name: "Milk 1L",
    price: 1200,
    barcode: "9012345678901",
    stock: 20,
    category: "Dairy",
  },
  {
    id: 10,
    name: "Salt 1kg",
    price: 600,
    barcode: "0123456789012",
    stock: 40,
    category: "Spices",
  },
  {
    id: 11,
    name: "Indomie 5 packs",
    price: 2000,
    barcode: "1123456789012",
    stock: 35,
    category: "Instant Noodles",
  },
  {
    id: 12,
    name: "Coke 1.5L",
    price: 700,
    barcode: "1223456789012",
    stock: 50,
    category: "Beverages",
  },
  {
    id: 13,
    name: "Pepsi 1.5L",
    price: 700,
    barcode: "1323456789012",
    stock: 50,
    category: "Beverages",
  },
  {
    id: 14,
    name: "Beans 5kg",
    price: 8000,
    barcode: "1423456789012",
    stock: 18,
    category: "Grains",
  },
  {
    id: 15,
    name: "Tomato Paste 500g",
    price: 1200,
    barcode: "1523456789012",
    stock: 22,
    category: "Canned Goods",
  },
  {
    id: 16,
    name: "Tea Leaves 250g",
    price: 900,
    barcode: "1623456789012",
    stock: 30,
    category: "Beverages",
  },
  {
    id: 17,
    name: "Butter 200g",
    price: 1000,
    barcode: "1723456789012",
    stock: 25,
    category: "Dairy",
  },
  {
    id: 18,
    name: "Yam 1 tuber",
    price: 1500,
    barcode: "1823456789012",
    stock: 40,
    category: "Vegetables",
  },
  {
    id: 19,
    name: "Chicken 1kg",
    price: 2500,
    barcode: "1923456789012",
    stock: 15,
    category: "Meat",
  },
  {
    id: 20,
    name: "Frozen Fish 1kg",
    price: 3500,
    barcode: "2023456789012",
    stock: 10,
    category: "Meat",
  },
];
export const getCSRFToken = function () {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken"))
    ?.split("=")[1];
};

export const formatCurrency = function (value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
};
export const formatCurrencysm = function (value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);
};

// ─── POS Helper Functions ──────────────────────────────────────────────────────
// Reusable utilities for scanner input management, notifications, IDs, and pricing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Focus the scanner/search input field.
 * Used to auto-refocus after transactions, cart clearing, or modal closure.
 */
export const focusScannerInput = () => {
  const scannerInput = document.querySelector(".product__search_field");
  if (scannerInput) {
    scannerInput.focus();
    scannerInput.select(); // Select all text for quick re-scan
  }
};

/**
 * Show a temporary toast notification on screen
 * @param {string} message - Message to display
 * @param {number} durationMs - How long to show (default 2000ms)
 */
export const showToast = (message,type = "success", durationMs = 2000) => {
  try {
    // Remove any existing toast
    const existingToast = document.querySelector(".pos-toast");
    if (existingToast) existingToast.remove();

    // Create toast element
    const toast = document.createElement("div");
    toast.className = "pos-toast animate-fadeInUp";
    toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background:${type == 'success' ? '#10b981': 'red' } ;
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
        `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      toast.style.transition = "opacity 0.3s";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  } catch (err) {
    console.warn("Toast display failed:", err.message);
  }
};


/**
 * Generate a unique transaction ID
 * Format: yyyyMMddHHmmss_<random>
 * @returns {string} Unique transaction ID
 */
export const generateTransactionId = () => {
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") 
    // String(now.getHours()).padStart(2, "0") +
    // String(now.getMinutes()).padStart(2, "0") +
    // String(now.getSeconds()).padStart(2, "0");

  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `TXN_${timestamp}_${random}`;
};

/**
 * Get or create a unique device ID (stored in localStorage)
 * @returns {string} Device ID
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem("pos-device-id");
  if (!deviceId) {
    deviceId = "DEV_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    localStorage.setItem("pos-device-id", deviceId);
  }
  return deviceId;
};

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
  if (!packSize || packSize <= 0) {
    // No pack pricing: all units use unit price
    return {
      totalPrice: qty * unitPrice,
      packCount: 0,
      remainingUnits: qty,
      breakdown: `${qty} units @ ₦${unitPrice}`,
    };
  }

  const packCount = Math.floor(qty / packSize);
  const remainingUnits = qty % packSize;
  const totalPrice = packCount * packPrice + remainingUnits * unitPrice;

  return {
    totalPrice,
    packCount,
    remainingUnits,
    breakdown:
      packCount > 0 && remainingUnits > 0
        ? `${packCount} pack(s) @ ₦${packPrice} + ${remainingUnits} unit(s) @ ₦${unitPrice}`
        : packCount > 0
          ? `${packCount} pack(s) @ ₦${packPrice}`
          : `${remainingUnits} unit(s) @ ₦${unitPrice}`,
  };
};

export const fmt = (n) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(0)}K`
    : `₦${n.toFixed(0)}`

export const pctBadge = (pct) => {
  const up = pct >= 0
  return `<span class="${up ? 'text-green-400' : 'text-red-500'}">${up ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%</span>`
}


// cal day diff and display date

export const dayDiff = (date1, date2) => Math.round(Math.abs(date1 - date2) / (1000 * 60 * 60 * 24));

const displayDate= function(iso){
  let date = new Date(iso);
  const options = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }
  return date.toLocaleDateString("en-US", options);
}

export const displayDay = function(iso){
  let date = new Date(iso);
  const options = {
    weekday: 'long',
  }
  const daypassed = dayDiff(new Date(), date);
  if(daypassed == 0) return "Today";
  if(daypassed == 1) return "Yesterday";
  if(daypassed > 2 &&daypassed < 8) return new Intl.DateTimeFormat("en-US", options).format(date);
  return displayDate(iso);
}

export const displayTime = function(iso){
  let date = new Date(iso);
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export const getReportStyle=(report)=> {
    const styles = {
        expense: {
            border: "border-l-4 border-amber-400",
            iconBg: "bg-amber-500/10",
            iconColor: "text-amber-600",
        },

        stock: {
            border: "border-l-4 border-sky-400",
            iconBg: "bg-sky-500/10",
            iconColor: "text-sky-600",
        },

        cash: {
            border:
                report.summary.toLowerCase().includes("short")
                    ? "border-l-4 border-red-400"
                    : "border-l-4 border-emerald-400",

            iconBg:
                report.summary.toLowerCase().includes("short")
                    ? "bg-red-500/10"
                    : "bg-emerald-500/10",

            iconColor:
                report.summary.toLowerCase().includes("short")
                    ? "text-red-500"
                    : "text-emerald-500",
        },

        incident: {
            border: "border-l-4 border-orange-400",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-500",
        },
    };

    return (
        styles[report.type] || {
            border: "border-l-4 border-gray-300",
            iconBg: "bg-gray-100",
            iconColor: "text-gray-500",
        }
    );
}

