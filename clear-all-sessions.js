// Simple script to clear all session cookies
// Run this in your browser console to clear all conflicting sessions

// Clear all possible session cookies
const cookiesToClear = [
  'quiet_session',
  'trpi_session', 
  'quiet_individual_user',
  'quiet_therapist_user',
  'quiet_partner_user',
  'quiet_admin_user',
  '__clerk_db_jwt',
  '__clerk_db_jwt_xD45y-ut',
  '__session',
  '__session_xD45y-ut',
  '__refresh_xD45y-ut',
  '__client_uat',
  '__client_uat_xD45y-ut',
  'sb-frzciymslvpohhyefmtr-auth-token-code-verifier'
];

cookiesToClear.forEach(cookieName => {
  // Clear cookie for current domain
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  // Clear cookie for localhost
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
  // Clear cookie for 127.0.0.1
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=127.0.0.1;`;
});

console.log('✅ All session cookies cleared!');
console.log('🔄 Please refresh the page and log in again.');

// Redirect to login page
window.location.href = '/login';
