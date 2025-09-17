// API Types and Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginationMeta {
  total_items: number;
  current_page: number;
  items_per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Node Types
export interface NodeData {
  node_id: string;
  node_name: string;
  node_type: 'Source' | 'Assembly' | 'Distribution';
  node_address?: string;
  node_latitude?: number;
  node_longitude?: number;
  node_status: 'Active' | 'Inactive'; // 'Active' = active, 'Inactive' = disabled
  created_at?: string;
  updated_at?: string;
}

export interface CreateNodeRequest {
  node_name: string;
  node_type: 'Source' | 'Assembly' | 'Distribution';
  node_address?: string;
  node_latitude?: number;
  node_longitude?: number;
  node_status?: boolean;
}

export interface UpdateNodeRequest {
  node_name?: string;
  node_type?: 'Source' | 'Assembly' | 'Distribution';
  node_address?: string;
  node_latitude?: number;
  node_longitude?: number;
  node_status?: boolean;
}

// Item Type Types
export interface ItemTypeData {
  item_id: string;
  item_name: string;
  item_type: string;
  item_description?: string;
  item_image?: string;
  status: 'Active' | 'Inactive'; // 'Active' = active, 'Inactive' = disabled
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemTypeRequest {
  item_name: string;
  item_type: string;
  item_description?: string;
  item_image?: string;
  status?: boolean;
}

export interface UpdateItemTypeRequest {
  item_name?: string;
  item_type?: string;
  item_description?: string;
  item_image?: string;
  status?: boolean;
}

// Item Instance Types
export interface ItemInstanceData {
  item_instance_id: string;
  item_type_id: string;
  node_id?: string;
  item_count: number;
  expire_date?: string;
  status: 'Active' | 'Inactive'; // 'Active' = active, 'Inactive' = disabled
  created_at?: string;
  updated_at?: string;
  item_type?: {
    item_id: string;
    item_name: string;
    item_type: string;
    item_description?: string;
    item_image?: string;
  };
  current_node?: {
    node_id: string;
    node_name: string;
    node_type: string;
    node_address?: string;
  };
  current_transit?: {
    transit_id: string;
    source_node: {
      node_id: string;
      node_name: string;
    };
    dest_node_id: string;
    time_departure: string;
  };
}

export interface CreateItemInstanceRequest {
  item_type_id: string;
  node_id?: string;
  item_count: number;
  expire_date?: string;
  status?: boolean;
}

export interface UpdateItemInstanceRequest {
  node_id?: string;
  item_count?: number;
  expire_date?: string;
  status?: boolean;
}

// Item Transit Types
export interface ItemTransitData {
  item_transit_id: string;
  item_instance_id: string;
  source_node_id: string;
  dest_node_id?: string;
  time_departure: string;
  time_arrival?: string;
  courier_name?: string;
  courier_phone?: string;
  qr_url?: string;
  status: 'Active' | 'Completed' | 'Inactive';
  created_at?: string;
  updated_at?: string;
  item_instance?: {
    item_instance_id: string;
    item_count: number;
    item_type: {
      item_name: string;
      item_type: string;
    };
  };
  source_node?: {
    node_id: string;
    node_name: string;
    node_type: string;
  };
  dest_node?: {
    node_id: string;
    node_name: string;
    node_type: string;
  };
}

export interface CreateItemTransitRequest {
  item_instance_id: string;
  source_node_id: string;
  dest_node_id?: string;
  time_departure: string;
  courier_name?: string;
  courier_phone?: string;
  qr_url?: string;
  status?: 'Active' | 'Completed' | 'Inactive';
}

export interface UpdateItemTransitRequest {
  dest_node_id?: string;
  time_arrival?: string;
  courier_name?: string;
  courier_phone?: string;
  status?: 'Active' | 'Completed' | 'Inactive';
}

export interface CompleteTransitRequest {
  time_arrival: string;
}

// Database column mappings (if different from API)
export interface DbNode {
  id: string;
  node_name: string;
  node_type: string;
  node_address?: string;
  node_latitude?: number;
  node_longitude?: number;
  node_status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface DbItemType {
  id: string;
  item_name: string;
  item_type: string;
  item_description?: string;
  item_image?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface DbItemInstance {
  id: string;
  item_type_id: string;
  node_id?: string;
  item_count: number;
  expire_date?: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface DbItemTransit {
  id: string;
  item_instance_id: string;
  source_node_id: string;
  dest_node_id?: string;
  time_departure: string;
  time_arrival?: string;
  courier_name?: string;
  courier_phone?: string;
  qr_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}