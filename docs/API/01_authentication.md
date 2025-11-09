# Authentication API Documentation

This document defines the authentication API endpoints for standardization between frontend and backend development teams.

## Table of Contents

- [Authentication API Documentation](#authentication-api-documentation)
  - [Table of Contents](#table-of-contents)
  - [Login Endpoint](#login-endpoint)
    - [Request Parameters](#request-parameters)
    - [Request Body Example](#request-body-example)
    - [HTTP Response Codes \& Logic](#http-response-codes--logic)
      - [✅ 200 OK](#-200-ok)
      - [Error Responses](#error-responses)
  - [User Node](#user-node)
    - [Request Parameters](#request-parameters-1)
    - [HTTP Response Codes \& Logic](#http-response-codes--logic-1)
      - [✅ 200 OK](#-200-ok-1)
      - [Error Responses](#error-responses-1)

---

## Login Endpoint

**Endpoint:** `POST /api/login`

**Description:** Authenticates user credentials and returns user information with associated node details.

### Request Parameters

| Parameter | Type   | Location | Required | Description                  |
| --------- | ------ | -------- | -------- | ---------------------------- |
| username  | string | body     | Yes      | User's login username        |
| password  | string | body     | Yes      | User's password (plain text) |

> [!WARNING]
> TEMPORARY: Use plain text passwords for initial development. Implement secure password handling (hashing and salting) before production deployment.

### Request Body Example

```json
{
  "username": "user123",
  "password": "password123"
}
```

### HTTP Response Codes & Logic

#### ✅ 200 OK

**When:** Valid credentials provided and user exists
**Logic:**

- Verify username exists in database
- Validate password against stored hash
- Retrieve user details and associated node information
- Return user data with node details

**Response Format:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "user123",
      "name": "John Doe",
      "role": "Admin Node | Petugas Node | Admin Pusat",
      "node_id": "uuid-string"
    },
    "node": {
      "id": "uuid-string",
      "name": "Node A",
      "type": "Storage | Assembly | Distribution",
      "location": "Warehouse Building A"
    },
    "isSuperAdmin": true
  }
}
```

#### Error Responses

- `401 Unauthorized` when credentials are invalid
- `400 Bad Request` when request body is malformed
- `500 Internal Server Error` for unexpected server issues

## User Node

**Endpoint:** `GET /api/user/node`
**Description:** Retrieves the node information associated with the authenticated user.

### Request Parameters

| Parameter | Type | Location | Required | Description |
| --------- | ---- | -------- | -------- | ----------- |
| None      |      |          |          | This endpoint does not require any parameters. |

### HTTP Response Codes & Logic

#### ✅ 200 OK

**When:** The authenticated user has an assigned node.
**Logic:**

- Retrieve the authenticated user from the Supabase session.
- Query the `user` table to fetch the `node_id` associated with the user.
- Query the `nodes` table to fetch details of the node using the `node_id`.
- Return the node details in the response.

**Response Format:**

```json
{
  "success": true,
  "message": "User node retrieved successfully",
  "data": {
    "user_id": "uuid-string",
    "node": {
      "id": "uuid-string",
      "name": "Node A",
      "type": "Storage | Assembly | Distribution",
      "location": "Warehouse Building A"
    }
  }
}
```

#### Error Responses

- `401 Unauthorized` when the user is not authenticated.
- `404 Not Found` when the user does not have an assigned node or the node does not exist.
- `500 Internal Server Error` for unexpected server issues.