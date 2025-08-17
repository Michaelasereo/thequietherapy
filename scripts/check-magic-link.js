require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkMagicLink() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const token = '5774ce23-a8c7-4f2a-a4d9-7c85a48e695a';

  try {
    const { data, error } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data) {
      console.log('Magic link details:');
      console.log('Token:', data.token.substring(0, 8) + '...');
      console.log('Created:', data.created_at);
      console.log('Expires:', data.expires_at);
      console.log('Used at:', data.used_at);
      console.log('Is used:', !!data.used_at);
      
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      const timeDiffMs = expiresAt.getTime() - now.getTime();
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      console.log('Current time:', now.toISOString());
      console.log('Time difference (minutes):', timeDiffMinutes);
      console.log('Is expired:', timeDiffMs < 0);
    } else {
      console.log('Magic link not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMagicLink();
