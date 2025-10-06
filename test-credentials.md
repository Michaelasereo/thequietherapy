# 🧪 Test Credentials & Quick Reference

## 👥 **Available Test Users**

### **Admin User**
- **Email**: `asereopeyemimichael@gmail.com`
- **Name**: Michael Asere
- **Type**: Admin
- **Use for**: Admin dashboard testing

### **Partner User**
- **Email**: `test-partner@example.com`
- **Name**: Test Partner
- **Type**: Partner
- **Use for**: Partner dashboard, CSV upload testing

### **Therapist User**
- **Email**: `test-therapist@example.com`
- **Name**: Test Therapist
- **Type**: Therapist
- **Use for**: Therapist dashboard, video sessions

### **Individual Users**
- **Email**: `test-individual@example.com`
- **Name**: Test Individual
- **Type**: Individual
- **Use for**: Client dashboard, session booking

- **Email**: `newuser@example.com`
- **Name**: New User
- **Type**: Individual
- **Use for**: Additional client testing

- **Email**: `michaelasereo@gmail.com`
- **Name**: Opeyemi
- **Type**: Individual
- **Use for**: Additional client testing

## 🔗 **Quick Access Links**

### **Admin Dashboard**
- URL: `http://localhost:3001/admin/dashboard`
- Login: `http://localhost:3001/admin/login`

### **Partner Dashboard**
- URL: `http://localhost:3001/partner/dashboard`
- Login: `http://localhost:3001/partner/login`

### **Therapist Dashboard**
- URL: `http://localhost:3001/therapist/dashboard`
- Login: `http://localhost:3001/therapist/login`

### **Client Dashboard**
- URL: `http://localhost:3001/dashboard`
- Auth: `http://localhost:3001/auth`

### **Booking Flow**
- URL: `http://localhost:3001/book`

## 📁 **Test Files**

### **CSV Upload Test File**
- File: `test-partner-upload.csv`
- Contains: 5 test users for partner upload testing

## 🎯 **Testing Strategy**

1. **Use different browsers/incognito windows** for different user types
2. **Start with client signup flow** (Test Point 1)
3. **Then test therapist session** (Test Point 2)
4. **Finally test partner CSV upload** (Test Point 3)

## 🔧 **Troubleshooting**

- **Magic Link Issues**: Check email service configuration
- **Session Issues**: Verify database connections
- **Payment Issues**: Check Paystack integration
- **Video Issues**: Verify Daily.co configuration
