class SearchView {
  _parentElement = document.querySelector(".product__search_field");
  _btnLookup = document.querySelector(".btn-lookup");
  _btnClear = document.querySelector(".btn-clear");

  getQuery() {
    const query = this._parentElement.value;
    return query;
  }

  clearInput() {
    this._parentElement.value = "";
  }

  addHandlerSearch(handler) {
    this._parentElement.addEventListener("input", function (e) {
      e.preventDefault();
      handler();
    });
  }

  addhandlerScannerSearch(handler) {
    this._parentElement.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        console.log("a key was entered");
        e.preventDefault();
        handler();
      }
    });
  }

  //   addHandlerLookup(handler) {
  //     this._btnLookup.addEventListener("click", (e) => {
  //       e.preventDefault();
  //       handler();
  //     });
  //   }

  addHandlerClear(handler) {
    this._btnClear.addEventListener("click", (e) => {
      e.preventDefault();
      this.clearInput();
      handler();
    });
  }
}

export default new SearchView();
