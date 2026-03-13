import { ImpositionEngine } from "./imposition.engine"
import { GangRunEngine } from "./gang-run.engine"

export class PrintingPricingEngine {

static calculate(config: any) {


// --- AUTO IMPOSITION CALCULATION ---
const imposition = ImpositionEngine.calculate({
  sheet_width_mm: 450,
  sheet_height_mm: 320,
  product_width_mm: config.product_width_mm,
  product_height_mm: config.product_height_mm,
  bleed_mm: 3
})

const quantity = config.quantity

const sheetsNeeded =
  Math.ceil(quantity / imposition.per_sheet)

// waste factor (production safety)
const wasteFactor = 1.05

const sheetsWithWaste =
  Math.ceil(sheetsNeeded * wasteFactor)

// ---- COST CALCULATION ----

const paperPrice = 150 // нэг sheet цаасны үнэ
const machineRate = 20000 // цагийн машин үнэ
const machineSpeed = 5000 // sheets per hour
const laborCost = 5000
const setupCost = 10000

const paperCost =
  sheetsWithWaste * paperPrice

const machineCost =
  (sheetsWithWaste / machineSpeed) * machineRate

const productionCost =
  paperCost +
  machineCost +
  laborCost +
  setupCost

const platformMargin = 0.25

const finalPrice =
  productionCost * (1 + platformMargin)

return {
  quantity,
  per_sheet: imposition.per_sheet,
  sheets_needed: sheetsWithWaste,
  paper_cost: paperCost,
  machine_cost: machineCost,
  production_cost: productionCost,
  final_price: finalPrice
}


}

}
