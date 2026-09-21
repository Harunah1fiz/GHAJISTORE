import { getReportStyle } from "../helper.js";

class ReportView {
  _data;
  _currentDate = new Date();
  _parentElement = document.querySelector(".report-view");

  _dateBtn = document.getElementById("report-date-btn");
  _dropdown = document.getElementById("report-dropdown");
  _pickDateBtn = document.getElementById("pick-date-btn");
  _dateModal = document.getElementById("date-modal");
  _cancelDate = document.getElementById("cancel-date");
  _reportDateText = document.getElementById("report-date-text");
  _dateInput = document.getElementById("report-date-input");
  _applyDate = document.getElementById("apply-date");

  setDate(dateString) {
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) {
      this._currentDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
    }
  }

  getDate() {
    return this._currentDate.toISOString().slice(0, 10);
  }

  setReportTitle(title) {
    this._reportDateText.textContent = title;
  }

  addHandlerDropdown(handler) {
    this._dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      this._dropdown.classList.add("hidden");
    });

    this._dropdown.addEventListener("click", (e) => {
      const option = e.target.closest(".dropdown-option");
      if (!option) return;
      this._dropdown.classList.add("hidden");
      handler(option.dataset.type, option.textContent.trim());
    });
  }

  addHandlerPickDate(handler) {
    this._pickDateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._dateModal.classList.remove("hidden");
      this._dateModal.classList.add("flex");
    });

    this._cancelDate.addEventListener("click", () => {
      this._dateModal.classList.add("hidden");
      this._dateModal.classList.remove("flex");
    });

    this._applyDate.addEventListener("click", () => {
      if (this._dateInput.value === "") return;
      handler(
        this._dateInput.value,
        `Daily Report for ${this._dateInput.value}`,
      );
      this._dateModal.classList.add("hidden");
      this._dateModal.classList.remove("flex");
    });
  }

  addHandlerChevronNav(handler) {
    this._parentElement.querySelectorAll(".cheveron").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const direction = btn.dataset.direction;
        handler(direction);
      });
    });
  }

  addHandlerLoadData(handler) {
    window.addEventListener("DOMContentLoaded", handler);
  }

  renderReportCards(data) {
    const summary = data?.summary || data || {};
    this._summary = summary;
    const formatMoney = (value) => {
      if (value === null || value === undefined || Number.isNaN(Number(value)))
        return "₦0.00";
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
      }).format(Number(value));
    };

    document.querySelector("#total-sales").textContent = formatMoney(
      summary.total_sales || 0,
    );
    document.querySelector("#cash-sales").textContent = formatMoney(
      summary.cash_sales || 0,
    );
    document.querySelector("#card-transfer").textContent = formatMoney(
      summary.card_transfer || 0,
    );
    document.querySelector("#num-transactions").textContent =
      summary.num_transactions ?? 0;
    document.querySelector("#items-sold").textContent = summary.items_sold ?? 0;
    document.querySelector("#expected-cash").textContent = formatMoney(
      summary.expected_cash || 0,
    );
    document.querySelector("#opening-balance").textContent = formatMoney(
      summary.opening_balance || 0,
    );
    document.querySelector("#total-profit").textContent = formatMoney(
      summary.profit || 0,
    );
  }

  renderReportsList(reports) {
    this._data = Array.isArray(reports) ? reports : [];
    const list = this._parentElement.querySelector(".reports-list");

    const emptyState = this._parentElement.querySelector("#emptyState");

    if (!list) return;

    list.innerHTML = "";
    if (!Array.isArray(reports) || reports.length === 0) {
      emptyState?.classList.remove("hidden");
      return;
    }

    emptyState?.classList.add("hidden");

    reports.forEach((report) => {
      const style = getReportStyle(report);
      console.log(style);

      const li = document.createElement("li");

      li.className = `
        ${style.border}
        neu-flat
        rounded-xl
        p-4
        mb-3
        transition-all
        duration-200
        hover:translate-x-1
        
    `;

      li.innerHTML = `

        <div class="flex gap-4">

            <div
                class="
                    ${style.iconBg}
                    w-12
                    h-12
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    shrink-0
                "
            >
                <i
                    data-lucide="${report.icon}"
                    class="w-6 h-6 ${style.iconColor}"
                ></i>
            </div>

            <div class="flex-1 min-w-0">

                <div class="flex justify-between items-start">

                    <div>

                        <h3 class="font-semibold text-gray-800">
                            ${report.title}
                        </h3>

                        <p class="text-sm text-gray-500 mt-1">
                            ${report.summary}
                        </p>

                    </div>

                    <span class="text-xs text-gray-400 whitespace-nowrap">
                        ${report.time}
                    </span>

                </div>

                <div class="flex justify-between items-center mt-4">

                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        ${report.status}
                    </span>

                    ${
                      report.status === "submitted"
                        ? `
                        <div class="flex gap-2">

                            <button
                                class="report-edit neu-pill w-9 h-9 flex items-center justify-center"
                                data-id="${report.id}"
                                data-type="${report.type}"
                            >
                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                            </button>

                            <button
                                class="report-delete neu-pill w-9 h-9 flex items-center justify-center text-red-500"
                                data-id="${report.id}"
                                data-type="${report.type}"
                            >
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>

                        </div>
                    `
                        : ""
                    }

                </div>

            </div>

        </div>

    `;

      list.appendChild(li);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  addHandlerEditDeleteReport(editHandler, deleteHandler) {
    this._parentElement.addEventListener("click", (e) => {
      const editButton = e.target.closest(".report-edit");
      const deleteButton = e.target.closest(".report-delete");
      if (!editButton && !deleteButton) return;
      const button = editButton || deleteButton;
      const report = this._data?.find((item) => String(item.id) === button.dataset.id && item.type === button.dataset.type);
      if (report) (editButton ? editHandler : deleteHandler)(report);
    });
  }

  addHandlerEndShift(handler) {
    const openButton = document.querySelector('#openEndShift');
    const modal = document.querySelector('#endShiftModal');
    const form = document.querySelector('#endShiftForm');
    const formatMoney = (value) => new Intl.NumberFormat('en-NG', {style: 'currency', currency: 'NGN'}).format(Number(value || 0));
    openButton?.addEventListener('click', () => {
      const summary = this._summary || {};
      document.querySelector('#end-shift-opening').textContent = formatMoney(summary.opening_balance);
      document.querySelector('#end-shift-sales').textContent = formatMoney(summary.total_sales);
      document.querySelector('#end-shift-expected').textContent = formatMoney(summary.expected_cash);
      document.querySelector('#end-shift-difference').textContent = formatMoney(0);
      modal?.classList.replace('hidden', 'flex');
    });
    form?.querySelector('#counted_cash')?.addEventListener('input', (event) => {
      const difference = Number(event.target.value || 0) - Number(this._summary?.expected_cash || 0);
      document.querySelector('#end-shift-difference').textContent = formatMoney(difference);
    });
    modal?.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('.close-end-shift')) this.closeEndShift();
    });
    form?.addEventListener('submit', (event) => { event.preventDefault(); handler(new FormData(form), form.querySelector('button[type="submit"]')); });
  }

  closeEndShift() { document.querySelector('#endShiftModal')?.classList.replace('flex', 'hidden'); }
}

export default new ReportView();
