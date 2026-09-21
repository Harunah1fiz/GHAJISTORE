import productSearchView from "../addProdutView/productSearchView.js";
import { getCSRFToken, showToast } from "../helper.js";
import { loadProductSuggestions } from "../ProductInvmodel.js";
import * as model from "../reportModel.js";
import { syncOfflineSales } from "../salesModel.js";
import { playSound } from "../utils/sound.js";
import { OfflineSale, reportTemplates, storage } from "../utils/storage.js";
import DateChangeView from "../views/DateChangeView.js";
import makeReportView from "../views/makeReportView.js";
import ProductSuggestView from "../views/productSuggestView.js";
import reportView from "../views/reportView.js";
import transactionLogView from "../views/transactionLogView.js";
lucide.createIcons();

const endpoints = {
  expense: "/reports/api/reports/expense/",
  stock: "/reports/api/reports/stock/",
  cash: "/reports/api/reports/cash/",
  incident: "/reports/api/reports/incident/",
};

let activeReportType = null;
let activeReportId = null;

const parseJSON = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    return {};
  }
};

const getReportTemplate = (type) => {
  const template = reportTemplates[type];
  if (!template) return null;

  const copy = JSON.parse(JSON.stringify(template));
  if (type === "stock") {
    const products = storage.getProducts() || [];
    
    // copy.fields = copy.fields.map((field) => {
    //   if (field.id != "product") return field;
    //   const productOptions = products.map((product) => ({
    //     value: product.id,
    //     label: product.name,
    //   }));
    //   if (productOptions.length === 0) {
    //     return {
    //       ...field,
    //       options: [{ value: "", label: "No products available", disabled: true }],
    //     };
    //   }
    //   return {
    //     ...field,
    //     options: productOptions,
    //   };
    // });
  }

  return copy;
};

const handleError = (message) => {
  showToast(message || "Something went wrong, please try again.",'e');
};


const controlDisplayReportCards = async (date)=>{
  try{
    await model.fetchDailySummary(date)
    console.log(model.state.dailySummary);
    reportView.renderReportCards(model.state.dailySummary)
  }
  catch(error){
    handleError(error.message)
  }
}
const controlReportDisplay = async (date)=>{
  try{
    await model.fetchDailyReport(date)
    console.log(model.state.dailyReport);
    reportView.renderReportsList(model.state.dailyReport.reports|| [])
  }
  catch(error){
    handleError(error.message)
  }
}



const loadReportData = async () => {
  const date = model.getDate();
  console.log('play');
  await Promise.all([controlDisplayReportCards(date), controlReportDisplay(date)]);
};

const validateReportPayload = (type, payload) => {
  const errors = [];

  const requiredString = (name, label) => {
    console.log(payload);
    console.log(payload[name],label);
    
    if (!payload[name] || !String(payload[name]).trim()) {
      errors.push(`${label} is required.`);
    }
  };

  const requiredPositiveNumber = (name, label) => {
    const value = Number(payload[name]);
    if (Number.isNaN(value) || String(payload[name]).trim() === "") {
      errors.push(`${label} must be a valid number.`);
      return;
    }
    if (value <= 0) {
      errors.push(`${label} must be greater than zero.`);
    }
  };

  const requiredNonNegativeNumber = (name, label) => {
    const value = Number(payload[name]);
    if (Number.isNaN(value) || String(payload[name]).trim() === "") {
      errors.push(`${label} must be a valid number.`);
      return;
    }
    if (value < 0) {
      errors.push(`${label} cannot be negative.`);
    }
  };

  switch (type) {
    case "expense":
      requiredString("category", "Expense category");
      requiredPositiveNumber("amount", "Amount");
      requiredString("description", "Description");
      break;
    case "stock":
      requiredString("product_id", "Product");
      requiredPositiveNumber("quantity", "Quantity");
      requiredString("reason", "Reason");
      break;
    case "cash":
      requiredNonNegativeNumber("expected", "Expected cash");
      requiredNonNegativeNumber("counted", "Counted cash");
      requiredString("reason", "Reason");
      break;
    case "incident":
      requiredString("title", "Title");
      requiredString("severity", "Severity");
      requiredString("description", "Description");
      break;
    default:
      errors.push("Unknown report type.");
  }

  return errors;
};

const buildPayload = (type, formData) => {
  const payload = {};
  for (const [key, value] of formData.entries()) {
    console.log(key,value);
    payload[key] = value;
  }

  if (type === "stock") {
    let product = model.state.reports.stockAdjustment.product
    payload.product_id = product.id;
    payload.product = product.name
    delete payload.product;
    console.log(payload);
  }

  return payload;
  
};

const submitReport = async (formData) => {
  if (!activeReportType) {
    handleError("Unable to determine report type.");
    return;
  }

  const payload = buildPayload(activeReportType, formData);
  const errors = validateReportPayload(activeReportType, payload);
  if (errors.length) {
    handleError(errors[0]);
    return;
  }

  const endpoint = endpoints[activeReportType];
  if (!endpoint) {
    handleError("Report endpoint not found.");
    return;
  }

  const button = document.querySelector('#reportForm button[type="submit"]');
  const originalText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Submitting...";
  }

  try {
    await model.saveReport(activeReportType, payload, activeReportId);

    makeReportView.close();
    showToast(activeReportId ? "Report updated successfully." : "Report submitted successfully.");
    activeReportId = null;
    await loadReportData();
  } catch (error) {
    handleError(error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText || "Submit Report";
    }
  }
};
let searchElement
let dropDownSearch;
let suggestContainer;
let suggestView;
let selectedProduct = null
const controlSearch = ()=>{
      try{
      const query = dropDownSearch.getQuery()

      if(!query){
        suggestView.hide()
        return
      }
      suggestView.show()
      const data = loadProductSuggestions(query)
      console.log(model.state);
      console.log(data);
      suggestView.render(data)
    }
    
    
    catch(error){
      handleError(error.message,'e')
      suggestView.renderError(error.message)
    }
  }
