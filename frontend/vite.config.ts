import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// Clean URL rewrite middleware plugin
function cleanUrlMiddleware(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const rawUrl = req.url ?? '';
  const [pathname, search] = rawUrl.split('?');
  const queryStr = search ? `?${search}` : '';

  // Redirect /app.html → /app
  if (pathname === '/app.html') {
    res.writeHead(301, { Location: `/app${queryStr}` });
    res.end();
    return;
  }

  // Redirect /admin.html → /admin
  if (pathname === '/admin.html') {
    res.writeHead(301, { Location: `/admin${queryStr}` });
    res.end();
    return;
  }

  // Redirect /index.html or /landing or /landing.html → /
  if (pathname === '/index.html' || pathname === '/landing' || pathname === '/landing.html') {
    res.writeHead(301, { Location: `/${queryStr}` });
    res.end();
    return;
  }

  // Rewrite /app or /app/* → /app.html internally
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    req.url = `/app.html${queryStr}`;
    return next();
  }

  // Rewrite /admin or /admin/* → /admin.html internally
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    req.url = `/admin.html${queryStr}`;
    return next();
  }

  next();
}

const cleanUrlPlugin = {
  name: 'clean-url-middleware',
  configureServer(server: any) {
    server.middlewares.use(cleanUrlMiddleware);
  },
  configurePreviewServer(server: any) {
    server.middlewares.use(cleanUrlMiddleware);
  }
};

export default defineConfig({
  plugins: [react(), cleanUrlPlugin],
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        // Landing page — / (root)
        main: resolve(__dirname, 'index.html'),
        // Main app — /app
        app: resolve(__dirname, 'app.html'),
        // Dedicated Standalone Admin Workspace — /admin
        admin: resolve(__dirname, 'admin.html'),
      }
    }
  }
});
