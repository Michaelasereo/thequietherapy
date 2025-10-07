# 🧪 Partner Dashboard Testing Guide

## 📋 Overview
This guide provides comprehensive testing instructions for the Partner Dashboard functionality in the TRPI application.

## 🎯 Test Environment
- **Server URL**: `http://localhost:3001`
- **Test Partner Email**: `test-partner@example.com`
- **Partner Login URL**: `http://localhost:3001/partner/login`
- **Partner Dashboard URL**: `http://localhost:3001/partner/dashboard`

## 🧪 Testing Checklist

### **Phase 1: Authentication Testing** 🔐

#### **Step 1.1: Partner Login Page**
- [ ] Navigate to `http://localhost:3001/partner/login`
- [ ] Verify page loads without errors
- [ ] Check that the page displays:
  - [ ] Partner-specific branding and messaging
  - [ ] Google OAuth button
  - [ ] Email input field
  - [ ] "Send Magic Link" button
  - [ ] Link to partner enrollment

#### **Step 1.2: Magic Link Authentication**
- [ ] Enter test email: `test-partner@example.com`
- [ ] Click "Send Magic Link"
- [ ] Verify success message appears
- [ ] Check email inbox for magic link
- [ ] Click the magic link in email
- [ ] Verify redirect to partner dashboard

#### **Step 1.3: Session Management**
- [ ] Verify partner session cookie is set
- [ ] Check that dashboard loads without redirect
- [ ] Test session persistence across page refreshes

### **Phase 2: Dashboard Core Features** 📊

#### **Step 2.1: Dashboard Overview**
- [ ] Verify dashboard header displays "Partner Overview"
- [ ] Check that all summary cards load:
  - [ ] Total Credits Purchased
  - [ ] Credits Remaining
  - [ ] Active Members
  - [ ] Total Sessions Booked
- [ ] Verify data displays correctly (not all zeros)

#### **Step 2.2: Recent Activity Section**
- [ ] Check "Latest member additions" section
- [ ] Check "Latest credit purchases" section
- [ ] Check "Recent session usage" section
- [ ] Verify data displays or shows appropriate "no data" messages

#### **Step 2.3: Quick Actions**
- [ ] Verify "Add Members" button is present
- [ ] Verify "Purchase Credits" button is present
- [ ] Verify "Assign Credits" button is present
- [ ] Test button interactions (should navigate to appropriate sections)

### **Phase 3: Member Management** 👥

#### **Step 3.1: Member List View**
- [ ] Navigate to members section
- [ ] Verify member list loads
- [ ] Check member information displays:
  - [ ] Name
  - [ ] Email
  - [ ] Credits assigned
  - [ ] Credits used
  - [ ] Status (active/inactive)
  - [ ] Join date

#### **Step 3.2: CSV Upload Feature**
- [ ] Locate CSV upload functionality
- [ ] Prepare test CSV file with member data
- [ ] Upload CSV file
- [ ] Verify upload progress indicator
- [ ] Check success/error messages
- [ ] Verify members are added to the system

#### **Step 3.3: Member Management Actions**
- [ ] Test editing member details
- [ ] Test assigning credits to members
- [ ] Test suspending/activating members
- [ ] Test removing members
- [ ] Verify changes are reflected in the system

### **Phase 4: Credit System** 💳

#### **Step 4.1: Credit Overview**
- [ ] Navigate to credits section
- [ ] Verify credit balance displays correctly
- [ ] Check credit transaction history
- [ ] Verify credit usage statistics

#### **Step 4.2: Credit Purchases**
- [ ] Test credit purchase flow
- [ ] Verify payment integration works
- [ ] Check that credits are added after purchase
- [ ] Verify transaction appears in history

#### **Step 4.3: Credit Assignment**
- [ ] Test assigning credits to members
- [ ] Verify credit distribution works
- [ ] Check that member credit balances update
- [ ] Verify partner credit balance decreases

### **Phase 5: Session Management** 📅

#### **Step 5.1: Session Overview**
- [ ] Navigate to sessions section
- [ ] Verify upcoming sessions display
- [ ] Check past sessions history
- [ ] Verify session details include:
  - [ ] Member name
  - [ ] Therapist name
  - [ ] Session date/time
  - [ ] Session status
  - [ ] Credits used

#### **Step 5.2: Session Reports**
- [ ] Test generating session reports
- [ ] Verify report data accuracy
- [ ] Check export functionality
- [ ] Test date range filtering

### **Phase 6: Navigation & UI** 🎨

#### **Step 6.1: Navigation Menu**
- [ ] Verify all navigation links work
- [ ] Check responsive design on mobile
- [ ] Test sidebar collapse/expand
- [ ] Verify active page highlighting

#### **Step 6.2: User Interface**
- [ ] Check loading states for all async operations
- [ ] Verify error messages display properly
- [ ] Test form validations
- [ ] Check accessibility features

## 🐛 Common Issues & Troubleshooting

### **Authentication Issues**
- **Magic link not received**: Check email spam folder
- **Invalid session**: Clear browser cookies and try again
- **Redirect loops**: Check middleware configuration

### **Data Loading Issues**
- **Empty dashboard**: Verify partner has valid data in database
- **API errors**: Check browser console for error messages
- **Slow loading**: Check network requests in browser dev tools

### **Member Management Issues**
- **CSV upload fails**: Verify file format and data structure
- **Members not appearing**: Check database queries and filters
- **Credit assignment errors**: Verify credit balance and permissions

## 📊 Expected Test Results

### **Successful Authentication**
- Magic link sent and received
- Successful login and redirect to dashboard
- Session maintained across page refreshes

### **Dashboard Data**
- All summary cards display real data
- Recent activity sections populate correctly
- Quick actions are functional

### **Member Management**
- Members list loads and displays correctly
- CSV upload processes successfully
- Member actions (edit, assign credits, etc.) work

### **Credit System**
- Credit balance displays accurately
- Purchase flow completes successfully
- Credit assignment updates balances correctly

### **Session Management**
- Sessions display with correct information
- Reports generate with accurate data
- Navigation between sections works smoothly

## 🎯 Testing Success Criteria

✅ **All authentication flows work correctly**  
✅ **Dashboard loads with real data**  
✅ **Member management features are functional**  
✅ **Credit system operates correctly**  
✅ **Session management works as expected**  
✅ **UI is responsive and user-friendly**  
✅ **No console errors or broken functionality**  

## 📝 Post-Testing Actions

1. **Document any bugs found** with detailed reproduction steps
2. **Record performance metrics** (page load times, API response times)
3. **Note any UI/UX improvements** that could enhance user experience
4. **Verify data integrity** across all tested features
5. **Test edge cases** and error scenarios

## 🔄 Continuous Testing

- **Daily**: Test core authentication and dashboard loading
- **Weekly**: Full member management and credit system testing
- **Before releases**: Complete end-to-end testing of all features
- **After deployments**: Verify all functionality still works correctly

---

**Note**: This testing guide should be updated as new features are added to the partner dashboard.
