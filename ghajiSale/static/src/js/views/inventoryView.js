class InventoryView {
    _parentElement = document.querySelector('.inventory__view')

    addHandlerRemoveMessage(){
    const alertEl = document.querySelector(".alert")
    if (!alertEl) return;

    setTimeout(() => {
        alertEl.classList.add("fade-out");

        setTimeout(() => {
            alertEl.remove();
        }, 300);

    }, 4000);

    alertEl.querySelector(".close")?.addEventListener("click", () => {
        alertEl.remove();
    });
        
    }

    bindSummaryModal() {
        const cards = document.querySelectorAll('.inventory-summary-card');
        if (!cards.length) return;

        cards.forEach((card) => {
            card.addEventListener('click', () => {
                const summaryType = card.dataset.summaryType;
                const summaryTitle = card.dataset.summaryTitle || 'Inventory summary';
                const summaryHint = card.dataset.summaryHint || '';
                const details = this._buildSummaryDetails(summaryType);
                this.openSummaryModal(summaryTitle, summaryHint, details);
            });
        });
    }

    _buildSummaryDetails(summaryType) {
        const nodes = {
            belowThreshold: Array.from(document.querySelectorAll('.alert-item')).map((item) => {
                const name = item.querySelector('.alert-product-name')?.textContent?.trim();
                const quantity = item.querySelector('.alert-stat-value')?.textContent?.trim();
                const reorder = item.querySelector('.reorder-btn a')?.getAttribute('href') || '#';
                return name ? { name, quantity, reorder } : null;
            }).filter(Boolean),
            'out-of-stock': Array.from(document.querySelectorAll('.alert-item')).map((item) => {
                const text = item.querySelector('.alert-product-name')?.textContent?.trim();
                return text ? { name: text, quantity: '0', reorder: item.querySelector('.reorder-btn a')?.getAttribute('href') || '#' } : null;
            }).filter(Boolean),
            'damaged-units': Array.from(document.querySelectorAll('.inventory-summary-card')).map((card) => {
                const title = card.dataset.summaryTitle;
                const count = card.dataset.summaryItems;
                return title ? { name: title, quantity: count || '0' } : null;
            }).filter(Boolean),
            'total-stock': [{ name: 'Current stock', quantity: document.querySelector('[data-summary-type="total-stock"] .stat-value')?.textContent?.trim() || '0' }],
            'products-in-stock': [{ name: 'Tracked products', quantity: document.querySelector('[data-summary-type="products-in-stock"] .stat-value')?.textContent?.trim() || '0' }],
            'total-inventory-value': [{ name: 'Inventory value', quantity: document.querySelector('[data-summary-type="total-inventory-value"] .stat-value')?.textContent?.trim() || '₦0.00' }]
        };
        return nodes[summaryType] || [];
    }

    openSummaryModal(title, hint, items) {
        const modal = document.getElementById('moduleDetailModal') || document.querySelector('.module-detail-modal');
        const titleNode = document.getElementById('moduleDetailTitle');
        const subtitleNode = document.getElementById('moduleDetailSubtitle');
        const bodyNode = document.getElementById('moduleDetailBody');
        if (!modal || !titleNode || !subtitleNode || !bodyNode) return;

        titleNode.textContent = title;
        subtitleNode.textContent = hint || 'Inventory summary';
        if (!items || !items.length) {
            bodyNode.innerHTML = '<div class="text-sm text-slate-500">No products are currently in this category.</div>';
        } else {
            bodyNode.innerHTML = items.map((item) => `
                <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 mb-2">
                    <div>
                        <div class="font-medium text-sm text-slate-800">${item.name || 'Unnamed product'}</div>
                        <div class="text-[11px] text-slate-500">${item.quantity || '0'} units</div>
                    </div>
                    ${item.reorder ? `<a href="${item.reorder}" class="text-xs font-medium text-blue-600">View</a>` : ''}
                </div>
            `).join('');
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}

export default new InventoryView()