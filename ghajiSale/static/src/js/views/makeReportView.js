class MakeReportView {
  _parentElement = document.querySelector(".report-options");
  _modal = document.getElementById("reportModal");
  _modalField = document.getElementById("modalFields");
  _closeHandlerAdded = false;

  addHandlerReportModal(handler) {
    this._parentElement.addEventListener("click", (e) => {
      const btn = e.target.closest(".report-options button");
      if (!btn) return;
      const type = btn.dataset.type;
      handler(type);
    });
  }

  renderModal(template, values = {}, isEditing = false) {
    this._modalField.innerHTML = this.generateForm(template, values);
    this._modal.classList.remove("hidden");
    this._modal.classList.add("flex");
    this._modal.querySelector("#modalSubtitle").textContent =
      template.subtitle || "";
    this._modal.querySelector('button[type="submit"]').textContent = isEditing ? "Update Report" : "Submit Report";

    if (!this._closeHandlerAdded) {
      this._modal.addEventListener("click", (e) => {
        if (e.target === this._modal || e.target.closest("#closeReportModal")) {
          this.close();
        }
      });
      this._closeHandlerAdded = true;
    }
  }

  close() {
    this._modal.classList.add("hidden");
    this._modal.classList.remove("flex");
  }

  addHandlerSubmit(handler) {
    const form = this._modal.querySelector("#reportForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handler(new FormData(form));
    });
  }

  generateForm = (template, values = {}) => {
    this._modal.querySelector("#modalTitle").textContent = template.title;

    return template.fields
      .map((field) => {
        const labelMarkup = `<label class="block text-sm font-medium mb-1">${field.label}</label>`;
        if (field.type === "textarea") {
          return `
                        <div class="mb-4">
                            ${labelMarkup}
                            <textarea id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ""}" class="w-full border rounded-md px-3 py-2 focus:outline-none inputText">${values[field.id] || ""}</textarea>
                        </div>
                    `;
        }

        if (field.type === "select") {
          const options = Array.isArray(field.options) ? field.options : [];
          const optionsMarkup = options
            .map((option) => {
              const value = typeof option === "object" ? option.value : option;
              const label = typeof option === "object" ? option.label : option;
              return `<option value="${value}"${option.disabled ? " disabled" : ""}${String(values[field.id]).toLowerCase() === String(value).toLowerCase() ? " selected" : ""}>${label}</option>`;
            })
            .join("");

          return `
                        <div class="mb-4">
                            ${labelMarkup}
                            <select id="${field.id}" name="${field.id}" class="w-full border border-gray-300 rounded-md px-3 py-2 inputText">
                                <option value="" disabled selected>${field.placeholder || "Select option"}</option>
                                ${optionsMarkup}
                            </select>
                        </div>
                    `;
        }

        if (field.id == "product") {
          console.log(field);
          return `
                    <div class="search__container">
                        ${labelMarkup}
                        <div class="inputText flex items-center rounded-md px-2 py-2 shrink-0">
                        <input
                            type="${field.type}"
                            placeholder="Search product name / scan barcode"
                            class="flex-1 ml-3 outline-none border-none focus:ring-0 search__field"
                            name="${field.id}" id="${field.id}" value="${values[field.id] || ""}"
                        />
                    </div>
                    <ul class="module_inner search_suggest absolute left-0 mt-1 w-80 bg-white rounded-md shadow-md ">

                    </ul>
                    </div>

                    `;
        }

        return `
                    <div class="mb-4">
                        ${labelMarkup}
                        <input id="${field.id}" name="${field.id}" type="${field.type}" value="${values[field.id] || ""}" placeholder="${field.placeholder || ""}" class="w-full border rounded-md px-3 py-2 focus:outline-none inputText" />
                    </div>
                `;
      })
      .join("");
  };
}

export default new MakeReportView();
