# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Deploy with Dokploy

Create an **Application** in Dokploy and connect this repository:

1. Set the build type to **Dockerfile** and the Dockerfile path to `Dockerfile`.
2. Set the container port to `3000`.
3. Add the runtime environment variable:

   ```env
   NUXT_PUBLIC_BASE_API_URL=https://api.locafun.uz
   ```

4. Add the domain `locafun.uz`, enable HTTPS, and redirect HTTP to HTTPS.
5. Deploy the application.

The API must allow `https://locafun.uz` in its CORS configuration and support
WebSocket upgrades for chat connections.
