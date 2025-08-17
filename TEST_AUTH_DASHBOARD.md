# Authentication & Dashboard Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
1. Make sure your development server is running: `npm run dev`
2. Ensure Supabase is properly configured
3. Have a test email ready for authentication

---

## 🔐 Authentication Flow Testing

### Test 1: Magic Link Authentication
1. **Navigate to Login Page**
   - Go to `http://localhost:3000/login`
   - Verify the page loads with the black/white design
   - Check that the left panel shows app features demo

2. **Test Magic Link Login**
   - Enter a valid email address
   - Click "Send Magic Link"
   - Verify success message appears
   - Check email for magic link (if configured)

3. **Test Authentication Redirect**
   - Try accessing `/dashboard` without authentication
   - Should redirect to `/auth` or `/login`
   - After successful login, should redirect to dashboard

### Test 2: Registration Flow
1. **Navigate to Signup Page**
   - Go to `http://localhost:3000/signup`
   - Fill out registration form
   - Verify email verification process

---

## 📊 Dashboard Responsive Testing

### Desktop Testing (1920x1080)
1. **Dashboard Layout**
   - Verify welcome message with user's first name
   - Check "Book a Session" button is visible
   - Confirm 4 summary cards in a row
   - Verify upcoming sessions and calendar side by side

2. **Navigation**
   - Test sidebar navigation
   - Verify all menu items are accessible
   - Check user profile dropdown

### Tablet Testing (768x1024)
1. **Responsive Layout**
   - Summary cards should be 2x2 grid
   - Upcoming sessions and calendar should stack
   - Verify touch interactions work

2. **Menu Behavior**
   - Test mobile menu toggle
   - Verify sidebar collapses properly

### Mobile Testing (375x667)
1. **Mobile Layout**
   - Summary cards should be single column
   - All sections should stack vertically
   - Verify touch-friendly button sizes

2. **Mobile Navigation**
   - Test hamburger menu
   - Verify swipe gestures (if implemented)
   - Check mobile-specific interactions

---

## 📅 Booking Flow Testing

### Step 1: Patient Biodata
1. **Form Validation**
   - Test required field validation
   - Verify first name field (not full name)
   - Test age input validation
   - Check gender and marital status dropdowns

2. **Therapist Preferences**
   - Test gender preference dropdown
   - Test specialization preference dropdown
   - Verify both fields are side by side
   - Check "No Preference" options work

### Step 2: Therapist Selection
1. **Filter Functionality**
   - Test gender filter (All, Male, Female, Non-binary)
   - Test specialization filter (All + 5 specializations)
   - Verify filters work in combination
   - Check "All" options reset filters

2. **Therapist Cards**
   - Verify therapist information displays
   - Test card selection
   - Check responsive grid layout

### Step 3: Payment
1. **Payment Integration**
   - Test payment form loading
   - Verify payment method selection
   - Check success/failure handling

---

## 🔧 Manual Testing Checklist

### Authentication
- [ ] Login page loads correctly
- [ ] Magic link authentication works
- [ ] Registration flow completes
- [ ] Protected routes redirect properly
- [ ] Logout functionality works

### Dashboard - Desktop
- [ ] Welcome message displays correctly
- [ ] Summary cards show proper data
- [ ] Upcoming sessions section works
- [ ] Calendar displays correctly
- [ ] Session history shows past sessions
- [ ] Notifications section displays

### Dashboard - Tablet
- [ ] Layout adapts to tablet size
- [ ] Touch interactions work
- [ ] Navigation remains accessible
- [ ] Content is readable

### Dashboard - Mobile
- [ ] Mobile menu works
- [ ] All content is accessible
- [ ] Touch targets are appropriate size
- [ ] No horizontal scrolling

### Booking Flow
- [ ] Step 1: Patient biodata form works
- [ ] Step 2: Therapist selection with filters
- [ ] Step 3: Payment integration
- [ ] Progress bar shows current step
- [ ] Back navigation works
- [ ] Form validation works

---

## 🐛 Common Issues to Check

### Authentication Issues
1. **Magic Link Not Working**
   - Check Supabase email configuration
   - Verify email templates are set up
   - Check browser console for errors

2. **Redirect Loops**
   - Verify middleware configuration
   - Check authentication state management
   - Ensure proper cookie handling

### Responsive Issues
1. **Layout Breaking**
   - Check Tailwind CSS classes
   - Verify breakpoint configurations
   - Test on actual devices

2. **Touch Interactions**
   - Ensure buttons are large enough
   - Check for proper touch event handling
   - Verify mobile menu functionality

### Booking Flow Issues
1. **Form Validation**
   - Check required field validation
   - Verify dropdown selections work
   - Test form submission

2. **API Integration**
   - Verify therapist data loading
   - Check booking API endpoints
   - Test payment integration

---

## 📱 Device Testing Recommendations

### Physical Devices to Test
- iPhone (Safari)
- Android Phone (Chrome)
- iPad (Safari)
- Android Tablet (Chrome)
- Desktop (Chrome, Firefox, Safari)

### Browser DevTools Testing
- Chrome DevTools Device Simulation
- Firefox Responsive Design Mode
- Safari Web Inspector

---

## 🚨 Error Handling Testing

### Network Errors
- Test with slow network connection
- Verify loading states display
- Check error messages are user-friendly

### API Failures
- Test with invalid API responses
- Verify graceful degradation
- Check error boundaries work

### Form Validation
- Test with invalid data
- Verify helpful error messages
- Check form state management

---

## 📝 Testing Notes

### Performance Testing
- Check page load times
- Verify smooth animations
- Test with large datasets

### Accessibility Testing
- Test keyboard navigation
- Verify screen reader compatibility
- Check color contrast ratios

### Security Testing
- Verify authentication tokens
- Check for XSS vulnerabilities
- Test CSRF protection

---

## 🎯 Success Criteria

### Authentication
- Users can successfully log in with magic link
- Protected routes are properly secured
- User sessions persist correctly

### Dashboard
- All responsive breakpoints work correctly
- Data displays accurately
- Navigation is intuitive

### Booking Flow
- Multi-step process works smoothly
- Form validation prevents errors
- Payment integration functions properly

---

## 🔄 Continuous Testing

### Automated Testing
- Set up Jest tests for components
- Configure E2E tests with Playwright
- Implement CI/CD pipeline

### Manual Testing
- Regular testing on different devices
- User acceptance testing
- Performance monitoring

---

*Last updated: [Current Date]*
*Tested by: [Your Name]*
