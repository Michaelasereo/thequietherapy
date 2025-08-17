require('dotenv').config({ path: '.env.local' });

console.log('🕐 Testing Timezone Handling...\n');

// Test the same logic as the therapist login API
const token = require('crypto').randomUUID();
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

console.log('Token:', token);
console.log('Expires At (ISO):', expiresAt.toISOString());
console.log('Expires At (Local):', expiresAt.toString());
console.log('Now (ISO):', new Date().toISOString());
console.log('Now (Local):', new Date().toString());

// Test the same logic as verifyMagicLink
const now = new Date();
console.log('\n🔍 Verification Logic:');
console.log('Now > ExpiresAt:', now > expiresAt);
console.log('Now.getTime() > ExpiresAt.getTime():', now.getTime() > expiresAt.getTime());

// Test with ISO string comparison
console.log('\n🔍 ISO String Comparison:');
console.log('Now ISO > ExpiresAt ISO:', now.toISOString() > expiresAt.toISOString());

// Test the database query logic
console.log('\n🔍 Database Query Logic:');
console.log('Query condition: expires_at >', now.toISOString());
console.log('Should find link:', expiresAt.toISOString() > now.toISOString());
