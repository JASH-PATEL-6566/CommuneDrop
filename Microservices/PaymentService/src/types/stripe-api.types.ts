/**
 * Type definitions for Stripe API responses
 */

export interface StripeCustomer {
  id: string
  object: string
  email: string
  name?: string
  description?: string
  default_source?: string
  metadata: Record<string, string>
  created: number
  invoice_settings?: {
    default_payment_method?: string
  }
}

export interface StripeCard {
  brand: string
  country: string
  exp_month: number
  exp_year: number
  fingerprint: string
  funding: string
  last4: string
  name?: string
}

export interface StripePaymentMethod {
  id: string
  object: string
  billing_details: {
    address: {
      city: string | null
      country: string | null
      line1: string | null
      line2: string | null
      postal_code: string | null
      state: string | null
    }
    email: string | null
    name: string | null
    phone: string | null
  }
  card?: StripeCard
  created: number
  customer: string | null
  metadata: Record<string, string>
  type: string
}

export interface StripePaymentIntent {
  id: string
  object: string
  amount: number
  amount_capturable: number
  amount_received: number
  application: string | null
  application_fee_amount: number | null
  canceled_at: number | null
  cancellation_reason: string | null
  capture_method: string
  charges: {
    object: string
    data: any[]
    has_more: boolean
    total_count: number
    url: string
  }
  client_secret: string
  confirmation_method: string
  created: number
  currency: string
  customer: string | null
  description: string | null
  invoice: string | null
  last_payment_error: any | null
  livemode: boolean
  metadata: Record<string, string>
  next_action: any | null
  payment_method: string | null
  payment_method_options: Record<string, any>
  payment_method_types: string[]
  receipt_email: string | null
  review: string | null
  setup_future_usage: string | null
  shipping: any | null
  source: string | null
  statement_descriptor: string | null
  statement_descriptor_suffix: string | null
  status: string
  transfer_data: any | null
  transfer_group: string | null
}

export interface StripeRefund {
  id: string
  object: string
  amount: number
  balance_transaction: string | null
  charge: string | null
  created: number
  currency: string
  metadata: Record<string, string>
  payment_intent: string | null
  reason: string | null
  receipt_number: string | null
  source_transfer_reversal: string | null
  status: string
  transfer_reversal: string | null
}

export interface StripeListResponse<T> {
  object: string
  data: T[]
  has_more: boolean
  url: string
}

