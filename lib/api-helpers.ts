import { NextResponse } from 'next/server';
import { ApiResponse, PaginationMeta, PaginationParams } from './api-types';
import { createClient } from '@/utils/supabase/server';

// API Response Helpers
export function createSuccessResponse<T>(message: string, data?: T): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };
  return NextResponse.json(response);
}

export function createErrorResponse(message: string, statusCode: number = 400): NextResponse {
  const response: ApiResponse = {
    success: false,
    message,
    error: message
  };
  return NextResponse.json(response, { status: statusCode });
}

// Pagination Helpers
export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1');
  const page_size = parseInt(searchParams.get('page_size') || '50');
  
  return {
    page: Math.max(1, page),
    page_size: Math.min(Math.max(1, page_size), 100) // Cap at 100 items per page
  };
}

export function createPaginationMeta(
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    total_items: totalItems,
    current_page: currentPage,
    items_per_page: itemsPerPage,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_previous: currentPage > 1
  };
}

// Database Helpers
export async function getSupabaseClient() {
  try {
    const supabase = await createClient();
    return supabase;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    throw new Error('Database connection failed');
  }
}

// Request Validation Helpers
export function validateRequired(obj: any, requiredFields: string[]): string[] {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  return missing;
}

export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Data Transformation Helpers
export function transformDbToApi<T extends Record<string, any>>(
  dbRecord: T,
  mapping?: Record<string, string>
): any {
  if (!mapping) return dbRecord;
  
  const transformed: any = {};
  for (const [apiKey, dbKey] of Object.entries(mapping)) {
    if (dbRecord.hasOwnProperty(dbKey)) {
      transformed[apiKey] = dbRecord[dbKey];
    }
  }
  
  // Include any unmapped fields
  for (const key of Object.keys(dbRecord)) {
    if (!Object.values(mapping).includes(key) && !transformed.hasOwnProperty(key)) {
      transformed[key] = dbRecord[key];
    }
  }
  
  return transformed;
}

// Common database field mappings
export const NODE_FIELD_MAPPING = {
  'node_id': 'node_id', // Database uses node_id, not id
  'node_name': 'node_name',
  'node_type': 'node_type',
  'node_address': 'node_address',
  'node_latitude': 'node_latitude',
  'node_longitude': 'node_longitude',
  'node_status': 'node_status',
  'created_at': 'created_at'
};

export const ITEM_TYPE_FIELD_MAPPING = {
  'item_id': 'item_id', // Likely uses item_id, not id
  'item_name': 'item_name',
  'item_type': 'item_type',
  'item_description': 'item_description',
  'item_image': 'item_image',
  'status': 'status',
  'created_at': 'created_at'
};

export const ITEM_INSTANCE_FIELD_MAPPING = {
  'item_instance_id': 'item_instance_id', // Likely uses item_instance_id, not id
  'item_type_id': 'item_type_id',
  'node_id': 'node_id',
  'item_count': 'item_count',
  'expire_date': 'expire_date',
  'status': 'status',
  'created_at': 'created_at'
};

export const ITEM_TRANSIT_FIELD_MAPPING = {
  'item_transit_id': 'item_transit_id', // Likely uses item_transit_id, not id
  'item_instance_id': 'item_instance_id',
  'source_node_id': 'source_node_id',
  'dest_node_id': 'dest_node_id',
  'time_departure': 'time_departure',
  'time_arrival': 'time_arrival',
  'courier_name': 'courier_name',
  'courier_phone': 'courier_phone',
  'qr_url': 'qr_url'
  // 'status': 'status', // Temporarily commented out - column may not exist
  // 'created_at': 'created_at' // Temporarily commented out - column may not exist
};

// Error handling wrapper
export async function handleApiError<T>(
  operation: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await operation();
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 500);
    }
    
    return createErrorResponse('An unexpected error occurred', 500);
  }
}