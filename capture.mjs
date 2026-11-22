import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse((await import('node:fs')).readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))
const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR
const origin = new URL(url).origin
mkdirSync(output, { recursive: true })
if (process.platform === 'linux' && !process.env.DISPLAY) {
  try {
    const display = (await import('node:fs')).readFileSync(join(runtime, 'display'), 'utf8').trim()
    process.env.DISPLAY = display.startsWith(':') ? display : `:${display}`
  } catch (error) {
    console.error(error)
    process.exit(75)
  }
}
const transient = error => Object.assign(error, { exitCode: 75 })
let browser
let exitCode = 0
try {
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(error => { throw transient(error) })
  for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } }).catch(error => { throw transient(error) })
    page.setDefaultTimeout(30000)
    const defects = []
    page.on('pageerror', error => defects.push(`JavaScript error: ${error.message}`))
    page.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin === origin) defects.push(`HTTP ${response.status()}: ${response.url()}`)
    })
    let response
    try { response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }) }
    catch (error) { await page.close().catch(() => {}); throw transient(error) }
    if (!response?.ok()) {
      await page.close().catch(() => {})
      const status = response?.status()
      throw Object.assign(new Error(`Preview navigation failed with HTTP ${status ?? 'no response'}`), { exitCode: !status || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1 })
    }
    try {
      await page.locator('.app-shell .map').waitFor({ state: 'visible', timeout: 30000 })
      await page.locator('.power-btn').waitFor({ state: 'visible', timeout: 30000 })
      await page.waitForFunction(() => document.readyState === 'complete')
    } catch (error) {
      await page.close().catch(() => {})
      throw Object.assign(new Error(`Rendering defect in ${name}: ${error.message}`), { exitCode: 1 })
    }
    try {
      await page.screenshot({ path: join(output, `final-${name}.png`), timeout: 30000 })
    } catch (error) {
      await page.close().catch(() => {})
      if (error.name === 'TimeoutError' || /Target page, context or browser has been closed|browser has been disconnected/i.test(error.message)) throw transient(error)
      throw Object.assign(new Error(`Capture defect in ${name}: ${error.message}`), { exitCode: 1 })
    }
    await page.close()
    if (defects.length) throw Object.assign(new Error(`${name} page errors: ${defects.join('; ')}`), { exitCode: 1 })
    console.log(`Captured ${name}: ${width}x${height}`)
  }
} catch (error) {
  console.error(error)
  exitCode = error.exitCode || 1
} finally {
  try { await browser?.close() }
  catch (error) { console.error(error); exitCode ||= 75 }
}
process.exitCode = exitCode
