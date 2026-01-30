
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que o SDK do Gemini consiga ler a chave da API do ambiente
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
