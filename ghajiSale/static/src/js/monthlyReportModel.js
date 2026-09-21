export const state ={
    dashboard:{},
    month: new Date().toISOString().slice(0, 7),
}
function createSimpleDashboard(data){
    return {
        weekly: data.weekly,
        summary: data.summary,
        monthly: data.monthly,
        profitCmp: data.profitCmp,
        glance: data.glance,
        revExp: data.revExp,
        expenses: data.expenses,
        kpis: data.kpis,
        peakHours: data.peakHours,
        categories: data.categories,
        topProducts: data.topProducts,
        targets: data.targets,
        yearly: data.yearly
    }
}
export async function loadDashboard(month = state.month) {
    state.month = month || state.month;
    const endpoints = {
        weekly:       '/api/dashboard/revenue/weekly/',
        summary:      '/api/dashboard/summary/',
        monthly:      '/api/dashboard/revenue/monthly/',
        profitCmp:    '/api/dashboard/profit/monthly-compare/',
        glance:       '/api/dashboard/month-glance/',
        revExp:       '/api/dashboard/revenue-expense/yearly/',
        expenses:     '/api/dashboard/expenses/',
        kpis:         '/api/dashboard/kpis/',
        peakHours:    '/api/dashboard/peak-hours/',
        categories:   '/api/dashboard/category-performance/',
        topProducts:  '/api/dashboard/products/top/',
        targets:      '/api/dashboard/targets/',
        yearly:       '/api/dashboard/yearly-breakdown/',
    }

  // Fire everything at once
    const fetches = Object.fromEntries(
        Object.entries(endpoints).map(([key, url]) => [
        key,
        fetch(`${url}?month=${encodeURIComponent(state.month)}`).then(r => r.json())
        ])
    )

  // Wait for all, but don't let one failure block the rest
    const results = {}
    for (const [key, promise] of Object.entries(fetches)) {
        try {
        results[key] = await promise
        } catch (e) {
        console.error(`Failed to load ${key}:`, e)
        results[key] = null
        }
    }

  // Populate each section
    state.dashboard = createSimpleDashboard(results);
    console.log(state.dashboard);
}

export async function loadTopProducts(search = '') {
    const response = await fetch(`/api/dashboard/products/top/?month=${encodeURIComponent(state.month)}&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error('Unable to load products.');
    return response.json();
}
