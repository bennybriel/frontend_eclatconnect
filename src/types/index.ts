export type RoleName = 'CUSTOMER' | 'VENDOR' | 'ARTISAN' | 'ADMINISTRATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: RoleName;
  activated?: boolean;
  activation_token?: string;
  activated_at?: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  target_type?: string;
  active?: boolean;
}

export interface CategorySuggestion {
  id: string;
  name: string;
  target_type: string;
  custom_input: string;
  submitted_by?: string;
  submitted_by_name?: string;
  submitted_by_email?: string;
  provider_id?: string;
  provider_name?: string;
  listing_id?: string;
  listing_name?: string;
  request_id?: string;
  request_title?: string;
  status: 'PENDING' | 'APPROVED' | 'MERGED' | 'REJECTED';
  merged_into_category_id?: string;
  merged_category_name?: string;
  admin_notes?: string;
  created_at: string;
}

export interface Location {
  id: string;
  area: string;
  landmark?: string;
  active?: boolean;
}

export type ProviderType = 'BUSINESS' | 'PROFESSIONAL';
export type ProviderStatus = 'DRAFT' | 'PENDING' | 'MORE_INFO' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface Provider {
  id: string;
  owner_id: string;
  type: ProviderType;
  name: string;
  category_id?: string;
  category?: string;
  category_name?: string;
  custom_category?: string;
  location_id?: string;
  location_area?: string;
  description: string;
  location: string;
  landmark?: string;
  phone: string;
  whatsapp?: string;
  image_url?: string;
  status: ProviderStatus;
  active: boolean;
  verified: boolean;
  avg_rating?: number;
  review_count?: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id?: string;
  item_id: string;
  item_title: string;
  item_type?: string;
  item_price?: number;
  item_location?: string;
  item_image_url?: string;
  provider_name?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  current_title?: string;
  current_price?: number;
  current_image_url?: string;
  current_location?: string;
  current_provider_name?: string;
  current_phone?: string;
  current_whatsapp?: string;
  current_description?: string;
  current_availability?: AvailabilityStatus;
  created_at: string;
}

export type ListingKind = 'PRODUCT' | 'SERVICE' | 'PROJECT';
export type ListingStatus = 'ACTIVE' | 'HIDDEN';
export type AvailabilityStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface Listing {
  id: string;
  provider_id: string;
  provider_name?: string;
  provider_verified?: boolean;
  provider_rating?: number;
  provider_review_count?: number;
  phone?: string;
  whatsapp?: string;
  kind: ListingKind;
  category_id?: string;
  category_name?: string;
  custom_category?: string;
  availability_status?: AvailabilityStatus;
  name: string;
  description: string;
  price?: number;
  location?: string;
  location_id?: string;
  location_area?: string;
  image_url?: string;
  images?: string;
  status: ListingStatus;
  created_at: string;
}

export type RequestStatus = 'OPEN' | 'FULFILLED' | 'EXPIRED' | 'REMOVED';
export type RequestKind = 'REQUEST' | 'SERVICE' | 'PRODUCT' | 'PREOWNED_REQUEST' | 'PREOWNED_SALE';

export interface ServiceRequest {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  category_id?: string;
  category?: string;
  category_name?: string;
  custom_category?: string;
  location_id?: string;
  location_area?: string;
  title: string;
  description: string;
  location: string;
  image_url?: string;
  images?: string;
  budget?: number;
  request_type?: RequestKind;
  condition?: string;
  private_address?: string;
  share_address_agreed?: boolean;
  availability_status?: AvailabilityStatus;
  status: RequestStatus;
  response_count?: number;
  created_at: string;
  expires_at: string;
}

export interface RequestResponse {
  id: string;
  request_id: string;
  request_title?: string;
  provider_id: string;
  provider_name: string;
  provider_phone?: string;
  provider_whatsapp?: string;
  phone?: string;
  whatsapp?: string;
  verified?: boolean;
  message: string;
  price?: number;
  image_url?: string;
  status: string;
  created_at: string;
}

export interface Review {
  id: string;
  provider_id: string;
  provider_name?: string;
  provider_type?: string;
  category_name?: string;
  customer_id: string;
  customer_name?: string;
  rating: number;
  comment?: string;
  interaction_confirmed: boolean;
  status: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_id: string;
  message: string;
  event_key?: string;
  link_type?: string;
  link_id?: string;
  channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  event_type?: string;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  event_key: string;
  target_role: 'CUSTOMER' | 'PROVIDER' | 'ADMINISTRATOR' | 'GENERAL';
  event_name: string;
  message_template: string;
  description?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  actor_id?: string;
  actor_email?: string;
  actor_role?: string;
  ip_address?: string;
  user_agent?: string;
  action: string;
  module: string;
  target_type?: string;
  target_id?: string;
  status: string;
  details?: string;
  created_at: string;
}

export interface WhatsAppLog {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND' | 'LEAD_CLICK';
  phone: string;
  message_id?: string;
  sender_name?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  message_type?: string;
  activity_type?: string;
  content: string;
  status: string;
  error_message?: string;
  follow_up_status?: 'PENDING' | 'IN_PROGRESS' | 'FOLLOWED_UP' | 'RESOLVED' | 'NO_ACTION_NEEDED';
  admin_notes?: string;
  followed_up_by?: string;
  followed_up_by_name?: string;
  followed_up_at?: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  user_category: string;
  is_system: boolean;
  permissions?: string[];
}

export interface Permission {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface BroadcastItem {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_email?: string;
  title: string;
  message: string;
  target_audience: 'ALL' | 'WHATSAPP_ONLY' | 'WEB_ONLY' | 'PROVIDERS' | 'CUSTOMERS' | string;
  channels: string;
  total_recipients: number;
  in_app_count: number;
  whatsapp_count: number;
  status: string;
  action_url?: string;
  created_at: string;
}
