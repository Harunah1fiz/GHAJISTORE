import ModalView from "./modelView.js";

class categoriesView extends ModalView{
    _parentElement = document.querySelector('.modal-detail')
    _superParent = document.querySelector('.categoriesContainer');
    _quickViewmodel = document.querySelector("[data-model='category-quick-view']");
    _cancelBtn = document.querySelector(".exit")

    addHandlerOpenAdd(){
        this._superParent.addEventListener("click", (e) => {
            const addBtn = e.target.closest(".addCategory");
            if (!addBtn) return;
            this.openAddDialog()
        });
    }
    openAddDialog(){
        document.querySelector('[data-modal="add-category"]').classList.remove('hidden')
    }
    _generateMarkup(){
    return ` 

                                <div class="model-header">
                                <h2 class="text-xl font-semibold">Detail of ${this._data.name}</h2>
                                    <button class="close close-modal"><i data-lucide="x" class="w-5 h-5"></i></button>
                                </div>
                                <section class="model-body " >
                                    <div class="modalContent">
                                    <div class="flex gap-1.5 w-full ">
                                    <figure class="w-50 flex-1">
                                        <img src="./assets/images/product-23.png" alt="" srcset="" class="w-32 h-32">
                                    </figure>
                                    <ul class=" flex-2">
                                        <li>
                                            <p>Category:</p><span> ${this._data.name}</span>
                                        </li>
                                        <li class="text-sm">
                                            <p>Total Product:</p><span>${this._data.productCount}</span>
                                        </li>
                                        <li class="text-sm">
                                            <p class="">Active Product:</p> <span class="">${this._data.activeProducts}</span>
                                        </li>
                                        <li>
                                            <p>Description:</p><span class="text-sm"> ${this._data.description ? this._data.description : 'No description available.'} </span>
                                        </li>
                                    </ul>
                                    </div>
                                    <div class="totalEarning flex justify-between items-center mt-4 border-t pt-4">
                                            <p class="font-bold text-xl">Total Earning:</p>
                                            <div class=" font-medium text-xl text-green-600">$${this._data.totalProfit}</div>
                                    </div>
                                    <div class="modalActions flex justify-end gap-3 mt-4">
                                        <button class=" cancelChanges neo-btn neutral neo-actions px-3 close-modal">cancel</button>
                                        <button class="px-3 saveChanges neo-btn success neo-actions">Save Changes</button>
                                    </div>
                                    </div>
                                    </section>
                            
    `
}

}


export default new categoriesView()