import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/Adaptive-Layout-Engine-for-Multi-Surface-Ads/',
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
