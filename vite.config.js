import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/send-otp': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/verify-otp': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
