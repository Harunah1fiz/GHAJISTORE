import { dayDiff } from "./helper.js";
import { storage } from "./utils/storage.js";
import { getCSRFToken } from "./helper.js";

export const state = {
    reportDate: new Date(),
    selectedDate: new Date(),
    dailySummary : {},
    dailyReport : {},
    reports: {
        stockAdjustment :{
            product:{},
            quantity:0,
            action: "deduct",
        }
    }
}
const formatDate = (date)=>{
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");

    return `${year}-${month}-${day}`
}
const normalizeDate = function(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const setDate = function(value) {
    const normalized = normalizeDate(value);
    if (!normalized) return;
    state.selectedDate = normalized;
};

export const getDate = function() {
    const newDateStr = formatDate(state.selectedDate)
    return newDateStr
};

export const setCurrentDate = function(date) {
    const normalized = normalizeDate(date);
    if (!normalized) return;
    state.selectedDate = normalized;
};

export const getCurrentDate = function() {
    return state.selectedDate;
};

export const previousDay = function() {
    state.selectedDate.setDate(state.selectedDate.getDate() - 1);
};

export const nextDay = function() {
    const today = normalizeDate(new Date());
    if (normalizeDate(state.selectedDate) < today) {
        state.selectedDate.setDate(state.selectedDate.getDate() + 1);
    }
};

export const canGoNext = function() {
    const today = normalizeDate(new Date());
    return normalizeDate(state.selectedDate).toDateString() !== today.toDateString();
};

export const getLabel = function() {
    const today = normalizeDate(new Date());
    const selected = normalizeDate(state.selectedDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (selected.toDateString() === today.toDateString()) return "Today";
    if (selected.toDateString() === yesterday.toDateString()) return "Yesterday";

    const daypassed = dayDiff(today, selected);
    if (daypassed > 1 && daypassed < 7) return selected.toLocaleDateString("en-US", { weekday: 'long' });

    return selected.toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' });
};
const handleError = (message) => {
  showToast(message || "Something went wrong, please try again.",'e');
};

    const parseJSON = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch (err) {
        return {};
    }
    }
export const fetchDailySummary = async (date)=>{
    try{
        const response = await fetch(`/reports/api/daily-report/?date=${date}`);
        const data = await parseJSON(response);
        if (!response.ok) {
            throw new Error(data.error || "Failed to load daily report data");
        }
        state.dailySummary = data;

    }
    catch(error){
        throw error
    }
}

export const fetchDailyReport = async (date)=>{
    try{
        const response = await fetch(`/reports/api/reports/?date=${date}`);
        const data = await parseJSON(response);
        if(!response.ok){
            throw new Error(data.error || "Failed to load reports list");
        }
        state.dailyReport = data
    }catch(error){
        throw error
    }
}

export const saveReport = async (type, payload, reportId = null) => {
    const url = reportId
        ? `/reports/api/reports/${type}/${reportId}/`
        : `/reports/api/reports/${type}/?date=${getDate()}`;
    const response = await fetch(url, {
        method: reportId ? "PUT" : "POST",
        credentials: "same-origin",
        headers: {"Content-Type": "application/json", "X-CSRFToken": getCSRFToken()},
        body: JSON.stringify(payload),
    });
    const data = await parseJSON(response);
    if (!response.ok) throw new Error(data.error || "Failed to save report.");
    return data;
};

export const removeReport = async (type, reportId) => {
    const response = await fetch(`/reports/api/reports/${type}/${reportId}/delete/`, {
        method: "DELETE", credentials: "same-origin", headers: {"X-CSRFToken": getCSRFToken()},
    });
    const data = await parseJSON(response);
    if (!response.ok) throw new Error(data.error || "Failed to delete report.");
    return data;
};

export const submitEndShift = async (payload) => {
    const response = await fetch(`/reports/api/end-shift/?date=${getDate()}`, {
        method: "POST", credentials: "same-origin",
        headers: {"Content-Type": "application/json", "X-CSRFToken": getCSRFToken()}, body: JSON.stringify(payload),
    });
    const data = await parseJSON(response);
    if (!response.ok) throw new Error(data.error || "Failed to submit end-of-shift report.");
    return data;
};

export const getProduct = (data) =>{
    const {id, barcode} = data
    let products = storage.getProducts()
    console.log(data);
    let result = products.find(ele => ele.id == id)
    state.reports.stockAdjustment.product = result

    return result
}
