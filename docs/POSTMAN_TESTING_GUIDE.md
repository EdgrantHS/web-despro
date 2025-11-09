# Postman Testing Guide - Login API

## 🚀 Testing Login API dengan Postman

### **Endpoint:** `POST /api/login`

## 📋 **Setup Postman:**

### **1. Create New Request**
1. Buka **Postman**
2. Klik **"New"** → **"HTTP Request"**
3. Set method ke **"POST"**

### **2. Configure Request**
```
Method: POST
URL: http://localhost:3000/api/login
```

### **3. Set Headers**
```
Content-Type: application/json
```

### **4. Set Body (JSON)**
```json
{
  "email": "admin.pusat@despro.com",
  "password": "admin123"
}
```

## 🎯 **Test Cases:**

### **Test Case 1: Valid Login (Admin Pusat)**
```json
{
  "email": "admin.pusat@despro.com",
  "password": "admin123"
}
```

### **Test Case 1b: Valid Login (Admin Node)**
```json
{
  "email": "admin.node@despro.com",
  "password": "admin123"
}
```

### **Test Case 1c: Valid Login (Petugas)**
```json
{
  "email": "petugas@despro.com",
  "password": "admin123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "0d2c97b0-dcd9-4b0f-9316-86d5e52890bf",
      "username": "admin.pusat@despro.com",
      "name": "admin.pusat@despro.com",
      "role": "admin_pusat",
      "node_id": "550e8400-e29b-41d4-a716-446655440001"
    },
    "node": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Node A",
      "type": "Storage",
      "location": "Warehouse Building A"
    }
  }
}
```

### **Test Case 2: Invalid Credentials**
```json
{
  "email": "admin.pusat@despro.com",
  "password": "wrongpassword"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### **Test Case 3: Missing Fields**
```json
{
  "email": "admin.pusat@despro.com"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

### **Test Case 4: Invalid Email Format**
```json
{
  "email": "invalid-email",
  "password": "admin123"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

## 🔍 **Step-by-Step Testing:**

### **Step 1: Setup Request**
1. **Method**: POST
2. **URL**: `http://localhost:3000/api/login`
3. **Headers**: `Content-Type: application/json`

### **Step 2: Test Valid Login**
1. **Body**:
   ```json
   {
     "email": "admin.pusat@despro.com",
     "password": "admin123"
   }
   ```
2. **Send Request**
3. **Check Response**: Should be 200 OK with user data

### **Step 3: Test Error Cases**
1. **Wrong Password**: Change password to "wrong"
2. **Missing Email**: Remove email field
3. **Invalid Email**: Use "invalid@email"

### **Step 4: Verify Response Format**
- ✅ **Status Code**: 200 for success, 401 for invalid, 400 for bad request
- ✅ **Response Structure**: Matches API specification
- ✅ **User Data**: Contains id, username, name, role, node_id
- ✅ **Node Data**: Contains id, name, type, location

## 📊 **Response Validation:**

### **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "username": "admin.pusat@despro.com",
      "name": "admin.pusat@despro.com",
      "role": "admin_pusat",
      "node_id": "uuid-string"
    },
    "node": {
      "id": "uuid-string",
      "name": "Node A",
      "type": "Storage",
      "location": "Warehouse Building A"
    }
  }
}
```

### **Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### **Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

## 🚀 **Quick Test Commands:**

### **cURL Equivalent:**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.pusat@despro.com",
    "password": "admin123"
  }'
```

### **JavaScript Fetch:**
```javascript
fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin.pusat@despro.com',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🔧 **Troubleshooting:**

### **Error: "Connection refused"**
- Pastikan development server running (`npm run dev`)
- Cek URL: `http://localhost:3000`

### **Error: "Invalid credentials"**
- Pastikan user sudah confirmed di Supabase
- Cek email dan password benar
- Cek database data untuk user

### **Error: "Failed to fetch user role"**
- Cek data di tabel `user_roles`
- Pastikan user_id sesuai

### **Error: "Failed to fetch node data"**
- Cek data di tabel `nodes`
- Pastikan node_id ada

## 📱 **Expected Results:**

### **Valid Login:**
- ✅ **Status**: 200 OK
- ✅ **User Data**: Complete user information
- ✅ **Node Data**: Complete node information
- ✅ **Role**: admin_pusat
- ✅ **Node Assignment**: User assigned to node

### **Invalid Login:**
- ✅ **Status**: 401 Unauthorized
- ✅ **Message**: "Invalid credentials"
- ✅ **No User Data**: Response tidak mengandung data user

**Postman testing siap! Gunakan endpoint dan body yang sudah disediakan.** 🎉
