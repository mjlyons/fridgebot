# FridgeBot

A Node.js TypeScript project.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Authentication:
```bash
npm run auth
```
This will generate a refresh token. Copy the token and set it in your `.env` file:
```
RING_REFRESH_TOKEN=your_generated_token_here
```

3. Development:
```bash
npm run dev
```

4. Build:
```bash
npm run build
```

5. Start:
```bash
npm start
```

## Project Structure

- `src/` - Source files
- `dist/` - Compiled JavaScript files
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration 

## TODO

- [] hook up dead man's snitch
- [] update the .env docs
- [] update config setup
- [] Get it running on a managed server
