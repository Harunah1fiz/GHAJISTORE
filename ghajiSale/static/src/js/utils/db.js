// let db;

// export const initDB = function () {
//     return new Promise((resolve, reject) => {

//         const request = indexedDB.open("pos-db", 1);

//         request.onupgradeneeded = function (event) {

//             db = event.target.result;

//             if (!db.objectStoreNames.contains("products")) {
//                 db.createObjectStore("products", { keyPath: "id" });
//             }

//             if (!db.objectStoreNames.contains("offline-sales")) {
//                 db.createObjectStore("offline-sales", {
//                     keyPath: "id",
//                     autoIncrement: true,
//                 });
//             }
//         };

//         request.onsuccess = function (event) {
//             db = event.target.result;
//             resolve(db);
//         };

//         request.onerror = function () {
//             reject("IndexedDB failed");
//         };
//     });
// };


// // save products offline
// export const saveProducts = function (products) {
//     return new Promise((resolve, reject) => {
//         const tx = db.transaction("products", "readwrite");
//         const store = tx.objectStore("products");
//         products.forEach(product => store.put(product));
//         tx.oncomplete = () => resolve();
//         tx.onerror = () => reject(tx.error);
//     });
// };


// // load product when offline
// export const getProducts = function () {
//     return new Promise((resolve, reject) => {
//         const tx = db.transaction("products", "readonly");
//         const store = tx.objectStore("products");

//         const request = store.getAll();

//         request.onsuccess = () => resolve(request.result);
//         request.onerror = () => reject("Failed to load products");
//     });
// };

// // store offline sales
// export const saveOfflineSale = function (sale) {
//     const tx = db.transaction("offline-sales", "readwrite");
//     const store = tx.objectStore("offline-sales");

//     store.add(sale);
// };

// // get offline sales
// export const getOfflineSales = function () {
//     return new Promise((resolve, reject) => {
//         const tx = db.transaction("offline-sales", "readonly");
//         const store = tx.objectStore("offline-sales");

//         const request = store.getAll();

//         request.onsuccess = () => resolve(request.result);
//         request.onerror = () => reject();
//     });
// };


// // get synced sales
// export const clearOfflineSales = function () {
//     const tx = db.transaction("offline-sales", "readwrite");
//     const store = tx.objectStore("offline-sales");

//     store.clear();
// };


// ─── IndexedDB Utility ────────────────────────────────────────────────────────
// Database: pos-db  |  Stores: products, offline-sales
// All functions return Promises so they can be properly awaited.
// ─────────────────────────────────────────────────────────────────────────────

let db;

// ── Open / create the database ───────────────────────────────────────────────
export const initDB = function () {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pos-db', 1);

        request.onupgradeneeded = function (event) {
            const database = event.target.result;

            if (!database.objectStoreNames.contains('products')) {
                database.createObjectStore('products', { keyPath: 'id' });
            }

            if (!database.objectStoreNames.contains('offline-sales')) {
                database.createObjectStore('offline-sales', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
            }
        };

        request.onsuccess = function (event) {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = function () {
            reject(new Error('IndexedDB failed to open'));
        };
    });
};

// ── Products ─────────────────────────────────────────────────────────────────

// Persist an array of product objects (upsert via put)
export const saveProducts = function (products) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('products', 'readwrite');
        const store = tx.objectStore('products');

        products.forEach(product => store.put(product));

        tx.oncomplete = () => resolve();
        tx.onerror   = () => reject(new Error('Failed to save products: ' + tx.error));
    });
};

// Retrieve every product from the store
export const getProducts = function () {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => reject(new Error('Failed to load products'));
    });
};

// ── Offline Sales ─────────────────────────────────────────────────────────────

// Queue a single sale object for later sync
export const saveOfflineSale = function (sale) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('offline-sales', 'readwrite');
        const store = tx.objectStore('offline-sales');

        store.add(sale);

        tx.oncomplete = () => resolve();
        tx.onerror   = () => reject(new Error('Failed to save offline sale: ' + tx.error));
    });
};

// Retrieve all queued offline sales
export const getOfflineSales = function () {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('offline-sales', 'readonly');
        const store = tx.objectStore('offline-sales');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror   = () => reject(new Error('Failed to load offline sales'));
    });
};

// Wipe the offline-sales store after a successful sync
export const clearOfflineSales = function () {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('offline-sales', 'readwrite');
        const store = tx.objectStore('offline-sales');

        store.clear();

        tx.oncomplete = () => resolve();
        tx.onerror   = () => reject(new Error('Failed to clear offline sales: ' + tx.error));
    });
};
