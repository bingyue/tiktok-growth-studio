import { defineConfig } from 'vite';
export default defineConfig({ build: { outDir: 'dist' }, server: { allowedHosts: ['localhost', '127.0.0.1'], hmr: false } });
