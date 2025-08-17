require('dotenv').config({ path: '.env.local' });

async function testEnrollmentAction() {
  console.log('🧪 Testing Therapist Enrollment Action...\n');

  try {
    // Import the server action
    const { therapistEnrollAction } = require('../actions/therapist-auth.ts');
    
    // Create FormData like the form would
    const enrollmentData = new FormData();
    enrollmentData.append('fullName', 'Dr. Test Enrollment Action');
    enrollmentData.append('email', 'test-enrollment-action@example.com');
    enrollmentData.append('phone', '+2348012345678');
    enrollmentData.append('mdcnCode', 'MDCN123456');
    enrollmentData.append('specialization', 'Anxiety');
    enrollmentData.append('specialization', 'Depression');
    enrollmentData.append('languages', 'English');
    enrollmentData.append('languages', 'Yoruba');
    enrollmentData.append('termsAccepted', 'true');

    console.log('Calling therapistEnrollAction...');
    const result = await therapistEnrollAction(null, enrollmentData);
    
    console.log('Enrollment result:', result);
    
    if (result.success) {
      console.log('✅ Enrollment successful!');
      if (result.error) {
        console.log('⚠️  Warning:', result.error);
      }
    } else {
      console.log('❌ Enrollment failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing enrollment action:', error);
  }
}

testEnrollmentAction();
