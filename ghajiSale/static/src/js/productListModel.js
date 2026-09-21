export const state = {
    search: {
        query: '',
        products: [],
    },
    product: [],
    categories: [],
    status: true,
}

const createSimpleProduct = function(data){
    const product = data
    return {
        id: product.id,
        name : product.name,
        category: product.category,
        imageUrl: product.product_image,
        status: product.status,
        stock: product.quantity,
        price: product.price,
        lowStock: product.low_stock,
        totalProfit: product.total_profit,
    }
}
export async function getProduct(id){
    try{
    const res = await fetch(`/product/products/${id}/quick-view`)
    const data = await res.json()
    console.log(data);
    state.product = createSimpleProduct(data)

    }
    catch(error){

    }

    
}

export async function activateDeactivateProduct(id, status){
    try{
        const res = await fetch(`/product/products/${id}/toggle-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        state.status = status;
        console.log(state.status);
    }
    catch(error){
        console.error("Error activating/deactivating product:", error);
    }
}