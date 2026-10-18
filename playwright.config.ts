import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',timeout:300000,use:{baseURL:'http://localhost:3000',viewport:{width:1440,height:1000}},webServer:{command:'npm run build && npm start',url:'http://localhost:3000/health',reuseExistingServer:!process.env.CI},reporter:'list'});
