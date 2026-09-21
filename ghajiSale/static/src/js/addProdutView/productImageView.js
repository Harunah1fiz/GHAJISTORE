import View from "../views/View.js";
lucide.createIcons();
class productImageView extends View{
    _granParentElement = document.querySelector('.product__upload-image');
    _parentElement = document.querySelector('.image-holder');
    
    addHandlerUploadImage(handler) {
        this._granParentElement.addEventListener('change', e => {
            const input = e.target.closest('#product-image')

            if (!input) return;
            const file = input.files[0];
            handler(file);

        })
    }
    addHandlerRemoveImage(handler){
        this._parentElement.addEventListener('click', e=>{
            
            const btn = e.target.closest('.remove-image');
            
            if(!btn) return;

            
    e.preventDefault();
    e.stopPropagation(); 
            handler();
        })
    }

    _generateMarkup() {
        return `
        <div class="imageContainer flex flex-col  rounded-md  w-40">
            <figure class="flex justify-center">
            <img src="${this._data.imageUrl}" alt="Upload" class="w-30 h-30 object-cover mb-2">
            </figure>
            <div class="text-sm border-gray-300 border-t border-b pt-2 pb-2 font-bold ">
                <p>${this._data.itemName}</p>
                <span>${this._data.fileSize}</span>
            </div>
            <button class="hover:text-red-400 remove-image">remove Image</button>
        </div>
        `;
    }

    resetImageHolder(){
        this._parentElement.innerHTML = `
            <div class="flex flex-col items-center text-gray-400">
                <p>click to upload image</p>
                <i data-lucide="image-plus" class="w-10 h-10"></i>
            </div>
        `;
        lucide.createIcons();
    }
}

export default new productImageView();