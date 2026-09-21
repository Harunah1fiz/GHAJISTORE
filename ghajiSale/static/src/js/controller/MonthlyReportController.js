import expensesView from '../DashboardView/expensesView.js';
import expenseVsprofitView from '../DashboardView/expenseVsprofitView.js';
import monthAtGlanceView from '../DashboardView/monthAtGlanceView.js';
import monthComp from '../DashboardView/monthComp.js';
import monthlyRevenueView from '../DashboardView/monthlyRevenueView.js';
import monthlySummaryView from '../DashboardView/monthlySummaryView.js';
import peakHoursView from '../DashboardView/peakHoursView.js';
import quickMetric from '../DashboardView/quickMetric.js';
import weeklyRevenueView from '../DashboardView/weeklyRevenueView.js';
import monthlyDetailsView from '../DashboardView/monthlyDetailsView.js';
import yearlyView from '../DashboardView/yearlyView.js';
import * as model from '../monthlyReportModel.js';
import reportView from '../views/reportView.js';
lucide.createIcons();



const controlLoadData = async function(){
    await model.loadDashboard(document.querySelector('#month')?.value || model.state.month)
    
    weeklyRevenueView.render(model.state.dashboard.weekly)
    monthlySummaryView.render(model.state.dashboard.summary)
    monthlyRevenueView.render(model.state.dashboard.monthly)
    monthComp.render(model.state.dashboard.profitCmp)
    monthAtGlanceView.render(model.state.dashboard.glance)
    expenseVsprofitView.render(model.state.dashboard.revExp)
    expensesView.render(model.state.dashboard.expenses)
    quickMetric.render(model.state.dashboard.kpis)
    peakHoursView.render(model.state.dashboard.peakHours)
    monthlyDetailsView.renderCategories(model.state.dashboard.categories)
    monthlyDetailsView.renderProducts(model.state.dashboard.topProducts)
    monthlyDetailsView.renderTargets(model.state.dashboard.targets)
    yearlyView.render(model.state.dashboard.yearly?.yearly || [])
}



function init(){
    const monthInput = document.querySelector('#month');
    if (monthInput) {
        monthInput.value = model.state.month;
        monthInput.addEventListener('change', controlLoadData);
    }
    document.querySelector('#top-products-search')?.addEventListener('input', async (event) => {
        try { monthlyDetailsView.renderProducts(await model.loadTopProducts(event.target.value)); } catch (error) { console.error(error); }
    });
    reportView.addHandlerLoadData(controlLoadData)
}

init()
