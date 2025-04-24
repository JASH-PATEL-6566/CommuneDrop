export function isValidLocation(address: string, coordinates?: { lat: number; lng: number }): boolean {
  return address.trim().length > 0 && !!coordinates && !isNaN(coordinates.lat) && !isNaN(coordinates.lng)
}

export function isValidWeight(weight: string): boolean {
  const weightNum = Number.parseFloat(weight)
  return !isNaN(weightNum) && weightNum > 0
}

export function isValidCarrier(carrier: string, validCarriers: string[] = ["car", "truck", "bike", "walk"]): boolean {
  return validCarriers.includes(carrier)
}

export function validateDeliveryForm(formData: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  if (!isValidLocation(formData.pickup, formData.pickupCoordinates)) {
    errors.pickup = "Please enter a valid pickup location"
  }
  if (!isValidLocation(formData.dropoff, formData.dropoffCoordinates)) {
    errors.dropoff = "Please enter a valid dropoff location"
  }
  if (formData.weight && !isValidWeight(formData.weight)) {
    errors.weight = "Please enter a valid weight"
  }
  if (!isValidCarrier(formData.carrier)) {
    errors.carrier = "Please select a valid carrier type"
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

