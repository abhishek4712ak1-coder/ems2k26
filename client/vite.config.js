import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';



export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://bug-free-eureka-p7pjjqqjrj4gc6xxp-1800.app.github.dev',
                changeOrigin: true,
            },
        },
    }
});