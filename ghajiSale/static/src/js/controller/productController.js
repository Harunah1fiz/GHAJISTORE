import InventorySettingView from "../addProdutView/InventorySettingView.js"
import productImageView from "../addProdutView/productImageView.js";
import ProductState from "../addProdutView/ProductState.js"
import suggestionView from "../addProdutView/suggestionView.js";
import * as model from '../ProductInvmodel.js'
import ProductSearchView from "../addProdutView/productSearchView.js";
import { showToast } from "../helper.js";




let searchTimer;
const productSearch = document.querySelector('.search__container')
const searchSuggestElement = document.querySelector('.search_suggest')
const loadSearch = new ProductSearchView(productSearch)
const suggestObj = new suggestionView(searchSuggestElement)

export const controlSearch = function(results){
    try{
        const query = loadSearch.getQuery()
        console.log(query);
        if(!query){
           suggestObj.hide();
            return;
        }
       suggestObj.show();
        model.loadProductSuggestions(query);
       suggestObj.render(results);
        
    }catch(err){
       suggestObj.renderError(err.message);
    }
}
export const controlSearchDebouncing = function(){
    
    clearTimeout(searchTimer)
   suggestObj.renderSpinner()
    searchTimer = setTimeout(()=>{
        console.log(model.state);
        controlSearch(model.state.search.result);
    },500)
}
document.addEventListener('click', e => {
    if (!e.target.closest('.search')) {
       suggestObj.hide();
    }
});

const isComplete = data =>
    Object.values(data).every(v=> Number.isFinite(v) && v >=0);
const controlBussinessProjection = function (data) {
    console.log(data);
    console.log(isComplete(data));
    console.log(model.calculateInventoryProjection(data));
    if (!isComplete(data)) return;
    const projection = model.calculateInventoryProjection(data);
    InventorySettingView.renderResult(projection);
};

window.addEventListener('DOMContentLoaded', function () {
    const data = InventorySettingView.getInputData();
    controlBussinessProjection(data);
});

const packController = function(isPack){
    model.setPackState(isPack);
}

const uploadProductImage = function(file){
    model.setProductImage(file);
    productImageView.render(model.state.productImage);
    
}
const removeProductImage = function(){
    model.removeProductImage();
    productImageView.resetImageHolder();
    // console.log(model.state.productImage);
}
const controlAddtoStock = async function(data){
    const button = document.querySelector('.confirm__addstock')
    const originalText = button?.textContent
    if(button){
        button.disabled = true;
        button.textContent = "Restocking..."
    }
    try{
    
        await model.addQuantity(data);
    ProductState._renderUpdateStock(model.state.productInfo);
    ProductState.renderSuccessAlert(model.state.message);
    }
    catch(err){
        showToast(err.message,'e')
    }
    finally{
        button.disabled = false;
      button.textContent = originalText || "Restock";
    }
    
}


const controlExpiration = function(){

}



const init = function(){
    ProductState.addHandlerTab()
    ProductState.addHandlerExpiredCheck()
    InventorySettingView.addHandlerInputChange(controlBussinessProjection)
    InventorySettingView.runInitialCalculation(controlBussinessProjection);
    InventorySettingView.addHandlerPackToggle(packController);
    productImageView.addHandlerUploadImage(uploadProductImage);
    productImageView.addHandlerRemoveImage(removeProductImage)
    loadSearch.addHandlerSearch(controlSearchDebouncing)
    ProductState.addHandlerAddStock(controlAddtoStock);

}
init()