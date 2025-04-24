import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE;

// Type for pricing details
export interface RefundResp {
  orderId: string;
  refundId: string;
}

// Fetch pricing from the external Valuation Service
export const refundOrder = async (orderId: string): Promise<RefundResp> => {
  try {
    const response = await axios.post(
      //TODO: change this
      PAYMENT_SERVICE_URL + "/refund",
      {
        orderId,
      }
    );
    return response.data as RefundResp;
  } catch (error) {
    throw new Error("Error fetching pricing details: " + error.message);
  }
};
