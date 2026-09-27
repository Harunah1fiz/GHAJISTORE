import View from "../views/View.js"

class MonthAtGlanceView extends View{
    _parentElement = document.querySelector('.story-grid')

    _generateMarkup(){
        if (!this._data || !Array.isArray(this._data.insights)) return '';

        return this._data.insights.map((insight, index) => {
            const label = (insight.type || 'info').charAt(0).toUpperCase() + (insight.type || 'info').slice(1);
            const text = insight.text || '';
            const shortText = text.split('.').slice(0, 2).join('.');
            return `
                <button type="button" class="story-card ${insight.type} p-4 text-left cursor-pointer" data-glance-index="${index}" data-glance-type="${insight.type}">
                    <div class="story-card-inner">
                        <div class="story-card-label">${label}</div>
                        <p>${shortText}</p>
                    </div>
                </button>
            `;
        }).join('');
    }

    bindDetailModal() {
        const parent = this._parentElement;
        if (!parent) return;
        parent.querySelectorAll('[data-glance-index]').forEach((card) => {
            card.addEventListener('click', () => {
                const index = Number(card.dataset.glanceIndex);
                const insight = this._data?.insights?.[index];
                if (!insight) return;
                this.openInsightModal(insight, index);
            });
        });
    }

    openInsightModal(insight, index) {
        const modal = document.getElementById('moduleDetailModal');
        const title = document.getElementById('moduleDetailTitle');
        const subtitle = document.getElementById('moduleDetailSubtitle');
        const body = document.getElementById('moduleDetailBody');
        if (!modal || !title || !subtitle || !body) return;

        const label = (insight.type || 'info').charAt(0).toUpperCase() + (insight.type || 'info').slice(1);
        title.textContent = `Month at a Glance — ${label}`;
        subtitle.textContent = `Insight ${index + 1}`;
        body.innerHTML = `
            <div class="space-y-4">
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div class="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-2">Summary</div>
                    <p class="text-sm text-slate-700 leading-6">${insight.text || 'No detail available.'}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div class="rounded-xl border border-slate-200 p-3">
                        <div class="text-[11px] uppercase tracking-[0.12em] text-slate-500">Type</div>
                        <div class="mt-2 font-semibold">${label}</div>
                    </div>
                    <div class="rounded-xl border border-slate-200 p-3">
                        <div class="text-[11px] uppercase tracking-[0.12em] text-slate-500">Context</div>
                        <div class="mt-2 font-semibold">Current month performance</div>
                    </div>
                </div>
                <div class="rounded-xl border border-l border-slate-200 p-3">
                    <div class="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-2">What this means</div>
                    <p class="text-sm text-slate-700 leading-6">This insight is based on the current month’s live sales, profit, expense, low-stock, and category data already available to the dashboard. It highlights the operational trend most relevant to this metric and helps managers decide whether action is needed.</p>
                </div>
            </div>
        `;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    render(data) {
        this._data = data;
        this._clear();
        if (!this._parentElement) return;
        this._parentElement.innerHTML = this._generateMarkup();
        this.bindDetailModal();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}
export default new MonthAtGlanceView()