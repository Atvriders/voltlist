import type { Vehicle } from "./vehicle";

export interface CarQuery {
  q?: string;
  powertrain?: ("BEV"|"PHEV"|"HEV")[];
  make?: string[];
  bodyStyle?: string[];
  drivetrain?: ("FWD"|"RWD"|"AWD")[];
  chargePort?: string[];
  minPrice?: number; maxPrice?: number;
  minElectricRange?: number;
  minSeating?: number;
  taxCreditOnly?: boolean;
  needsAdaptiveCruise?: boolean;   // ACC != NotAvailable
  needsLaneAssist?: boolean;       // laneKeepAssist != NotAvailable
  needsHandsFree?: boolean;        // handsFreeHighway != NotAvailable
  sort?: "price"|"range"|"zeroToSixty"|"efficiency"|"horsepower";
  order?: "asc"|"desc";
  page?: number; pageSize?: number;
}
export interface CarListResult { items: Vehicle[]; total: number; page: number; pageSize: number; facets: Facets; }
export interface Facets { makes: string[]; bodyStyles: string[]; }
