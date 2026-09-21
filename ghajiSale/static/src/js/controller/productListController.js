import suggestionView from "../addProdutView/suggestionView.js"
import * as model from "../productListModel.js"
import inventoryView from "../views/inventoryView.js";
import product_listView from "../views/productListView/product_listView.js"
import searchView from "../views/searchView.js"
lucide.createIcons();


const  ControlSimpleProduct =async function(id){
    product_listView.renderSpinner("lg")
    try{
    await model.getProduct(id)
    const product = model.state.product
    product_listView.render(product)
    }
    catch(error)
    {

    }

}

const ControlSaveChanges = function(status){

    console.log(status);
    console.log(model.state.product);
    model.activateDeactivateProduct(model.state.product.id, status)
}


function init(){
    product_listView.addHandlerMoreDetail(ControlSimpleProduct)
    product_listView.addHandlerSaveChanges(ControlSaveChanges)
    

}
init()
lucide.createIcons();