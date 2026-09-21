class InventoryProjectionView {
  _parentElement = document.querySelector(".product-detail");
  _cost = document.querySelector("#selling_cost");
  _ispackCheckbox = document.querySelector("#is_pack");
  _isPack = false;
  _inputs = {
    cost: this._parentElement?.querySelector("#cost"),
    casePrice: this._parentElement?.querySelector("#case_price"),
    caseCost: this._parentElement?.querySelector("#case_cost"),
    caseCount: this._parentElement?.querySelector("#case_count"),
    damagedPieces: this._parentElement?.querySelector("#damaged_piece"),
    damagedUnits: this._parentElement?.querySelector("#damaged_unit"),
    damagedMaster: this._parentElement?.querySelector("#damaged_master"),
    packSize: this._parentElement?.querySelector("#pack_size"),
    itemQty: this._parentElement?.querySelector("#Qty"),
    grossProj: this._parentElement?.querySelector("#gross_proj"),
    markupMar: this._parentElement?.querySelector("#markup_mar"),
    grossMargin: this._parentElement?.querySelector("#gross_margin"),
  };

  _getInventoryData() {
    if (!this._isPack) {
      return {
        cost: Number(this._inputs.cost.value) ?? undefined,
        damagedPieces: Number(this._inputs.damagedUnits.value) ?? 0,
        packSize: Number(this._inputs.itemQty.value) ?? undefined,
        sellingPrice: Number(this._cost.value) ?? undefined,
      };
    }
    return {
      cost: Number(this._inputs.cost.value),
      caseCost: Number(this._inputs.caseCost.value),
      caseCount: Number(this._inputs.caseCount.value),
      damagedPieces: Number(this._inputs.damagedPieces.value),
      packSize: Number(this._inputs.packSize.value) ?? undefined,
      sellingPrice: Number(this._cost.value) ?? undefined,
    };
  }

  addHandlerPackToggle(handler) {
    this._ispackCheckbox.addEventListener("change", (e) => {
      this._isPack = e.target.checked;
      console.log(this._isPack);
      const packageDetails = document.querySelectorAll(".package-details");
      const retailDetails = document.querySelector(".retail-details");

      if (this._isPack) {
        packageDetails.forEach((ele) => ele.classList.remove("hidden"));
        retailDetails.classList.add("hidden");
      } else {
        packageDetails.forEach((ele) => ele.classList.add("hidden"));
        retailDetails.classList.remove("hidden");
      }
      handler(this._isPack);
      Object.values(this._inputs).forEach((v) => (v.value = ""));
    });
  }

  runInitialCalculation(handler) {
  const data = this._getInventoryData();

  if (!this._isComplete(data)) return;

  this._inputs.damagedMaster.required = false;
  this._inputs.damagedMaster.value = data.damagedPieces;

  handler(data);
}


  addHandlerInputChange(handler) {
    console.log(this._parentElement);
    this._parentElement.addEventListener("input", (e) => {
      if (!e.target.matches("input")) return;

      const data = this._getInventoryData();
      if (!this._isComplete(data)) return;
      this._inputs.damagedMaster.required = false;
      
      if(!this._isPack){
        
        this._inputs.damagedMaster.value = data.damagedPieces
      }
      else{
        
        this._inputs.damagedMaster.value = data.damagedPieces;
      }
      console.log(this._inputs.damagedMaster.value);
      return handler(data)
    });
  }




  renderResult(data) {
    this._inputs.grossMargin.value = data.profitMargin;
    this._inputs.markupMar.value = data.markup;
    this._inputs.grossProj.value = data.grossProfit;
    this._inputs.cost.value = data.costPerUnit;
    // this._inputs.itemQty.value = data.totalUnits

  }

  _isComplete(data) {
    if (!this._isPack) {
      return (
        data.cost > 0 &&
        data.packSize > 0 &&
        data.sellingPrice > 0 &&
        data.damagedPieces >= 0
      );
    }
    
    return (
      data.cost >= 0 &&
      data.caseCost >= 0 &&
      data.caseCount >= 0 &&
      data.packSize > 0 &&
      data.sellingPrice > 0 &&
      data.damagedPieces >= 0
    );
  }
}

export default new InventoryProjectionView();
