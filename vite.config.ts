import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/ante-up-dice/',
  plugins: [react(), VitePWA({registerType:'autoUpdate',includeAssets:['icon.svg'],manifest:{name:'Ante Up Dice',short_name:'Ante Up',description:'A tactile solo dice-poker roguelike.',theme_color:'#102c24',background_color:'#071712',display:'standalone',start_url:'/ante-up-dice/',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}]}})],
  test:{environment:'jsdom',setupFiles:['./src/test/setup.ts'],css:true,exclude:['e2e/**','node_modules/**']}
});
