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
        <li
            class="item-list py-4 cursor-pointer animate-fadeInUp delay-200 mb-2"
            data-id="${product.id}"
            data-barcode="${product.barcode}"
        >

            <div class="flex justify-between items-center gap-4">

                <!-- Product -->
                <div class="flex items-center min-w-0 flex-1">

                    <!-- Image -->
                    <div class="
                        avatar
                        bg-white
                        rounded-md
                        w-15 h-15
                        flex items-center justify-center
                        mr-3
                        
                        shrink-0
                        overflow-hidden
                    ">
                        ${
                            product.image
                                ? `
                                    <img
                                        src="/media/${product.image}"
                                        class="w-15 h-15 object-cover rounded-md"
                                        alt="${product.name}"
                                    >
                                  `
                                : `
                                    <p class="text-xl text-gray-500">
                                        ${initials}
                                    </p>
                                  `
                        }
                    </div>


                    <!-- Details -->
                    <div class="min-w-0">

                        <div class="font-lg font-semibold capitalize truncate">
                            ${product.name}
                        </div>

                        <p class="stock text-sm text-gray-500 mt-1">
                            Stock: ${product.stock}
                        </p>

                        ${
                            product.isPack
                                ? `
                                    <p class="text-xs text-blue-500 mt-1">
                                        1pkg: ${formatCurrencysm(product.casePrice)}
                                        <span class="text-gray-400 mx-1">|</span>
                                        
                                    </p>
                                  `
                                : ``
                        }

                    </div>

                </div>


                <!-- Price + Actions -->
                <div class="flex flex-col items-end shrink-0">

                    <!-- Price -->
                    <div class="
                        text-lg
                        font-bold
                        text-blue-700
                        mb-2
                    ">
                        ${formatCurrencysm(product.price)}
                    </div>


                    <!-- Actions -->
                    <div class="flex items-center gap-2">

                        ${
                        product.isPack
                            ? `
                                <button
                                    class="add-pack bg-green-500 hover:bg-green-600 text-white
                                            font-semibold text-sm px-3 py-2 rounded-lg
                                            transition-colors cursor-pointer
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                    data-pack="${product.packSize}"
                                    ${product.stock < product.packSize ? "disabled" : ""}
                                >
                                    +Pkg
                                </button>
                              `
                            : ``
                    }

                        <button
                            class="
                                add-single
                                bg-blue-50
                                text-blue-700
                                px-3
                                py-1
                                rounded
                                hover:bg-blue-100
                                cursor-pointer
                                
                            "
                            data-pack="1"
                        >
                            +
                        </button>

                    </div>

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
