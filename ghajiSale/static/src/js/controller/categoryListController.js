import * as model from '../categoryModel.js';
import categoriesView from '../views/categoriesView.js';


const ControlcategoryDetail = async function(id){
    console.log('control category detail');
    categoriesView.renderSpinner()
    const category = await model.getCategory(id)
    console.log(category);
    categoriesView.render(category)

}
const init = function(){
    console.log('hello');
    categoriesView.addHandlerOpen(ControlcategoryDetail)
    categoriesView.addHandlerOpenAdd()
    categoriesView.addHandlerClose()
}
init()