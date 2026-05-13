import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
  base: '/__VIBE_CODING_TEST__/',
  plugins: [react(), tailwindcss()],
});
