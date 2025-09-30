# Sample Accounts - Login Testing

## 🚀 **Test Accounts untuk Login System**

### **📋 Daftar Akun Test:**

#### **1. Admin Pusat**
```
Email: admin.pusat@despro.com
Password: admin123
Role: admin_pusat
```
- **Akses**: Super admin dengan akses penuh
- **Permissions**: Semua permissions
- **Node**: Assigned to default node

#### **2. Admin Node**
```
Email: admin.node@despro.com
Password: admin123
Role: admin_node
```
- **Akses**: Admin node dengan akses terbatas
- **Permissions**: Node-specific permissions
- **Node**: Assigned to specific node

#### **3. Petugas**
```
Email: petugas@despro.com
Password: petugas123
Role: petugas
```
- **Akses**: Petugas dengan akses terbatas
- **Permissions**: Limited permissions
- **Node**: Assigned to specific node

## 🔧 **Setup Instructions:**

### **Step 1: Confirm Users di Supabase**
Jalankan script SQL berikut di Supabase SQL Editor:


## 🧪 **Testing Scenarios:**

### **Test Case 1: Admin Pusat Login**
```json
POST /api/login
{
  "email": "admin.pusat@despro.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin.pusat@despro.com",
      "name": "admin.pusat@despro.com",
      "role": "admin_pusat",
      "node_id": "uuid"
    },
    "node": {
      "id": "uuid",
      "name": "Node A",
      "type": "Storage",
      "location": "Warehouse Building A"
    }
  }
}
```

### **Test Case 2: Admin Node Login**
```json
POST /api/login
{
  "email": "admin.node@despro.com",
  "password": "admin123"
}
```

### **Test Case 3: Petugas Login**
```json
POST /api/login
{
  "email": "petugas@despro.com",
  "password": "petugas123"
}
```

## 🔍 **Troubleshooting:**

### **Error: "Invalid credentials"**
- Pastikan user sudah confirmed di Supabase
- Cek email dan password benar
- Jalankan script confirm users

### **Error: "Failed to fetch user role"**
- Cek data di tabel `user_roles`
- Pastikan user_id sesuai

### **Error: "Failed to fetch node data"**
- Cek data di tabel `nodes`
- Pastikan node_id ada

### **Error: "Failed to fetch user data"**
- Cek data di tabel `user`
- Pastikan user_id dan node_id sesuai

## 📱 **Frontend Testing:**

### **Login Form:**
1. Buka `http://localhost:3000/login`
2. Masukkan email dan password
3. Klik "Login"
4. Seharusnya redirect ke `/dashboard`

### **Register Form:**
1. Buka `http://localhost:3000/register`
2. Isi form dengan data baru
3. Klik "Register"
4. Seharusnya redirect ke `/login`

## 🎯 **Expected Results:**

### **Success Login:**
- ✅ **Status**: 200 OK
- ✅ **User Data**: Complete user information
- ✅ **Node Data**: Complete node information
- ✅ **Role**: Sesuai dengan role yang dipilih
- ✅ **Node Assignment**: User assigned to node

### **Dashboard Access:**
- ✅ **Admin Pusat**: Full access
- ✅ **Admin Node**: Node-specific access
- ✅ **Petugas**: Limited access

## 🚀 **Quick Commands:**

### **cURL Test:**
```bash
# Test Admin Pusat
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.pusat@despro.com",
    "password": "admin123"
  }'

# Test Admin Node
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin.node@despro.com",
    "password": "admin123"
  }'

# Test Petugas
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "petugas@despro.com",
    "password": "petugas123"
  }'
```

### **JavaScript Test:**
```javascript
// Test function
async function testLogin(email, password) {
  const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return await response.json();
}

// Test all accounts
testLogin('admin.pusat@despro.com', 'admin123');
testLogin('admin.node@despro.com', 'admin123');
testLogin('petugas@despro.com', 'petugas123');
```

## 📊 **Account Summary:**

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin Pusat | admin.pusat@despro.com | admin123 | Full Access |
| Admin Node | admin.node@despro.com | admin123 | Node Access |
| Petugas | petugas@despro.com | petugas123 | Limited Access |

**Sample accounts siap untuk testing!** 🎉
