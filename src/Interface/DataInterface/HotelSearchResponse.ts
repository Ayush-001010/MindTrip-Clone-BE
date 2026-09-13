export interface HotelSearchResponse {
  search_metadata: SearchMetadata;
  search_parameters: SearchParameters;
  search_information: SearchInformation;
  brands: Brand[];
  properties: Property[];
  serpapi_pagination: SerpapiPagination;
}

export interface SearchMetadata {
  id: string;
  status: string;
  json_endpoint: string;
  markdown_endpoint: string;
  created_at: string;
  processed_at: string;
  google_hotels_url: string;
  raw_html_file: string;
  prettify_html_file: string;
  total_time_taken: TotalTimeTaken;
}

export interface TotalTimeTaken {
  float: number;
}

export interface SearchParameters {
  engine: string;
  q: string;
  gl: string;
  hl: string;
  currency: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
}

export interface SearchInformation {
  total_results: number;
}

export interface Brand {
  id: number;
  name: string;
  children?: BrandChild[];
}

export interface BrandChild {
  id: number;
  name: string;
}

export interface Property {
  type: string;
  name: string;
  description?: string;
  link?: string;
  property_token: string;
  serpapi_property_details_link: string;
  address: string;
  phone?: string;
  phone_link?: string;
  gps_coordinates?: GpsCoordinates;
  check_in_time?: string;
  check_out_time?: string;
  rate_per_night?: RateInfo;
  total_rate?: RateInfo;
  deal?: string;
  deal_description?: string;
  nearby_places?: NearbyPlace[];
  hotel_class?: string;
  extracted_hotel_class?: number;
  images?: HotelImage[];
  overall_rating?: number;
  reviews?: number;
  ratings?: Rating[];
  location_rating?: number;
  reviews_breakdown?: ReviewBreakdown[];
  amenities?: string[];
  eco_certified?: boolean;
  serpapi_google_hotels_reviews_link?: string;
  serpapi_google_hotels_photos_link?: string;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

export interface RateInfo {
  lowest: string;
  extracted_lowest: number;
  before_taxes_fees?: string;
  extracted_before_taxes_fees?: number;
}

export interface NearbyPlace {
  name: string;
  transportations?: Transportation[];
}

export interface Transportation {
  type: string;
  duration: string;
}

export interface HotelImage {
  thumbnail: string;
  original_image: string;
}

export interface Rating {
  stars: number;
  count: number;
}

export interface ReviewBreakdown {
  name: string;
  description: string;
  total_mentioned: number;
  positive: number;
  negative: number;
  neutral: number;
  category_token: string;
  serpapi_link: string;
}

export interface SerpapiPagination {
  current_from: number;
  current_to: number;
  next_page_token?: string;
  next?: string;
}