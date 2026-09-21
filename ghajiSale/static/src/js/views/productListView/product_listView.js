import View from "../View.js";

class ProductList extends View {
  _superParent = document.querySelector(".product__list");
_parentElement = document.querySelector(".modal-detail");
  _overlay = document.querySelector(".modal-overlay");
  _window = document.querySelector(".modal-detail");
  _cancelBtn = document.querySelector(".exit")

    toggleDetailWindow() {
        this._overlay.classList.toggle("hidden");
        this._window.classList.toggle("hidden");
    }



  addHandlerMoreDetail(handler) {
    this._superParent.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".edit");

        if (!editBtn) return;

        const id = editBtn.dataset.id;
        handler(id);
      this.toggleDetailWindow(); // open modal

       //  fetch product this._data
    });
  }
    addHandlerSaveChanges(handler){
        
        this._parentElement.addEventListener("click", (e) => {
            const saveBtn = e.target.closest(".saveChanges");
            const checkBtn = document.querySelector('.isActive').checked
            if(!saveBtn) return;
            handler(checkBtn);
            this.toggleDetailWindow();
            setTimeout(() => {
                
                window.location.reload();
            }, 500);
        })
    }


  _generateMarkup() {
    console.log(this._data);
    return `
                            <div class="model-header">
                                <h2 class="text-xl font-semibold">Detail of ${this._data.name}</h2>
                                    <button class="close close-modal"><i data-lucide="x" class="w-5 h-5"></i></button>
                                </div>
                                <section class="model-body " >
                                    <div class="modalContent">
                                    <div class="flex gap-1.5 w-full  ">
                                    <figure class="w-50">
                                        <img src="${this._data.imageUrl}" alt="" srcset="" class="w-32 h-32">
                                    </figure>
                                    <ul>
                                        <li>
                                            <p>Product:</p><span>${this._data.name}</span>
                                        </li>
                                        <li>
                                            <p>Category:</p><span>${this._data.category}</span>
                                        </li>
                                        <li>
                                            <p>Price:</p><span>$${this._data.price}</span>
                                        </li>
                                        <li>
                                            <p>qty</p><input type="number" value="${this._data.stock}">
                                        </li>
                                        <li class="status">
                                            <p>status:</p>
                                            <div class="relative w-13 h-5 inline-block">
                                            <input type="checkbox" name="" id="switch-component-${this._data.id}" class="peer appearance-none w-10 h-5 border border-gray-400/50 rounded-full  inset-shadow-sm inset-shadow-gray-500/50  transition-colors duration-200 checked:bg-indigo-500 isActive" ${this._data.status ? 'checked':''}>
                                            <label for="switch-component-${this._data.id}" class="absolute top-0.5 left-0 ml-1 w-4 h-4 rounded-full bg-white shadow-sm peer-checked:translate-x-4.5  peer-checked:border-slate-800 cursor-pointer transition-transform duration-200"></label>
                                            </div>
                                        </li>
                                    </ul>
                                    </div>
                                    <div class="totalEarning flex justify-between items-center mt-4 border-t pt-4">
                                            <p class="font-bold text-xl">Total Earning:</p>
                                            <div class=" font-medium text-xl text-green-600">$${this._data.totalProfit}</div>
                                    </div>
                                    <!-- <ul>
                                        <li>
                                            <p>Product:</p>
                                            <div>
                                                <img src="" alt="" srcset="">
                                                <div>
                                                    <input type="text" value="Iphone">
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            <p>Category:</p>
                                            <div>
                                                <img src="" alt="" srcset="">
                                                <span>shoes</span>
                                            </div>
                                        </li>
                                        <li>
                                            <p>Price:</p>
                                            <div>$<input type="text" value="1000"></div>

                                        </li>
                                        <li>
                                            <p>qty:</p>
                                            <div><input type="text" value="200"></div>
                                        </li>
                                        <li class="status">
                                            <p>status:</p>
                                            <div>
                                                <button>
                                                    inactive
                                                </button>
                                            </div>
                                        </li>
                                        <li>
                                            <p>Total Earning:</p>
                                            <div>$<input type="text" value="5000"></div>
                                        </li>
                                    </ul> -->
                                    <div class="modalActions flex justify-end gap-3 mt-4">
                                        <button class="cancelChanges neo-btn neutral neo-actions px-3 exit">cancel</button>
                                        <button class="px-3 saveChanges neo-btn success neo-actions">Save Changes</button>
                                    </div>
                                    </div>
                                </section>
        `;
  }
}

export default new ProductList();
