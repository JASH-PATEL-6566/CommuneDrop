import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const BIKE_PRICE = 8;
const CAR_PRICE = 14;
const TRUCK_PRICE = 20;

const RIDER_BIKE_COMMISSION = 2;
const RIDER_CAR_COMMISSION = 5;
const RIDER_TRUCK_COMMISSION = 10;

const calcTotalCost = (price: number, distance: number) => {
  return distance * price;
};

const calcRiderCommission = (commission: number, distance: number) => {
  return commission * distance;
};

const decimalNumberFormat = (val: number) => {
  return Math.round(val * 100) / 100;
};

// Type for pricing details
export interface ValuationResp {
  pricing_details: {
    cost: number;
    rider_commission: number;
    tax: number;
    total_cost: number;
  }
}



// Fetch pricing from the external Valuation Service
export const getPricingDetailsFromValuationService = async (
  distance: number,
  time: number,
  vehicleType: string
): Promise<ValuationResp> => {
  let price;
    let commission;

    if (vehicleType === "BIKE") {
      price = BIKE_PRICE;
      commission = RIDER_BIKE_COMMISSION;
    } else if (vehicleType === "CAR") {
      price = CAR_PRICE;
      commission = RIDER_CAR_COMMISSION;
    } else if (vehicleType === "TRUCK") {
      price = TRUCK_PRICE;
      commission = RIDER_TRUCK_COMMISSION;
    } else {
      throw new Error("Vechicle type is not valid!");
    }

    const cost: number = decimalNumberFormat(calcTotalCost(price, distance));
    const rider_commission: number = decimalNumberFormat(
      calcRiderCommission(commission, distance)
    );
    const tax = decimalNumberFormat(cost * 0.15);
    return {
      pricing_details: {
        cost,
        rider_commission,
        tax,
        total_cost: cost+tax
      }
    }
};
