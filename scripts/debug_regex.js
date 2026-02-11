
const { createClient } = require('@supabase/supabase-js');

// Regex from app/auth/sign-up/page.tsx
const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const emails = [
    '@test.com',
    'test.com',
    'test@test',
    'test@test.',
    'test@test.c',
    'test@test.com',
    'valid.email+tag@example.co.uk'
];

console.log('--- Regex Tests ---');
emails.forEach(email => {
    console.log(`"${email}": ${re.test(email)}`);
});

// Check if profiles has email column
// We need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env
// But we might not have access to .env file directly if it's local.
// I will try to read .env.local first.
