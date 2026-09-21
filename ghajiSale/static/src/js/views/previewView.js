import { formatCurrencysm } from "../helper.js";
// import View from "./View.js";

// class PreviewView {
//     _generateMarkup(product){
//         let productTitle = product.name.slice(0,2)
//         return`
//         <li class="item-list py-4 cursor-pointer hover:bg-gray-100 animate-fadeInUp delay-200" data-barcode = ${product.barcode}>
//         <div class="flex justify-between items-center ">
//         <div class="flex items-center ">
//             <div class="avater bg-white rounded-md w-15 h-15 flex items-center justify-center mr-3 font-semibold grow-0 shrink-0">
//             ${product.img ? `<img src="${product.imageUrl}" alt="" srcset="" class="w-15 h-15">` : `<p class=" text-5xl ">${productTitle}</p>`}
//             </div>
//             <div class="">
//             <div class="font-lg">${product.name}</div>
//             <div class="font-bold">${formatCurrencysm(product.price)}</div>
//             <p class="font-medium space-x-0.5">left: ${product.stock}</p>
//             </div>
//         </div>
//         <div>
//         <button class="add-btn">
//         <span class="icon">+</span>
//         <span class="label">Add</span>
//         </button>
//         </div>
//         </div>
//         </li>
//         `;
//     }
// }

// export default new PreviewView()

class PreviewView {
  _generateMarkup(product) {
    
    const initials = product.name.slice(0, 2).toUpperCase();

    return `
        <li class="item-list py-4 cursor-pointer animate-fadeInUp delay-200"
            data-id="${product.id}"
            data-barcode="${product.barcode}">

            <div class="flex justify-between items-center">

                <div class="flex items-center">

                    <div class="avatar bg-white rounded-md w-15 h-15 flex items-center justify-center mr-3 font-semibold shrink-0">
                        <img src="/media/${product.image}" class="w-15 h-15 object-cover rounded-md">

                    </div>

                    <div>
                        <div class="font-lg font-semibold">
                            ${product.name}
                        </div>

                        <div class="font-bold">
                            ${formatCurrencysm(product.price)}
                        </div>

                        <p class="stock text-sm text-gray-500">
                            Stock: ${product.stock}
                        </p>

                        ${
                          product.isPack
                            ? `<p class="text-xs text-blue-500">
                                Pack size: ${product.packSize}
                            </p>`
                            : ``
                        }

                    </div>

                </div>

                <div class="button-container flex items-center gap-2">

                    <!-- Add Pack -->
                    ${
                      product.isPack
                        ? `<button class="add-pack bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 cursor-pointer"
                            data-pack="${product.packSize}" ${product.stock < product.packSize ? "disabled" : ""}>
                            +1 PKg
                        </button>`
                        : ``
                    }
                    <!-- Add Single -->
                    <button class="add-single bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 cursor-pointer "
                        data-pack="1">
                        +1
                    </button>

                </div>

            </div>

        </li>
        `;
  }

  
}

export default new PreviewView();

// ${
//     product.imageUrl
//     ? `<img src="/media/${product.imageUrl}" class="w-15 h-15 object-cover rounded-md">`
//     : `<p class="text-2xl">${initials}</p>`
// }
