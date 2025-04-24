export type CreateOrderProps = {
  from_address: string;
  to_address: string;
  user_id: any;
  package_weight: number;
  delivery_instructions?: string;
  vehicle_type: string;
  pricing_details?: {
    cost: number;
    tax: number;
    total_cost: number;
    rider_commission: number;
  };
  distance: number;
  time: number;
};
