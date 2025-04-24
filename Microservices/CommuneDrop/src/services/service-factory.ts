import { tokenService } from "./token-service"
import { mapService } from "./map-service"
import { paymentService } from "./payment-service"

export const serviceFactory = {
  getTokenService: () => tokenService,
  getMapService: () => mapService,
  getPaymentService: () => paymentService,
}

