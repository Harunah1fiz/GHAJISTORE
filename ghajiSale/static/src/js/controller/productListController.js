import suggestionView from "../addProdutView/suggestionView.js"
import * as model from "../productListModel.js"
import inventoryView from "../views/inventoryView.js";
import product_listView from "../views/productListView/product_listView.js"
import searchView from "../views/searchView.js"
lucide.createIcons();

// Filtering and sorting for product list
(function(){
  const filterButtons = document.querySelectorAll('.filter-btn');
  const tbody = document.querySelector('.product_table tbody.attribute');
  if (!tbody || !filterButtons.length) return;
  let currentFilter = 'all';

  const applyFilter = (filter) => {
    currentFilter = filter;
    filterButtons.forEach(b => b.classList.toggle('active', b.textContent.trim().toLowerCase() === filter));
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.forEach(row => {
      const badge = row.querySelector('.status-badge');
      let status = badge ? Array.from(badge.classList).find(c => c.startsWith('status-')) : null;
      status = status ? status.replace('status-', '') : badge?.textContent?.trim().toLowerCase() || '';
      if (filter === 'all') {
        row.style.display = '';
        return;
      }
      // map UI label to internal status values
      const map = { 'out': 'out', 'critical': 'critical', 'low': 'slow-moving', 'healthy': 'healthy' };
      const expected = map[filter] || filter;
      row.style.display = (status === expected) ? '' : 'none';
    });
  };

  filterButtons.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); applyFilter(btn.textContent.trim().toLowerCase()); }));

  // Sorting: Total Earning column header
  const headers = Array.from(document.querySelectorAll('.product_table thead th'));
  const targetIdx = headers.findIndex(th => /total\s*earning/i.test(th.textContent));
  if (targetIdx >= 0) {
    let asc = true;
    headers[targetIdx].style.cursor = 'pointer';
    headers[targetIdx].addEventListener('click', () => {
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a,b) => {
        const aText = a.children[targetIdx].textContent || '';
        const bText = b.children[targetIdx].textContent || '';
        const aNum = Number(aText.replace(/[^\d.-]+/g, '')) || 0;
        const bNum = Number(bText.replace(/[^\d.-]+/g, '')) || 0;
        return asc ? aNum - bNum : bNum - aNum;
      });
      asc = !asc;
      // re-append rows
      rows.forEach(r => tbody.appendChild(r));
    });
  }
})();

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