import 'dotenv/config';

function main() {
    const ringRefreshToken = process.env.RING_REFRESH_TOKEN;
    if (!ringRefreshToken) {
        console.error('Refresh token not found in environment variables');
        process.exit(1);
    }
    
    // Use the refresh token securely
    console.log(`Refresh token loaded successfully`);
    // ... rest of your code ...
}

main(); 