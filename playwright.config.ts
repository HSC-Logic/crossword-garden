import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',timeout:60000,fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:4173/garden/',...devices['Desktop Chrome'],hasTouch:true},webServer:{command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173/garden/',reuseExistingServer:!process.env.CI},reporter:'list'});
