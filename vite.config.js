import { defineConfig } from 'vite'

// The card is built into the integration, which serves it to Home Assistant's dashboards as one module.
export default defineConfig({
    publicDir: false,
    build: {
        outDir: 'custom_components/kids_dashboard/www',
        emptyOutDir: true,
        lib: {
            entry: './src/kids-dashboard-card.js',
            formats: ['es'],
            fileName: () => 'kids-dashboard-card.js',
        },
    },
})
