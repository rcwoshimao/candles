import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(() => {
  // Only generate `stats.html` when explicitly requested:
  //   ANALYZE=true npm run build
  const analyze = process.env.ANALYZE === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(analyze ? [visualizer({ open: true, filename: 'stats.html' })] : []),
    ],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        about: './about.html',
      },
    },
  },
  };
})
