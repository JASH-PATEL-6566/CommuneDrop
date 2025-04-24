export interface Location {
    address: string
    lat: number
    lng: number
}

export interface GeocodeResponse {
    lat: number
    lng: number
}

export interface AddressSuggestion {
    text: string
    placeId: string
    description: string
}

export interface RouteData {
    from: {
        address: string
        lat: number
        lng: number
    }
    to: {
        address: string
        lat: number
        lng: number
    }
    distanceKm: number | string
    durationMinutes: string
}

export interface DetailedRouteData {
    from: {
        address: string
        lat: number
        lng: number
    }
    to: {
        address: string
        lat: number
        lng: number
    }
    summary: {
        distance: number | string
        durationMinutes: string
    }
    legs: Array<{
        distance: number | undefined
        durationMinutes: string
        steps: Array<{
        distance: number | undefined
        durationSeconds: number | undefined
        startPosition: number[] | undefined
        endPosition: number[] | undefined
        }>
    }>
    route: {
        geometry: number[][]
    }
}

