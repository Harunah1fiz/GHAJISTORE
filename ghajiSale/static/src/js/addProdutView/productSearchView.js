class ProductSearchView{
    
    constructor(parentElement){
        this._parentElement = parentElement
    }
    _input = document.querySelector('.search__field')

    getQuery(){
        
        const query = this._input.value;
        
        return query;
    }

    addHandlerSearch(handler){
        this._parentElement.addEventListener('input', (e)=>{
            e.preventDefault()
            console.log('input entered');
            

            handler();
        })
    }
    setValue(name){
        this._input.value = name;
        
    }
}

export default  ProductSearchView