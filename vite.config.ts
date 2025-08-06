import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/one-night-ultimate-werewolf-narrator/', // Replace REPO_NAME with your actual repo name
})