const controlDisplayModal = (type, report = null) => {
  activeReportType = type;
  activeReportId = report?.id || null;
  if (type === "stock" && report?.details?.product_id) {
    model.state.reports.stockAdjustment.product = {
      id: report.details.product_id,
      name: report.details.product,
    };
  }
  const template = getReportTemplate(type);
  if (!template) {
    showToast("Unsupported report type.");
    return;
  }
  makeReportView.renderModal(template, report?.details || {}, Boolean(report));
  if(type == 'stock'){
    
      searchElement = document.querySelector('.search__container')
    dropDownSearch = new productSearchView(searchElement)
    suggestContainer = document.querySelector('.search_suggest')
    suggestView = new ProductSuggestView(suggestContainer)
    
    dropDownSearch.addHandlerSearch(controlSearch)
    suggestView.addHandlerSelect((data)=>{
      selectedProduct = model.getProduct(data);
      console.log(selectedProduct);
      dropDownSearch.setValue(`${selectedProduct.name}`)
      suggestView.hide()
    })
    
}};

const controlEditReport = (report) => controlDisplayModal(report.type, report);

const controlDeleteReport = async (report) => {
  if (!window.confirm(`Delete this ${report.title}?`)) return;
  try {
    await model.removeReport(report.type, report.id);
    showToast("Report deleted successfully.");
    await loadReportData();
  } catch (error) { handleError(error.message); }
};

const controlEndShift = async (formData, button) => {
  const countedCash = formData.get('counted_cash');
  const notes = String(formData.get('notes') || '').trim();
  if (countedCash === '' || Number.isNaN(Number(countedCash)) || Number(countedCash) < 0 || !notes) {
    handleError('Enter a valid counted cash amount and notes.'); return;
  }
  button.disabled = true; button.textContent = 'Submitting...';
  try { await model.submitEndShift({counted_cash: countedCash, notes}); reportView.closeEndShift(); showToast('End-of-shift report submitted.'); await loadReportData(); }
  catch (error) { handleError(error.message); }
  finally { button.disabled = false; button.textContent = 'Submit End-of-Shift Report'; }
};

const controlDateSelection = (type, label) => {
  let date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(type)) {
    date = new Date(type);
    if (Number.isNaN(date.getTime())) {
      showToast("Invalid date selected.");
      return;
    }
  } else {
    date = new Date();
    switch (type) {
      case "today":
        date = new Date();
        break;
      case "yesterday":
        date = new Date();
        date.setDate(date.getDate() - 1);
        break;
      case "last3days":
      case "last7days":
      case "last14days":
      case "thisweek":
      case "lastweek":
      case "thismonth":
      case "lastmonth":
        showToast("Please pick a specific day or use the chevron nav for daily reports.",'e');
        return;
      default:
        showToast("Unknown selection.");
        return;
    }
  }

  model.setDate(date);
  reportView.setDate(model.getDate());
  reportView.setReportTitle(label);
  updateNavigation();
  loadReportData();
};

const updateNavigation = () => {
  DateChangeView.updateNavigation({
    label: model.getLabel(),
    canGoNext: model.canGoNext(),
  });
  reportView.setReportTitle(model.getLabel());
};

const controlDateNavigation = (direction) => {
  if (direction === "prev") model.previousDay();
  else model.nextDay();
  reportView.setDate(model.getDate());
  updateNavigation();
  loadReportData();
};

const controlPendingTransaction = () => {
  const pendingTransactions = OfflineSale.getOfflineSales();
  if (pendingTransactions.length > 0) {
    transactionLogView.render(pendingTransactions);
  }
};

// ── Offline Sync ──────────────────────────────────────────────────────────────
// OFFLINE QUEUE VISIBILITY + POS AUDIO: Update queue indicator and play sounds

const controlSync = async function () {
  try {
    const syncBtn = document.querySelector(".btn-sync");
    const syncText = document.querySelector(".sync-text");

    syncBtn.disabled = true;
    syncText.textContent = "Syncing...";

    await syncOfflineSales();

    syncText.textContent = "Sync";
    syncBtn.disabled = false;

    playSound("success")
    transactionLogView.render(OfflineSale.getOfflineSales())

  } catch (err) {
    console.error("Sync error:", err);
    playSound("error");

    const syncText = document.querySelector(".sync-text");
    syncText.textContent = "Sync";

    const syncBtn = document.querySelector(".btn-sync");
    syncBtn.disabled = false;
  }
};

const controlSearchView = ()=>{
  let productSearch
  const query = productSearchView.getQuery()
  console.log(query);
}

const init = () => {
  model.setDate(new Date());
  reportView.setDate(model.getDate());
  updateNavigation();

  reportView.addHandlerLoadData(loadReportData);
  reportView.addHandlerDropdown(controlDateSelection);
  reportView.addHandlerPickDate((dateValue) => controlDateSelection(dateValue, `Daily Report for ${dateValue}`));
  makeReportView.addHandlerReportModal(controlDisplayModal);
  makeReportView.addHandlerSubmit(submitReport);
  reportView.addHandlerEditDeleteReport(controlEditReport, controlDeleteReport);
  reportView.addHandlerEndShift(controlEndShift);
  transactionLogView.addhandlerLoad(controlPendingTransaction);
  DateChangeView.addHandlerDateNavigation(controlDateNavigation);
  
    // 1. Sync button
  const syncBtn = document.querySelector(".btn-sync");
  syncBtn?.addEventListener("click", controlSync);
};

init();
