export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface UpdateUserRequest {
  name?: string
  phoneNumber?: string
  address?: string
  profileImage?: string
}

export interface AuthResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    token: string
    refreshToken: string
  }
  errors: string[]
}

// Update the User interface to ensure it includes an id field

export interface User {
  id?: string // Add this line to make sure id is part of the User interface
  email: string
  name?: string
  profileImage?: string
}

export interface UserProfile {
  email: string
  name: string
  phoneNumber?: string
  address?: string
  profileImage?: string
  joinDate?: string
  rating?: number
  deliveriesCompleted?: number
}

export interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  customerId: string | null // Add this line
}

// Add the UpdateCardRequest interface to match the backend
export interface UpdateCardRequest {
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv: string
  isDefault: boolean
}

// Update the PaymentRequest interface to include customerId
export interface PaymentRequest {
  orderId: string
  paymentMethodId: string
  amount: number
  currency?: string
  description?: string
  customerId?: string
}

