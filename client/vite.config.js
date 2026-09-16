import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';



export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_PROXY_TARGET || 'http://localhost:1800' || "https://ems2k26.onrender.com/,
                changeOrigin: true,
            },
        },
    }
});
