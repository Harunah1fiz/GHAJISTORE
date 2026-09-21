import { fmt } from '../helper.js';

class MonthlyDetailsView {
  renderCategories(data) {
    const parent = document.querySelector('#category-performance');
    if (!parent) return;
    parent.innerHTML = (data?.categories || []).map(category => `
      <div class="neu-inset p-4"><div class="flex justify-between gap-3"><div><div class="font-semibold text-sm">${category.category}</div><div class="text-[11px] text-gray-400">${category.quantity_sold} units sold</div></div><span class="text-xs text-sky-700 font-semibold">${category.percentage_contribution}%</span></div><div class="grid grid-cols-2 gap-3 mt-4 text-sm"><div><div class="text-[10px] text-gray-400 uppercase">Revenue</div><div class="font-bold">${fmt(category.revenue)}</div></div><div><div class="text-[10px] text-gray-400 uppercase">Profit</div><div class="font-bold text-emerald-700">${fmt(category.profit)}</div></div></div></div>`).join('') || '<p class="text-sm text-gray-400">No category sales for this month.</p>';
  }

  renderProducts(data) {
    const parent = document.querySelector('#top-products-body');
    if (!parent) return;
    const total = (data?.products || []).reduce((sum, product) => sum + Number(product.revenue), 0);
    parent.innerHTML = (data?.products || []).map(product => `<tr class="border-t border-white/10"><td class="py-3 pl-2"><div class="font-medium">${product.name}</div><div class="text-[11px] text-gray-400">${product.category || 'Uncategorised'}</div></td><td class="text-right">${product.units_sold}</td><td class="text-right font-medium">${fmt(product.revenue)}</td><td class="text-right text-emerald-700">${fmt(product.profit)}</td><td class="text-right pr-2">${total ? ((product.revenue / total) * 100).toFixed(1) : 0}%</td></tr>`).join('') || '<tr><td colspan="5" class="py-5 text-center text-gray-400">No products sold this month.</td></tr>';
  }

  renderTargets(data) {
    const parent = document.querySelector('#sales-targets');
    if (!parent) return;
    parent.innerHTML = (data?.targets || []).map(target => { const percent = Math.min(target.achieved_percent, 100); return `<div><div class="flex justify-between mb-2"><span class="text-xs text-gray-400">${target.name}</span><span class="text-xs font-semibold">${target.achieved_percent}%</span></div><div class="h-2 rounded-full bg-slate-200 overflow-hidden"><div class="h-full bg-sky-500/60 rounded-full" style="width:${percent}%"></div></div></div>`; }).join('');
  }
}

export default new MonthlyDetailsView();
