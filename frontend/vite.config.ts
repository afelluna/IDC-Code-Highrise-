import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const stripChartPreload = {
    name: 'strip-chart-modulepreload',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      return html.replace(
        /\s*<link rel="modulepreload" crossorigin href="\/new-monitor\/assets\/chart-[^"]+\.js">\s*/g,
        '\n'
      );
    },
  };

  return {
    plugins: [react(), tailwindcss(), stripChartPreload],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    base: '/new-monitor/',
    build: {
      outDir: '../monitor',
      emptyOutDir: true,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          // Keep production output compact for the kiosk deployment: the monitor
          // route needs most runtime libraries immediately, but the charting
          // stack can wait until after first paint. Keep one core vendor chunk
          // and one lazy chart chunk instead of many small fragments.
          manualChunks(id) {
            if (/[\\/]src[\\/](components[\\/]cards[\\/]Seismogram|components[\\/]ui[\\/]UplotReact)\.tsx$/.test(id))
              return 'chart';
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/]uplot/.test(id)) return 'chart';
            return 'vendor';
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
