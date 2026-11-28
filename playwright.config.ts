import { defineConfig } from '@playwright/test'

const host = '127.0.0.1'
const port = 4175
const baseURL = `http://${host}:${port}`

export default defineConfig({
  testDir: './tests',
  forbidOnly: Boolean(process.env.CI),
  use: {
    baseURL,
    browserName: 'chromium',
  },
  webServer: {
    command: `npm run dev -- --host ${host} --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
})
