import { storage } from "./utils/storage.js";

export const state = {
    product: {},
    search : {
        query: '',
        result: [],
        page: 1,
        resultsPerPage: 10,
    },
    productInfo: {
        
    },
    is_pack: false,
    productImage :{
        file: '',
        imageUrl: '',
        fileSize: '',
        itemName: '',
    }
    

}

export const loadProductSuggestions = function(query){
    try{
        state.search.query = query;
        // Simulate search results (replace with actual search logic)
        const allProducts = storage.getProducts();
        const result = allProducts.filter(product => product.name.toLowerCase().includes(query.toLowerCase())|| product.barcode.includes(query));
        state.search.result = result;

        if(result.length === 0) throw new Error('No item with this name found');
        return result
    }catch(err){
        throw err;
    }
}
export const calculateInventoryPackProjection = function(data){
    // Convert to numbers
    
    let { cost, caseCost, caseCount, packSize, damagedPieces, sellingPrice } = data;
    // Convert to numbers
    cost = Number(cost)
    caseCost = Number(caseCost);
    caseCount = Number(caseCount);
    packSize = Number(packSize);
    damagedPieces = Number(damagedPieces);
    sellingPrice = Number(sellingPrice);

    // 1 Total sellable units
    const totalUnits =  caseCount * packSize - damagedPieces
    const comUnits = caseCount * packSize
    console.log(totalUnits);
    if (totalUnits <= 0) return null;

    // 2 Total cost (all cases)
    const totalCost = caseCost * caseCount;

    // 3 Cost per unit
    const costPerUnit = totalCost / comUnits;

    // 4 Profit per unit
    const profitPerUnit = sellingPrice - costPerUnit;

    // 5 Totals
    const grossRevenue = sellingPrice * totalUnits;
    const grossProfit = profitPerUnit * totalUnits;

    // 6 Margins (PER ITEM)
    const profitMargin = (profitPerUnit / sellingPrice) * 100;
    const markup = (profitPerUnit / costPerUnit) * 100;

    // 
    return {
        totalUnits,
        totalCost: +totalCost.toFixed(2) ?? 0,

        costPerUnit: +costPerUnit.toFixed(2) ?? 0,
        profitPerUnit: +profitPerUnit.toFixed(2) ?? 0,

        grossRevenue: +grossRevenue.toFixed(2) ?? 0,
        grossProfit: +grossProfit.toFixed(2) ?? 0,

        profitMargin: +profitMargin.toFixed(2) ?? 0,
        markup: +markup.toFixed(2) ?? 0,
    };

    
}
{

}


export const calculateInventoryProjection = function (data) {
    if(state.is_pack){
        return calculateInventoryPackProjection(data);
    }
    let {cost,damagedPieces,packSize,sellingPrice} = data
    cost = Number(cost)
    damagedPieces = Number(damagedPieces);
    packSize = Number(packSize);
    sellingPrice = Number(sellingPrice);

    // 1 Total sellable units
    const totalUnits = packSize - damagedPieces;
    console.log(totalUnits);
    if (totalUnits <= 0) return null;
    // 2 Total cost (all cases)
    const totalCost = cost * packSize;
    const costPerUnit = cost
    // 3 profit per unit
    const profitPerUnit = sellingPrice - cost;

    // 4 Totals
    const grossRevenue = sellingPrice * totalUnits;
    const grossProfit = profitPerUnit * totalUnits;

    // 5 Margins (PER ITEM)
    const profitMargin = (profitPerUnit / sellingPrice) * 100;
    const markup = (profitPerUnit / cost) * 100;

    return {
        totalUnits,
        totalCost: +totalCost.toFixed(2),
        costPerUnit: +costPerUnit.toFixed(2),
        profitPerUnit: +profitPerUnit.toFixed(2) ,

        grossRevenue: +grossRevenue.toFixed(2) ,
        grossProfit: +grossProfit.toFixed(2) ,

        profitMargin: +profitMargin.toFixed(2) ,
        markup: +markup.toFixed(2) ,
    };

    };

export const setPackState = function(isPack){
    state.is_pack = isPack;
}

export const setProductImage = function(file){
    const imageUrl = URL.createObjectURL(file);
    const fileSize = (file.size/1024).toFixed(2) + 'KB';
    let itemName = `${file.name.split('.')[0].split(' ')[0]}_product`;
    state.productImage = {
        file: file,
        imageUrl: imageUrl,
        fileSize: fileSize,
        itemName: itemName,
    }
}
export const removeProductImage = function(){
    state.productImage = {
        file: '',
        imageUrl: '',
        fileSize: '',
        itemName: '',
    }

}


export const addQuantity = async function({quantity, lowInventory,expiry_date, id}){

    try{
    const res = await fetch(`/product/products/${id}/add-stock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity, lowInventory, expiry_date }),
    });
    const data = await res.json();
    state.productInfo = data.data;
    state.message = data.message;
    console.log(state.productInfo);
    console.log(data);
    }
    catch(error){
        throw error
    }

}