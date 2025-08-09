// Type definitions for Google Maps JavaScript API
declare namespace google.maps {
  class Map {
    constructor(mapDiv: HTMLElement | null, opts?: MapOptions);
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    styles?: MapTypeStyle[];
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: MapTypeStyler[];
  }

  interface MapTypeStyler {
    color?: string;
    visibility?: string;
    [key: string]: any;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latLng: LatLng | LatLngLiteral): void;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
  }

  namespace places {
    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
      geometry?: {
        location: google.maps.LatLng;
        viewport: google.maps.LatLngBounds;
      };
      name?: string;
      formatted_phone_number?: string;
      international_phone_number?: string;
      website?: string;
      rating?: number;
      user_ratings_total?: number;
      types?: string[];
      url?: string;
      vicinity?: string;
      [key: string]: any;
    }

    class PlacesService {
      constructor(attrContainer: HTMLElement | Map);
      getDetails(request: { placeId: string; fields?: string[] }, callback: (place: PlaceResult, status: string) => void): void;
    }

    class Autocomplete extends google.maps.MVCObject {
      constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
      addListener(eventName: string, handler: Function): google.maps.MapsEventListener;
      getPlace(): PlaceResult;
      setFields(fields: string[]): void;
      setComponentRestrictions(restrictions: ComponentRestrictions): void;
    }
  }

  // Moved Autocomplete class inside the places namespace

  interface AutocompleteOptions {
    types?: string[];
    componentRestrictions?: ComponentRestrictions;
    fields?: string[];
  }

  interface ComponentRestrictions {
    country: string | string[];
  }

  // Moved PlaceResult interface inside the google.maps.places namespace

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface PlaceGeometry {
    location: LatLng;
    viewport: LatLngBounds;
  }

  interface LatLngBounds {
    getNorthEast(): LatLng;
    getSouthWest(): LatLng;
  }

  interface OpeningHours {
    open_now: boolean;
    periods: OpeningPeriod[];
    weekday_text: string[];
  }

  interface OpeningPeriod {
    open: OpeningHoursTime;
    close?: OpeningHoursTime;
  }

  interface OpeningHoursTime {
    day: number;
    time: string;
  }

  interface PlacePhoto {
    height: number;
    width: number;
    getUrl(opts?: PhotoOptions): string;
    html_attributions: string[];
  }

  interface PhotoOptions {
    maxWidth?: number;
    maxHeight?: number;
  }

  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (results: GeocoderResult[], status: GeocoderStatus) => void
    ): void;
  }

  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
    placeId?: string;
    bounds?: LatLngBounds | LatLngBoundsLiteral;
    componentRestrictions?: GeocoderComponentRestrictions;
    region?: string;
  }

  interface GeocoderComponentRestrictions {
    administrativeArea?: string;
    country?: string | string[];
    locality?: string;
    postalCode?: string;
    route?: string;
  }

  interface GeocoderResult {
    address_components: GeocoderAddressComponent[];
    formatted_address: string;
    geometry: GeocoderGeometry;
    partial_match?: boolean;
    place_id: string;
    postcode_localities?: string[];
    types: string[];
  }

  interface GeocoderAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  interface GeocoderGeometry {
    bounds?: LatLngBounds;
    location: LatLng;
    location_type: GeocoderLocationType;
    viewport: LatLngBounds;
  }

  enum GeocoderLocationType {
    APPROXIMATE = 'APPROXIMATE',
    GEOMETRIC_CENTER = 'GEOMETRIC_CENTER',
    RANGE_INTERPOLATED = 'RANGE_INTERPOLATED',
    ROOFTOP = 'ROOFTOP',
  }

  type GeocoderStatus =
    | 'ERROR'
    | 'INVALID_REQUEST'
    | 'OK'
    | 'OVER_QUERY_LIMIT'
    | 'REQUEST_DENIED'
    | 'UNKNOWN_ERROR'
    | 'ZERO_RESULTS';

  class MVCObject {
    addListener(eventName: string, handler: Function): MapsEventListener;
    set(key: string, value: any): void;
    get(key: string): any;
  }

  interface MapsEventListener {
    remove(): void;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }
}

// Declare the google global variable
declare const google: {
  maps: typeof google.maps;
};

declare global {
  interface Window {
    google: typeof google;
  }
}
