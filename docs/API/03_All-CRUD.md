# All basic CRUD Operations

This document defines the parameters and responses for the basic CRUD operations.

> [!WARNING]
> Generated via AI, not manually reviewed yet

## Table of Contents

- [All basic CRUD Operations](#all-basic-crud-operations)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Node CRUD Endpoints](#node-crud-endpoints)
    - [Item Type CRUD Endpoints](#item-type-crud-endpoints)
    - [Item Instance CRUD Endpoints](#item-instance-crud-endpoints)
    - [Item Transit CRUD Endpoints](#item-transit-crud-endpoints)
  - [Node CRUD Endpoints](#node-crud-endpoints-1)
    - [Create Node](#create-node)
    - [Read Node](#read-node)
    - [Update Node](#update-node)
    - [Delete Node](#delete-node)
    - [List All Nodes](#list-all-nodes)
  - [Item Type CRUD Endpoints](#item-type-crud-endpoints-1)
    - [Create Item Type](#create-item-type)
    - [Read Item Type](#read-item-type)
    - [Update Item Type](#update-item-type)
    - [Delete Item Type](#delete-item-type)
    - [List All Item Types](#list-all-item-types)
  - [Item Instance CRUD Endpoints](#item-instance-crud-endpoints-1)
    - [Create Item Instance](#create-item-instance)
    - [Read Item Instance](#read-item-instance)
    - [Read All Active Items](#read-all-active-items)
    - [Update Item Instance](#update-item-instance)
    - [Delete Item Instance](#delete-item-instance)
    - [List Item Instances by Node](#list-item-instances-by-node)
  - [Item Transit CRUD Endpoints](#item-transit-crud-endpoints-1)
    - [Create Item Transit](#create-item-transit)
    - [Read Item Transit](#read-item-transit)
    - [Update Item Transit](#update-item-transit)
    - [Complete Item Transit](#complete-item-transit)
    - [List Active Transits](#list-active-transits)
  - [User CRUD Endpoints](#user-crud-endpoints)
    - [Database Table Schema](#database-table-schema)
      - [User Table](#user-table)
      - [User Roles Table](#user-roles-table)
    - [Create User](#create-user)
    - [Read User](#read-user)
    - [Update User](#update-user)
    - [Delete User](#delete-user)
    - [List All Users](#list-all-users)
    - [Get User Role](#get-user-role)
    - [Update User Role](#update-user-role)
    - [Set User Role](#set-user-role)

---

## Overview

### Node CRUD Endpoints

- POST /api/node - Create new node
- GET /api/node/[id] - Get specific node by ID
- PUT /api/node/[id] - Update node
- DELETE /api/node/[id] - Soft delete node (sets status to disabled)
- GET /api/nodes - List all nodes with filtering and pagination

### Item Type CRUD Endpoints

- POST /api/item-type - Create new item type
- GET /api/item-type/[id] - Get specific item type by ID
- PUT /api/item-type/[id] - Update item type
- DELETE /api/item-type/[id] - Soft delete item type
- GET /api/item-types - List all item types with filtering and pagination

### Item Instance CRUD Endpoints

- POST /api/item-instance - Create new item instance
- GET /api/item-instance/[id] - Get specific item instance with relations
- PUT /api/item-instance/[id] - Update item instance
- DELETE /api/item-instance/[id] - Soft delete item instance
- GET /api/items/active - Get all active items with summary statistics
- GET /api/item-instances - List item instances with filtering

### Item Transit CRUD Endpoints

- POST /api/item-transit - Create new item transit (with automatic item location update)
- GET /api/item-transit/[id] - Get specific transit with relations
- PUT /api/item-transit/[id] - Update item transit
- POST /api/item-transit/[id]/complete - Complete transit and update item location
- GET /api/item-transits - List transits with filtering and summary statistics

## Node CRUD Endpoints

CRUD operations for managing nodes in the system.

### Create Node

**Endpoint:** `POST /api/node`

**Description:** Creates a new node in the system.

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description                           |
| ------------ | ------ | -------- | -------- | ------------------------------------- |
| node_name   | string | body     | Yes      | Name of the node                      |
| node_type   | string | body     | Yes      | Type of the node (Source, Assembly, Distribution) |
| node_address | string | body     | No      | Physical address of the node          |
| node_latitude | number | body     | No      | Latitude coordinate of the node       |
| node_longitude | number | body     | No      | Longitude coordinate of the node      |
| node_status | string | body     | No      | Status of the node (Active, Inactive) |

**Example Request Body**

```json
{
  "node_name": "Node A",
  "node_type": "Source",
  "node_address": "Jalan Merdeka No. 123, Jakarta",
  "node_latitude": -20.000000,
  "node_longitude": 100.000000,
  "node_status": "Active"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "Node successfully created",
  "data": {
    "node_id": "node-uuid-12345",
    "created_at": "2025-09-14T10:30:00Z",
    "node_name": "Node A",
    "node_type": "Source",
    "node_address": "Jalan Merdeka No. 123, Jakarta",
    "node_latitude": -20.000000,
    "node_longitude": 100.000000,
    "node_status": "Active",
  }
}
```

### Read Node

**Endpoint:** `GET /api/node/{node_id}`

**Description:** Retrieves details of a specific node by its ID.

**Request Parameters:**

| Parameter | Type   | Location | Required | Description           |
| --------- | ------ | -------- | -------- | --------------------- |
| node_id   | string | params   | Yes      | UUID of the node      |

**Response Format:**

```json
{
  "success": true,
  "message": "Node retrieved successfully",
  "data": {
    "node_id": "node-uuid-12345",
    "created_at": "2025-09-14T10:30:00Z",
    "node_name": "Node A",
    "node_type": "Source",
    "node_address": "Jalan Merdeka No. 123, Jakarta",
    "node_latitude": -20.000000,
    "node_longitude": 100.000000,
    "node_status": "Active"
  }
}
```

### Update Node

**Endpoint:** `PUT /api/node/{node_id}`

**Description:** Updates an existing node's information.

**Request Parameters:**

| Parameter      | Type   | Location | Required | Description                           |
| -------------- | ------ | -------- | -------- | ------------------------------------- |
| node_id        | string | params   | Yes      | UUID of the node to update            |
| node_name      | string | body     | No       | Name of the node                      |
| node_type      | string | body     | No       | Type of the node                      |
| node_address   | string | body     | No       | Physical address of the node          |
| node_latitude  | number | body     | No       | Latitude coordinate                   |
| node_longitude | number | body     | No       | Longitude coordinate                  |
| node_status    | string | body     | No       | Status (Active, Inactive)             |

**Example Request Body:**

```json
{
  "node_name": "Updated Node A",
  "node_type": "Distribution",
  "node_address": "New Address 456, Jakarta"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "Node updated successfully",
  "data": {
    "node_id": "node-uuid-12345",
    "updated_at": "2025-09-14T11:00:00Z",
    "node_name": "Updated Node A",
    "node_type": "Distribution",
    "node_address": "New Address 456, Jakarta",
    "node_latitude": -20.000000,
    "node_longitude": 100.000000,
    "node_status": "Active"
  }
}
```

### Delete Node

**Endpoint:** `DELETE /api/node/{node_id}`

**Description:** Soft deletes a node by setting its status to inactive.

**Request Parameters:**

| Parameter | Type   | Location | Required | Description           |
| --------- | ------ | -------- | -------- | --------------------- |
| node_id   | string | params   | Yes      | UUID of the node      |

**Response Format:**

```json
{
  "success": true,
  "message": "Node deleted successfully",
  "data": {
    "node_id": "node-uuid-12345",
    "deleted_at": "2025-09-14T11:15:00Z",
    "status": "Inactive"
  }
}
```

### List All Nodes

**Endpoint:** `GET /api/nodes`

**Description:** Retrieves a list of all nodes with optional filtering.

**Request Parameters:**

| Parameter   | Type   | Location | Required | Description                    |
| ----------- | ------ | -------- | -------- | ------------------------------ |
| node_type   | string | query    | No       | Filter by node type            |
| status      | string | query    | No       | Filter by status (default: Active)               |
| page_size   | number | query    | No       | Items per page (default: 50)  |
| page        | number | query    | No       | Page number (default: 1)      |

Response Format:**

```json
{
  "success": true,
  "message": "Nodes retrieved successfully",
  "data": {
    "nodes": [
      {
        "node_id": "node-uuid-12345",
        "created_at": "2025-09-14T10:30:00Z",
        "node_name": "Node A",
        "node_type": "Source",
        "node_address": "Warehouse Building A",
        "node_latitude": -20.000000,
        "node_longitude": 100.000000,
        "node_status": "Active"
      }
    ],
    "pagination": {
      "total_items": 5,
      "current_page": 1,
      "items_per_page": 50,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

---

## Item Type CRUD Endpoints

CRUD operations for managing item types in the system.

### Create Item Type

**Endpoint:** `POST /api/item-type`

**Description:** Creates a new item type in the system.

**Request Parameters:**

| Parameter         | Type   | Location | Required | Description                      |
| ----------------- | ------ | -------- | -------- | -------------------------------- |
| item_name         | string | body     | Yes      | Name of the item type            |
| item_type         | string | body     | Yes      | Category of the item             |
| item_description  | string | body     | No       | Description of the item type     |
| item_image        | string | body     | No       | URL/path to item image           |
| status            | string | body     | No       | Status (Active, Inactive)        |

**Example Request Body:**

```json
{
  "item_name": "Indomie Goreng",
  "item_type": "Bahan baku",
  "item_description": "",
  "item_image": "https://example.com/images/indomie-goreng.jpg",
  "status": "Active"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "Item type created successfully",
  "data": {
    "item_id": "item-type-uuid-11111",
    "created_at": "2025-09-14T10:30:00Z",
    "item_name": "Indomie Goreng",
    "item_type": "Bahan baku",
    "item_description": "",
    "item_image": "https://example.com/images/indomie-goreng.jpg",
    "status": "Active"
  }
}
```

### Read Item Type

**Endpoint:** `GET /api/item-type/{item_id}`

**Description:** Retrieves details of a specific item type by its ID.

**Request Parameters:**

| Parameter | Type   | Location | Required | Description              |
| --------- | ------ | -------- | -------- | ------------------------ |
| item_id   | string | params   | Yes      | UUID of the item type    |

**Response Format:**

```json
{
  "success": true,
  "message": "Item type retrieved successfully",
  "data": {
    "item_id": "item-type-uuid-11111",
    "created_at": "2025-09-14T10:30:00Z",
    "item_name": "Indomie Goreng",
    "item_type": "Bahan baku",
    "item_description": "",
    "item_image": "https://example.com/images/indomie-goreng.jpg",
    "status": "Active"
  }
}
```

### Update Item Type

**Endpoint:** `PUT /api/item-type/{item_id}`

**Description:** Updates an existing item type's information.

**Request Parameters:**

| Parameter         | Type   | Location | Required | Description                      |
| ----------------- | ------ | -------- | -------- | -------------------------------- |
| item_id           | string | params   | Yes      | UUID of the item type to update  |
| item_name         | string | body     | No       | Name of the item type            |
| item_type         | string | body     | No       | Category of the item             |
| item_description  | string | body     | No       | Description of the item type     |
| item_image        | string | body     | No       | URL/path to item image           |
| status            | string | body     | No       | Status (Active, Inactive)        |

**Response Format:**

```json
{
  "success": true,
  "message": "Item type updated successfully",
  "data": {
    "item_id": "item-type-uuid-11111",
    "updated_at": "2025-09-14T11:00:00Z",
    "item_name": "Indomie Goreng",
    "item_type": "Bahan baku",
    "item_description": "Updated description",
    "item_image": "https://example.com/images/indomie-goreng.jpg",
    "status": "Active"
  }
}
```

### Delete Item Type

**Endpoint:** `DELETE /api/item-type/{item_id}`

**Description:** Soft deletes an item type by setting its status to inactive.

**Request Parameters:**

| Parameter | Type   | Location | Required | Description              |
| --------- | ------ | -------- | -------- | ------------------------ |
| item_id   | string | params   | Yes      | UUID of the item type    |

**Response Format:**

```json
{
  "success": true,
  "message": "Item type deleted successfully",
  "data": {
    "item_id": "item-type-uuid-11111",
    "deleted_at": "2025-09-14T11:15:00Z",
    "status": "Inactive"
  }
}
```

### List All Item Types

**Endpoint:** `GET /api/item-types`

**Description:** Retrieves a list of all item types with optional filtering.

**Request Parameters:**

| Parameter  | Type   | Location | Required | Description                    |
| ---------- | ------ | -------- | -------- | ------------------------------ |
| item_type  | string | query    | No       | Filter by category             |
| status     | string | query    | No       | Filter by status (default: Active)               |
| page_size  | number | query    | No       | Items per page (default: 50)  |
| page       | number | query    | No       | Page number (default: 1)      |

**Response Format:**

```json
{
  "success": true,
  "message": "Item types retrieved successfully",
  "data": {
    "item_types": [
      {
        "item_id": "item-type-uuid-11111",
        "created_at": "2025-09-14T10:30:00Z",
        "item_name": "Indomie Goreng",
        "item_type": "Food",
        "item_description": "Instant fried noodles with special seasoning",
        "item_image": "/images/indomie-goreng.jpg",
        "status": "Active"
      }
    ],
    "pagination": {
      "total_items": 25,
      "current_page": 1,
      "items_per_page": 50,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

---

## Item Instance CRUD Endpoints

CRUD operations for managing item instances in the system.

### Create Item Instance

**Endpoint:** `POST /api/item-instance`

**Description:** Creates a new item instance in the system.

**Request Parameters:**

| Parameter      | Type   | Location | Required | Description                           |
| -------------- | ------ | -------- | -------- | ------------------------------------- |
| item_type_id   | string | body     | Yes      | UUID of the item type (foreign key)  |
| node_id        | string | body     | No       | UUID of the node (null if in transit)|
| item_count     | number | body     | Yes      | Quantity of items                     |
| expire_date    | string | body     | No       | Expiration date (ISO format)          |
| status         | string | body     | No       | Status (Active, Inactive)             |

**Example Request Body:**

```json
{
  "item_type_id": "item-type-uuid-11111",
  "node_id": "node-uuid-12345",
  "item_count": 10,
  "expire_date": "2025-12-31T00:00:00Z",
  "status": "Active"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "Item instance created successfully",
  "data": {
    "item_instance_id": "item-instance-uuid-12345",
    "created_at": "2025-09-14T10:30:00Z",
    "item_type_id": "item-type-uuid-11111",
    "node_id": "node-uuid-12345",
    "item_count": 10,
    "expire_date": "2025-12-31T00:00:00Z",
    "status": "Active"
  }
}
```

### Read Item Instance

**Endpoint:** `GET /api/item-instance/{item_instance_id}`

**Description:** Retrieves details of a specific item instance by its ID.

**Request Parameters:**

| Parameter          | Type   | Location | Required | Description                    |
| ------------------ | ------ | -------- | -------- | ------------------------------ |
| item_instance_id   | string | params   | Yes      | UUID of the item instance      |

**Response Format:**

```json
{
  "success": true,
  "message": "Item instance retrieved successfully",
  "data": {
    "item_instance_id": "item-instance-uuid-12345",
    "created_at": "2025-09-14T10:30:00Z",
    "item_type_id": "item-type-uuid-11111",
    "node_id": "node-uuid-12345",
    "item_count": 10,
    "expire_date": "2025-12-31T00:00:00Z",
    "status": "Active",
    "item_type": {
      "item_id": "item-type-uuid-11111",
      "item_name": "Indomie Goreng",
      "item_type": "Food",
      "item_description": "Instant fried noodles with special seasoning"
    },
    "current_node": {
      "node_id": "node-uuid-12345",
      "node_name": "Node A",
      "node_type": "Source"
    }
  }
}
```

### Read All Active Items

**Endpoint:** `GET /api/items/active`

**Description:** Retrieves all active item instances across the system with their details.

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description                           |
| ------------ | ------ | -------- | -------- | ------------------------------------- |
| node_id      | string | query    | No       | Filter by specific node               |
| item_type_id | string | query    | No       | Filter by item type                   |
| expired      | boolean| query    | No       | Include expired items (default: false)|
| page_size    | number | query    | No       | Items per page (default: 50)         |
| page         | number | query    | No       | Page number (default: 1)             |

**Response Format:**

```json
{
  "success": true,
  "message": "Active items retrieved successfully",
  "data": {
    "items": [
      {
        "item_instance_id": "item-instance-uuid-12345",
        "created_at": "2025-09-14T10:30:00Z",
        "item_count": 10,
        "expire_date": "2025-12-31T00:00:00Z",
        "status": "Active",
        "location_type": "node",
        "item_type": {
          "item_id": "item-type-uuid-11111",
          "item_name": "Indomie Goreng",
          "item_type": "Food",
          "item_description": "Instant fried noodles with special seasoning",
          "item_image": "/images/indomie-goreng.jpg"
        },
        "current_node": {
          "node_id": "node-uuid-12345",
          "node_name": "Node A",
          "node_type": "Source",
          "node_address": "Warehouse Building A"
        }
      },
      {
        "item_instance_id": "item-instance-uuid-67890",
        "created_at": "2025-09-14T09:15:00Z",
        "item_count": 5,
        "expire_date": null,
        "status": "Active",
        "location_type": "transit",
        "item_type": {
          "item_id": "item-type-uuid-22222",
          "item_name": "Office Chair",
          "item_type": "Furniture",
          "item_description": "Ergonomic office chair"
        },
        "current_transit": {
          "transit_id": "transit-uuid-11111",
          "source_node": {
            "node_id": "node-uuid-11111",
            "node_name": "Node A"
          },
          "dest_node_id": "node-uuid-22222",
          "time_departure": "2025-09-14T09:15:00Z"
        }
      }
    ],
    "summary": {
      "total_active_items": 15,
      "items_in_nodes": 12,
      "items_in_transit": 3,
      "expiring_soon": 2
    },
    "pagination": {
      "total_items": 15,
      "current_page": 1,
      "items_per_page": 50,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

### Update Item Instance

**Endpoint:** `PUT /api/item-instance/{item_instance_id}`

**Description:** Updates an existing item instance's information.

**Request Parameters:**

| Parameter          | Type   | Location | Required | Description                           |
| ------------------ | ------ | -------- | -------- | ------------------------------------- |
| item_instance_id   | string | params   | Yes      | UUID of the item instance to update   |
| node_id            | string | body     | No       | UUID of the node                      |
| item_count         | number | body     | No       | Quantity of items                     |
| expire_date        | string | body     | No       | Expiration date (ISO format)          |
| status             | string | body     | No       | Status (Active, Inactive)             |

**Response Format:**

```json
{
  "success": true,
  "message": "Item instance updated successfully",
  "data": {
    "item_instance_id": "item-instance-uuid-12345",
    "updated_at": "2025-09-14T11:00:00Z",
    "item_type_id": "item-type-uuid-11111",
    "node_id": "node-uuid-67890",
    "item_count": 15,
    "expire_date": "2025-12-31T00:00:00Z",
    "status": "Active"
  }
}
```

### Delete Item Instance

**Endpoint:** `DELETE /api/item-instance/{item_instance_id}`

**Description:** Soft deletes an item instance by setting its status to inactive.

**Request Parameters:**

| Parameter          | Type   | Location | Required | Description                    |
| ------------------ | ------ | -------- | -------- | ------------------------------ |
| item_instance_id   | string | params   | Yes      | UUID of the item instance      |

**Response Format:**

```json
{
  "success": true,
  "message": "Item instance deleted successfully",
  "data": {
    "item_instance_id": "item-instance-uuid-12345",
    "deleted_at": "2025-09-14T11:15:00Z",
    "status": "Inactive"
  }
}
```

### List Item Instances by Node

**Endpoint:** `GET /api/item-instances`

**Description:** Retrieves item instances with optional filtering by node.

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description                    |
| ------------ | ------ | -------- | -------- | ------------------------------ |
| node_id      | string | query    | No       | Filter by node ID              |
| item_type_id | string | query    | No       | Filter by item type            |
| status       | string | query    | No       | Filter by status (default: Active)               |
| expired      | boolean| query    | No       | Show expired items only        |
| page_size    | number | query    | No       | Items per page (default: 50)  |
| page         | number | query    | No       | Page number (default: 1)      |

**Response Format:**

```json
{
  "success": true,
  "message": "Item instances retrieved successfully",
  "data": {
    "item_instances": [
      {
        "item_instance_id": "item-instance-uuid-12345",
        "created_at": "2025-09-14T10:30:00Z",
        "item_count": 10,
        "expire_date": "2025-12-31T00:00:00Z",
        "status": "Active",
        "item_type": {
          "item_id": "item-type-uuid-11111",
          "item_name": "Indomie Goreng",
          "item_type": "Food"
        },
        "current_node": {
          "node_id": "node-uuid-12345",
          "node_name": "Node A",
          "node_type": "Source"
        }
      }
    ],
    "pagination": {
      "total_items": 45,
      "current_page": 1,
      "items_per_page": 50,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

---

## Item Transit CRUD Endpoints

CRUD operations for managing item transits in the system.

### Create Item Transit

**Endpoint:** `POST /api/item-transit`

**Description:** Creates a new item transit record when item starts moving between nodes.

**Request Parameters:**

| Parameter         | Type   | Location | Required | Description                           |
| ----------------- | ------ | -------- | -------- | ------------------------------------- |
| item_instance_id  | string | body     | Yes      | UUID of item instance (foreign key)  |
| source_node_id    | string | body     | Yes      | UUID of source node (foreign key)    |
| dest_node_id      | string | body     | No       | UUID of destination node (can be null)|
| time_departure    | string | body     | Yes      | Departure time (ISO format)           |
| courier_name      | string | body     | No       | Name of the courier                   |
| courier_phone     | string | body     | No       | Phone number of courier               |
| qr_url            | string | body     | No       | QR code URL for tracking              |
| status            | string | body     | No       | Status (Active, Inactive)             |

**Example Request Body:**

```json
{
  "item_instance_id": "item-instance-uuid-12345",
  "source_node_id": "node-uuid-11111",
  "dest_node_id": "node-uuid-22222",
  "time_departure": "2025-09-14T10:00:00Z",
  "courier_name": "John Doe",
  "courier_phone": "+62812345678",
  "qr_url": "https://example.com/qr/transit-uuid-98765",
  "status": "Active"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "Item transit created successfully",
  "data": {
    "item_transit_id": "transit-uuid-98765",
    "created_at": "2025-09-14T10:00:00Z",
    "item_instance_id": "item-instance-uuid-12345",
    "source_node_id": "node-uuid-11111",
    "dest_node_id": "node-uuid-22222",
    "time_departure": "2025-09-14T10:00:00Z",
    "time_arrival": null,
    "courier_name": "John Doe",
    "courier_phone": "+62812345678",
    "qr_url": "https://example.com/qr/transit-uuid-98765",
    "status": "Active"
  }
}
```

### Read Item Transit

**Endpoint:** `GET /api/item-transit/{item_transit_id}`

**Description:** Retrieves details of a specific item transit by its ID.

**Request Parameters:**

| Parameter         | Type   | Location | Required | Description                    |
| ----------------- | ------ | -------- | -------- | ------------------------------ |
| item_transit_id   | string | params   | Yes      | UUID of the transit record     |

**Response Format:**

```json
{
  "success": true,
  "message": "Item transit retrieved successfully",
  "data": {
    "item_transit_id": "transit-uuid-98765",
    "created_at": "2025-09-14T10:00:00Z",
    "time_departure": "2025-09-14T10:00:00Z",
    "time_arrival": null,
    "courier_name": "John Doe",
    "courier_phone": "+62812345678",
    "qr_url": "https://example.com/qr/transit-uuid-98765",
    "status": "Active",
    "item_instance": {
      "item_instance_id": "item-instance-uuid-12345",
      "item_count": 10,
      "item_type": {
        "item_name": "Indomie Goreng",
        "item_type": "Food"
      }
    },
    "source_node": {
      "node_id": "node-uuid-11111",
      "node_name": "Node A",
      "node_type": "Source"
    },
    "dest_node": {
      "node_id": "node-uuid-22222",
      "node_name": "Node B",
      "node_type": "Distribution"
    }
  }
}
```

### Update Item Transit

**Endpoint:** `PUT /api/item-transit/{item_transit_id}`

**Description:** Updates an existing item transit's information.

**Request Parameters:**

| Parameter         | Type   | Location | Required | Description                           |
| ----------------- | ------ | -------- | -------- | ------------------------------------- |
| item_transit_id   | string | params   | Yes      | UUID of the transit record to update  |
| dest_node_id      | string | body     | No       | UUID of destination node              |
| time_arrival      | string | body     | No       | Arrival time (ISO format)             |
| courier_name      | string | body     | No       | Name of the courier                   |
| courier_phone     | string | body     | No       | Phone number of courier               |
| status            | string | body     | No       | Status (Active, Inactive, Completed)  |

**Response Format:**

```json
{
  "success": true,
  "message": "Item transit updated successfully",
  "data": {
    "item_transit_id": "transit-uuid-98765",
    "updated_at": "2025-09-14T11:00:00Z",
    "dest_node_id": "node-uuid-33333",
    "courier_name": "Jane Smith",
    "courier_phone": "+62887654321",
    "status": "Active"
  }
}
```

### Complete Item Transit

**Endpoint:** `POST /api/item-transit/{item_transit_id}/complete`

**Description:** Marks an item transit as completed and updates arrival time.

**Request Parameters:**

| Parameter        | Type   | Location | Required | Description                    |
| ---------------- | ------ | -------- | -------- | ------------------------------ |
| item_transit_id  | string | params   | Yes      | UUID of the transit record     |
| time_arrival     | string | body     | Yes      | Arrival time (ISO format)      |

**Response Format:**

```json
{
  "success": true,
  "message": "Item transit completed successfully",
  "data": {
    "item_transit_id": "transit-uuid-98765",
    "completed_at": "2025-09-14T12:30:00Z",
    "time_departure": "2025-09-14T10:00:00Z",
    "time_arrival": "2025-09-14T12:30:00Z",
    "duration_minutes": 150,
    "status": "Completed",
    "item_instance": {
      "item_instance_id": "item-instance-uuid-12345",
      "new_location": {
        "node_id": "node-uuid-22222",
        "node_name": "Node B"
      }
    }
  }
}
```

### List Active Transits

**Endpoint:** `GET /api/item-transits`

**Description:** Retrieves active transit records with optional filtering.

**Request Parameters:**

| Parameter        | Type   | Location | Required | Description                    |
| ---------------- | ------ | -------- | -------- | ------------------------------ |
| source_node_id   | string | query    | No       | Filter by source node          |
| dest_node_id     | string | query    | No       | Filter by destination node     |
| status           | string | query    | No       | Filter by status (default: Active)               |
| courier_name     | string | query    | No       | Filter by courier name         |
| page_size        | number | query    | No       | Items per page (default: 50)  |
| page             | number | query    | No       | Page number (default: 1)      |

**Response Format:**

```json
{
  "success": true,
  "message": "Transit records retrieved successfully",
  "data": {
    "transits": [
      {
        "item_transit_id": "transit-uuid-98765",
        "created_at": "2025-09-14T10:00:00Z",
        "time_departure": "2025-09-14T10:00:00Z",
        "time_arrival": null,
        "courier_name": "John Doe",
        "courier_phone": "+62812345678",
        "status": "Active",
        "item_instance": {
          "item_instance_id": "item-instance-uuid-12345",
          "item_count": 10,
          "item_type": {
            "item_name": "Indomie Goreng",
            "item_type": "Food"
          }
        },
        "source_node": {
          "node_id": "node-uuid-11111",
          "node_name": "Node A"
        },
        "dest_node": {
          "node_id": "node-uuid-22222",
          "node_name": "Node B"
        }
      }
    ],
    "summary": {
      "total_active_transits": 8,
      "average_duration_minutes": 120,
      "longest_transit_days": 2
    },
    "pagination": {
      "total_items": 8,
      "current_page": 1,
      "items_per_page": 50,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

## User CRUD Endpoints

CRUD operations for managing users in the system.

> [!NOTE]
> **Single Role Per User**: Each user can only have ONE role assigned at a time. The role can be one of: `petugas`, `admin_node`, or `admin_pusat`.

### Database Table Schema

#### User Table

**Name:** user  
**Columns:**

- user_node_id (UUID, generated, primary key)
- user_id (UUID, foreign id to supabsase auth users table)
- node_id (UUID, foreign key to node table)
- created_at (timestamp, auto-generated)

---

#### User Roles Table

**Name:** user_roles  
**Columns:**

- id (UUID, generated, primary key)
- user_node_id (UUID, foreign key to user table)
- role (string, [petugas, admin_node, admin_pusat])


### Create User

**Endpoint:** `POST /api/user`

**Description:** Creates a new user with auth account, profile, and roles.

**Request Parameters:**

| Parameter | Type     | Location | Required | Description                           |
| --------- | -------- | -------- | -------- | ------------------------------------- |
| email     | string   | body     | Yes      | User's email address                  |
| password  | string   | body     | Yes      | User's password                       |
| node_id   | string   | body     | Yes      | UUID of the node to assign user       |
| role      | string   | body     | Yes      | User role [petugas, admin_node, admin_pusat] |

**Example Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "node_id": "node-uuid-12345",
  "role": "admin_node"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user_node_id": "user-node-uuid-12345",
    "user_id": "auth-uuid-67890",
    "email": "user@example.com",
    "node_id": "node-uuid-12345",
    "role": "admin_node",
    "created_at": "2025-09-14T10:30:00Z"
  }
}
```

### Read User

**Endpoint:** `GET /api/user/{user_node_id}`

**Description:** Retrieves details of a specific user by user_node_id.

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description                    |
| ------------ | ------ | -------- | -------- | ------------------------------ |
| user_node_id | string | params   | Yes      | UUID of the user profile       |

**Response Format:**

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user_node_id": "user-node-uuid-12345",
    "user_id": "auth-uuid-67890",
    "email": "user@example.com",
    "node": {
      "id": "node-uuid-12345",
      "name": "Node A",
      "type": "Source",
      "address": "Warehouse Building A"
    },
    "role": "admin_node",
    "created_at": "2025-09-14T10:30:00Z"
  }
}
```

### Update User

**Endpoint:** `PUT /api/user/{user_node_id}`

**Description:** Updates an existing user's information including email, node, and roles.

**Request Parameters:**

| Parameter    | Type     | Location | Required | Description                           |
| ------------ | -------- | -------- | -------- | ------------------------------------- |
| user_node_id | string   | params   | Yes      | UUID of the user profile to update    |
| email        | string   | body     | No       | New email address                     |
| password     | string   | body     | No       | New password (min. 6 characters)      |
| node_id      | string   | body     | No       | New node assignment                   |
| role         | string   | body     | No       | New role (replaces existing role)     |

**Example Request Body:**

```json
{
  "email": "newemail@example.com",
  "password": "newsecurepassword123",
  "node_id": "node-uuid-67890",
  "role": "admin_pusat"
}
```

**Note:** All fields are optional. You can update any combination of email, password, node_id, and role.

**Response Format:**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user_node_id": "user-node-uuid-12345",
    "user_id": "auth-uuid-67890",
    "email": "newemail@example.com",
    "node": {
      "id": "node-uuid-67890",
      "name": "Node B",
      "type": "Distribution",
      "address": "Distribution Center B"
    },
    "role": "admin_pusat",
    "created_at": "2025-09-14T10:30:00Z",
    "updated_at": "2025-09-14T11:00:00Z"
  }
}
```

**Error Responses:**

```json
// Password too short
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}

// Invalid role
{
  "success": false,
  "message": "Invalid role: invalid_role. Valid roles are: petugas, admin_node, admin_pusat"
}

// Invalid node_id
{
  "success": false,
  "message": "Invalid node_id. Node does not exist."
}

// User not found
{
  "success": false,
  "message": "User not found"
}
```

### Delete User

**Endpoint:** `DELETE /api/user/{user_node_id}`

**Description:** Deletes a user completely (auth account, profile, and roles).

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description              |
| ------------ | ------ | -------- | -------- | ------------------------ |
| user_node_id | string | params   | Yes      | UUID of the user profile |

**Response Format:**

```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "user_node_id": "user-node-uuid-12345",
    "deleted_at": "2025-09-14T11:15:00Z"
  }
}
```

### List All Users

**Endpoint:** `GET /api/user`

**Description:** Retrieves a list of all users with profiles and their role completion status.

> [!NOTE]
> Due to API limitations, only users with existing profiles are shown. Users who exist only in Supabase Auth without profiles are not visible.

**Response includes:**
- `is_valid`: Boolean indicating if user has both profile and role
- `status`: User completion status - `complete` or `missing_role`
- `statistics`: Summary of user completion status for profiled users

**Request Parameters:**

| Parameter | Type   | Location | Required | Description                    |
| --------- | ------ | -------- | -------- | ------------------------------ |
| node_id   | string | query    | No       | Filter by node ID              |
| role      | string | query    | No       | Filter by role                 |
| page_size | number | query    | No       | Items per page (default: 50)  |
| page      | number | query    | No       | Page number (default: 1)      |

**Response Format:**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "user_id": "auth-uuid-67890",
        "email": "user@example.com",
        "user_node_id": "user-node-uuid-12345",
        "node": {
          "id": "node-uuid-12345",
          "name": "Node A",
          "type": "Source",
          "address": "Warehouse Building A"
        },
        "role": "admin_node",
        "created_at": "2025-09-14T10:30:00Z",
        "is_valid": true,
        "status": "complete"
      },
      {
        "user_id": "auth-uuid-22222",
        "email": "norole@example.com",
        "user_node_id": "user-node-uuid-67890",
        "node": {
          "id": "node-uuid-67890",
          "name": "Node B",
          "type": "Distribution",
          "address": "Distribution Center B"
        },
        "role": null,
        "created_at": "2025-09-14T09:30:00Z",
        "is_valid": false,
        "status": "missing_role"
      }
    ],
    "statistics": {
      "total_profiles": 9,
      "valid_users": 8,
      "missing_roles": 1,
      "note": "Only showing users with profiles. Auth-only users without profiles are not visible due to API limitations."
    },
    "pagination": {
      "total_items": 9,
      "current_page": 1,
      "items_per_page": 50,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

### Get User Role

**Endpoint:** `GET /api/user/{user_node_id}/roles`

**Description:** Retrieves the role assigned to a specific user.

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description              |
| ------------ | ------ | -------- | -------- | ------------------------ |
| user_node_id | string | params   | Yes      | UUID of the user profile |

**Response Format:**

```json
{
  "success": true,
  "message": "User role retrieved successfully",
  "data": {
    "user_node_id": "user-node-uuid-12345",
    "role": {
      "id": "role-uuid-11111",
      "role": "admin_node",
      "created_at": "2025-09-14T10:30:00Z"
    }
  }
}
```

### Update User Role

**Endpoint:** `PUT /api/user/{user_node_id}/roles`

**Description:** Replace the user's role (removes existing and sets new one).

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description                           |
| ------------ | ------ | -------- | -------- | ------------------------------------- |
| user_node_id | string | params   | Yes      | UUID of the user profile              |
| role         | string | body     | Yes      | New role to assign [petugas, admin_node, admin_pusat] |

**Example Request Body:**

```json
{
  "role": "admin_pusat"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user_node_id": "user-node-uuid-12345",
    "role": {
      "id": "role-uuid-33333",
      "role": "admin_pusat",
      "created_at": "2025-09-14T11:00:00Z"
    },
    "updated_at": "2025-09-14T11:00:00Z"
  }
}
```

### Set User Role

**Endpoint:** `POST /api/user/{user_node_id}/roles`

**Description:** Sets a user's role (replaces existing role if any).

**Request Parameters:**

| Parameter    | Type   | Location | Required | Description                           |
| ------------ | ------ | -------- | -------- | ------------------------------------- |
| user_node_id | string | params   | Yes      | UUID of the user profile              |
| role         | string | body     | Yes      | Role to set [petugas, admin_node, admin_pusat] |

**Example Request Body:**

```json
{
  "role": "admin_pusat"
}
```

**Response Format:**

```json
{
  "success": true,
  "message": "Role set successfully",
  "data": {
    "id": "role-uuid-55555",
    "role": "admin_pusat",
    "created_at": "2025-09-14T11:05:00Z"
  }
}
```

