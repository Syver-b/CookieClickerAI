# Cookie Club

A small Cookie Clicker-style game built with React, TypeScript, and Vite. Click
the cookie to bake, spend cookies on producers, and unlock a click-strength
upgrade.

## Features

- Four producers that bake cookies automatically.
- A click upgrade that doubles cookies earned per click.
- Progress saved in your browser with up to 8 hours of offline production.
- Responsive layout for desktop and mobile screens.

Progress is stored in the current browser using `localStorage`; it is not synced
between devices.

## Run locally

Install Node.js and npm, then run:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

## Build

Create a production build:

```sh
npm run build
```

To serve the production build locally:

```sh
npm run preview
```