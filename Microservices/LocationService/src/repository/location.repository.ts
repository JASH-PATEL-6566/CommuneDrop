import {
    findCoordinates,
    calculateRouteMatrix,
    getDetailedRoute,
    getAddressSuggestions,
} from "../service/location.service"
import type { GeocodeResponse } from "../types/location.type"

export const findCoordinatesRepo = async (address: string): Promise<GeocodeResponse> => {
    return await findCoordinates(address)
}

export const calculateRouteMatrixRepo = async (fromAddress: string, toAddress: string) => {
    return await calculateRouteMatrix(fromAddress, toAddress)
}

export const getRouteDetails = async (fromAddress: string, toAddress: string) => {
    return await getDetailedRoute(fromAddress, toAddress)
}

export const getAddressAutocomplete = async (text: string, maxResults = 5, language = "en") => {
    return await getAddressSuggestions(text, maxResults, language)
}

