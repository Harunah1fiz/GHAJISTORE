import { fmt } from '../helper.js';

class MonthlyDetailsView {
  constructor(){
    this._categories = [];
    this._products = [];
    this._categoryParent = document.querySelector('#category-performance');
    this._productsParent = document.querySelector('#top-products-body');
    this._modal = document.getElementById('moduleDetailModal');
    this._modalTitle = document.getElementById('moduleDetailTitle');
    this._modalSubtitle = document.getElementById('moduleDetailSubtitle');
    this._modalBody = document.getElementById('moduleDetailBody');
    this._closeBtn = document.getElementById('closeModuleDetail');

    if (this._closeBtn) this._closeBtn.addEventListener('click', () => this.closeModal());
    if (this._modal) this._modal.addEventListener('click', (e) => { if (e.target === this._modal) this.closeModal(); });

    // Delegated click handlers
    this._categoryParent?.addEventListener('click', (e) => {
      const card = e.target.closest('.neu-inset');
      if (!card) return;
      const idx = Number(card.dataset.catIndex);
      this.openCategoryDetail(idx);
    });

    this._productsParent?.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;
      const idx = Number(row.dataset.prodIndex);
      this.openProductDetail(idx);
    });
  }

  renderCategories(data) {
    const parent = this._categoryParent;
    if (!parent) return;
    const categories = data?.categories || [];
    this._categories = categories;
    parent.innerHTML = categories.length ? categories.map((category, i) => `
      <div class="neu-inset p-4" data-cat-index="${i}">
        <div class="flex justify-between gap-3">
          <div>
            <div class="font-semibold text-sm">${category.category}</div>
            <div class="text-[11px] text-gray-400">${category.quantity_sold} units sold</div>
          </div>
          <span class="text-xs text-sky-700 font-semibold">${category.percentage_contribution}%</span>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <div class="text-[10px] text-gray-400 uppercase">Revenue</div>
            <div class="font-bold">${fmt(category.revenue)}</div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase">Profit</div>
            <div class="font-bold text-emerald-700">${fmt(category.profit)}</div>
          </div>
        </div>
      </div>`).join('') : '<p class="text-sm text-gray-400">No category sales for this month.</p>';
  }

  renderProducts(data) {
    const parent = this._productsParent;
    if (!parent) return;
    const products = data?.products || [];
    this._products = products;
    const total = products.reduce((sum, product) => sum + Number(product.revenue), 0);
    parent.innerHTML = products.length ? products.map((product, i) => `<tr class="border-t border-white/10" data-prod-index="${i}"><td class="py-3 pl-2"><div class="font-medium">${product.name}</div><div class="text-[11px] text-gray-400">${product.category || 'Uncategorised'}</div></td><td class="text-right">${product.units_sold}</td><td class="text-right font-medium">${fmt(product.revenue)}</td><td class="text-right text-emerald-700">${fmt(product.profit)}</td><td class="text-right pr-2">${total ? ((product.revenue / total) * 100).toFixed(1) : 0}%</td></tr>`).join('') : '<tr><td colspan="5" class="py-5 text-center text-gray-400">No products sold this month.</td></tr>';
  }

  renderTargets(data) {
    const parent = document.querySelector('#sales-targets');
    if (!parent) return;
    parent.innerHTML = (data?.targets || []).map(target => { const percent = Math.min(target.achieved_percent, 100); return `<div><div class="flex justify-between mb-2"><span class="text-xs text-gray-400">${target.name}</span><span class="text-xs font-semibold">${target.achieved_percent}%</span></div><div class="h-2 rounded-full bg-slate-200 overflow-hidden"><div class="h-full bg-sky-500/60 rounded-full" style="width:${percent}%"></div></div></div>`; }).join('');
  }

  openCategoryDetail(index){
    const cat = this._categories[index];
    if(!cat) return;
    this._modalTitle.textContent = `${cat.category} — ${fmt(cat.revenue)}`;
    this._modalSubtitle.textContent = `${cat.quantity_sold} units sold — ${cat.percentage_contribution}% of revenue`;
    this._modalBody.innerHTML = `
      <div class="grid grid-cols-2 gap-4">
        <div><strong>Revenue</strong><div>${fmt(cat.revenue)}</div></div>
        <div><strong>Profit</strong><div>${fmt(cat.profit)}</div></div>
      </div>
      <div class="mt-4"><strong>Monthly breakdown</strong></div>
      <div class="mt-2">
        ${(cat.monthly_chart || []).map(row => `<div class="flex justify-between text-xs"><span>${row.month}</span><span>${fmt(row.revenue)}</span></div>`).join('')}
      </div>
    `;
    this._modal.classList.add('active');
    this._modal.setAttribute('aria-hidden', 'false');
  }

  openProductDetail(index){
    const p = this._products[index];
    if(!p) return;
    this._modalTitle.textContent = `${p.name}`;
    this._modalSubtitle.textContent = `${p.category || 'Uncategorised'}`;
    this._modalBody.innerHTML = `
      <div class="grid grid-cols-2 gap-4">
        <div><strong>Revenue</strong><div>${fmt(p.revenue)}</div></div>
        <div><strong>Units sold</strong><div>${p.units_sold}</div></div>
      </div>
      <div class="mt-4"><strong>Profit</strong><div>${fmt(p.profit)}</div></div>
    `;
    this._modal.classList.add('active');
    this._modal.setAttribute('aria-hidden', 'false');
  }

  closeModal(){
    this._modal.classList.remove('active');
    this._modal.setAttribute('aria-hidden', 'true');
  }
}

export default new MonthlyDetailsView();
