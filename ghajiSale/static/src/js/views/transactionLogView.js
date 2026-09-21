import { displayDay, displayTime, fmt } from "../helper.js";
import View from "./View.js";

class TransactionLogView extends View{
    _parentElement = document.querySelector('.offline-transactions');

    _generateMarkup(){
        return this._data.map(this._markupRow).join("");
    }
    addhandlerLoad(handler){
        window.addEventListener("load",()=>{
            handler();
        })
    }
    _markupRow(transaction){
        return ` 
        <tr class="border-t border-white/10">
            <td class="px-5 py-2.5 text-gray-400 tabular-nums">
            ${displayDay(transaction.createdAt)}
            </td>
            <td class="px-5 py-2.5 text-gray-400 tabular-nums">
                <span
                    class="block max-w-15 truncate"
                    title="${transaction.transactionId}">
                    ${transaction.transactionId}
                </span>
            </td>
            <td class="px-5 py-2.5 text-right font-medium">
            ${fmt(transaction.total)}
            </td>
            <td class="px-5 py-2.5 text-gray-400 text-center">
            ${transaction.method || 0}
            </td>
            <td class="px-5 py-2.5 text-gray-400">
            ${transaction.syncAttempt || 0}
            </td>
            <td class="px-5 py-2.5">
            <span class="px-2 py-1 text-xs rounded-full ${transaction.syncStatus === 'synced' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}">
                ${transaction.syncStatus === 'synced' ? 'Success' : 'pending'}
            </span>
            </td>
            <td class="px-5 py-2.5 text-gray-400">
            ${displayTime(transaction.createdAt)}
            </td>
        </tr>
        
        `
    }

}

export default new TransactionLogView();