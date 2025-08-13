require('dotenv').config({ path: '.env.local' });

async function createTestUser() {
  console.log('🔄 Creating test user...');
  
  try {
    // Use the dev-login API to create the user
    const response = await fetch('http://localhost:3000/api/auth/dev-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        full_name: 'John Doe',
        user_type: 'individual',
        credits: 1,
        package_type: 'basic'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully created test user');
    console.log('📊 User data:', data);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    return false;
  }
}

createTestUser();
