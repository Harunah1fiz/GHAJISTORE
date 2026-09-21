

export const storage = {
    getProducts() {
        const data = localStorage.getItem('products');
        return data ? JSON.parse(data) : [];
    },

    saveProducts(products) {
        localStorage.setItem('products', JSON.stringify(products));
    }
};

export const OfflineSale = {
    saveOfflineSale(sale){
        localStorage.setItem('offline-sale', JSON.stringify(sale));
    },
    getOfflineSales () {
        const data = localStorage.getItem('offline-sale');
        return data ? JSON.parse(data) : [];
    },
    clearOfflineSales () {
        localStorage.removeItem('offline-sale');
    }
    


}


// report templates
export const reportTemplates = {
    expense: {
        title: "Expense Report",
        fields:[
            {id:"category", label:"Expense Category", type:"select", options: ["Rent", "Utilities", "Salaries", "Restocking", "Maintenance", "Marketing", "Other"], placeholder:"Select category"},
            {id:"amount",label:"Amount",type:"number",placeholder:"Enter amount"},
            {id:"description",label:"Description",type:"textarea",placeholder:"Enter description"}
        ]
    },
    stock: {
        title: "Stock Adjustment",
        fields: [
            // {
            //     id: "product",
            //     label: "Product",
            //     type: "select",
            //     options: [],
            //     placeholder: "Select product"
            // },
            {
                id: "product",
                label: "Product",
                type: "text",
                placeholder: "Enter barcode or name"
            },
            {
                id: "quantity",
                label: "Quantity",
                type: "number",
                placeholder: "Enter quantity"
            },
            {
                id: "reason",
                label: "Reason",
                type: "textarea",
                placeholder: "Enter reason"
            }
        ]
    },
    cash: {
        title: "Cash Difference",
        fields: [
            {id: "expected", label: "Expected Cash", type: "number", placeholder: "Enter expected cash"},
            {id: "counted", label: "Counted Cash", type: "number", placeholder: "Enter counted cash"},
            {id: "reason", label: "Reason", type: "textarea", placeholder: "Enter reason"}
        ]
    },
    incident: {
        title: "Incident Report",
        fields: [
            {id: "title", label: "Title", type: "text", placeholder: "Enter incident title"},
            {id: "severity", label: "Severity", type: "select", options: ["Low", "Medium", "High"], placeholder: "Select severity"},
            {id: "description", label: "Description", type: "textarea", placeholder: "Enter description"}
        ]
    }
}

