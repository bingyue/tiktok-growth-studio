import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',fullyParallel:false,workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:4349',channel:'chrome',headless:true,trace:'retain-on-failure'},webServer:{command:'DATA_DIR=./data-e2e PORT=4349 npm run dev',url:'http://127.0.0.1:4349/api/health',reuseExistingServer:false,timeout:30000}});
