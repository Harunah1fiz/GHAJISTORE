const state = {
    category : {}
}


const createSimpleProduct = function(data){
    const category = data
    return {
        id: category.id,
        name : category.name,
        description: category.description,
        imageUrl: category.category_image,
        productCount: category.product_count,
        activeProducts: category.active_products,
        totalProfit: Number(category.total_profit).toFixed(2),
    }
}

export async function getCategory(id){
    try{
        const res = await fetch(`categories/${id}/quick-view`)
        const data = await res.json()
        console.log(data);
        const result = createSimpleProduct(data)
        state.category = result
        return result
    
    }
catch(err){
        console.error('Error fetching category:', err)
    }
}
