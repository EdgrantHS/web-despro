# QR Scanning API Documentation

This document defines the QR scanning API endpoints for standardization between frontend and backend development teams.

## Table of Contents

- [QR Scanning API Documentation](#qr-scanning-api-documentation)
  - [Table of Contents](#table-of-contents)
  - [QR Scan Endpoint](#qr-scan-endpoint)
    - [Request Parameters](#request-parameters)
    - [Request Body Example](#request-body-example)
    - [HTTP Response Codes \& Logic](#http-response-codes--logic)
      - [✅ 200 OK - Item Added to Node](#-200-ok---item-added-to-node)
      - [✅ 200 OK - Item Removed from Node](#-200-ok---item-removed-from-node)
      - [Error Responses](#error-responses)

---

## QR Scan Endpoint

**Endpoint:** `POST /api/qr-scan`

**Description:** Processes QR code scan to manage item transit between nodes. Handles both item removal (from current node to transit) and item addition (from transit to scanning node).

### Request Parameters

| Parameter    | Type   | Location | Required | Description                           |
| ------------ | ------ | -------- | -------- | ------------------------------------- |
| qr_code_data | string | body     | Yes      | QR code content (item instance ID)    |
| user_id      | string | body     | Yes      | ID of the user performing the scan    |
| node_id      | string | body     | Yes      | ID of the node where scan occurred    |

> [!NOTE]
> Phase 1 Implementation: System will automatically determine whether to add or remove item based on current location in database (Eg. if item is at a node, remove it; if item is in transit, add it to the scanning node).

### Request Body Example

```json
{
  "qr_code_data": "item-instance-uuid-12345",
  "user_id": "user-uuid-54321",
  "node_id": "node-uuid-67890"
}
```

### HTTP Response Codes & Logic

#### ✅ 200 OK - Item Added to Node

**When:** Item is currently in transit and scanned at a node
**Logic:**

- Verify QR code data corresponds to valid item instance
- Check item is currently in transit (not assigned to any node)
- Assign item to scanning node
- Remove item from transit table
- Update item_instance location

**Response Format:**

```json
{
  "success": true,
  "message": "Item successfully added to node inventory",
  "data": {
    "action": "item_added",
    "item_instance": {
      "id": "item-instance-uuid-12345",
      "item_name": "Indomie Goreng",
      "item_type": "Fast Food",
    },
    "source_node": {
      "id": "node-uuid-67890",
      "name": "Node A",
      "location": "Warehouse Building A"
    },
    "destination_node": {
      "id": "node-uuid-67880",
      "name": "Node B",
      "location": "Warehouse Building B"
    },
    "transit_record": {
      "completed_at": "2025-09-14T10:30:00Z",
      "duration_minutes": 45
    }
  }
}
```

#### ✅ 200 OK - Item Removed from Node

**When:** Item is currently at a node and scanned for removal
**Logic:**

- Verify QR code data corresponds to valid item instance
- Check item is currently assigned to the scanning node
- Remove item from node inventory
- Create new transit record
- Update item_instance location to transit

**Response Format:**

```json
{
  "success": true,
  "message": "Item successfully removed from node and placed in transit",
  "data": {
    "action": "item_removed",
    "item_instance": {
      "id": "item-instance-uuid-12345",
      "item_name": "Laptop Dell XPS 13",
      "item_type": "Electronics",
      "serial_number": "DLL123456789"
    },
    "source_node": {
      "id": "node-uuid-67890",
      "name": "Node A",
      "location": "Warehouse Building A"
    },
    "transit_record": {
      "id": "transit-uuid-98765",
      "started_at": "2025-09-14T10:30:00Z",
      "origin_node_id": "node-uuid-67890"
    }
  }
}
```

#### Error Responses

- `400 Bad Request` when QR code data is invalid or missing parameters
- `404 Not Found` when item instance doesn't exist
- `409 Conflict` when item is already at the scanning node
- `403 Forbidden` when user doesn't have permission to scan at this node
- `500 Internal Server Error` for unexpected server issues