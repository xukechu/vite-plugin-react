import fetch from 'node-fetch'
import { expect, test } from 'vitest'
import {
  browserLogs,
  editFile,
  isBuild,
  page,
  untilBrowserLogAfter,
  viteTestUrl as url,
} from '~utils'

test('/env', async () => {
  await untilBrowserLogAfter(() => page.goto(url + '/env'), 'hydrated')

  expect(await page.textContent('h1')).toMatch('default message here')

  // raw http request
  const envHtml = await (await fetch(url + '/env')).text()
  expect(envHtml).toMatch('API_KEY_qwertyuiop')
})

test('/about', async () => {
  await untilBrowserLogAfter(() => page.goto(url + '/about'), 'hydrated')

  expect(await page.textContent('h1')).toMatch('About')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('Expected server HTML')
  })

  // raw http request
  const aboutHtml = await (await fetch(url + '/about')).text()
  expect(aboutHtml).toMatch('About')
})

test('/', async () => {
  await untilBrowserLogAfter(() => page.goto(url), 'hydrated')

  expect(await page.textContent('h1')).toMatch('Home')
  // should not have hydration mismatch
  browserLogs.forEach((msg) => {
    expect(msg).not.toMatch('Expected server HTML')
  })

  // raw http request
  const html = await (await fetch(url)).text()
  expect(html).toMatch('Home')
})

test.skipIf(isBuild)('hmr', async () => {
  await untilBrowserLogAfter(() => page.goto(url), 'hydrated')

  await expect.poll(() => page.textContent('h1')).toMatch('Home')
  editFile('src/pages/Home.jsx', (code) =>
    code.replace('<h1>Home', '<h1>changed'),
  )
  await expect.poll(() => page.textContent('h1')).toMatch('changed')

  // verify the change also affects next SSR
  const res = await page.reload()
  expect(await res?.text()).toContain('<h1>changed')
})

test('client navigation', async () => {
  await untilBrowserLogAfter(() => page.goto(url), 'hydrated')

  await expect.poll(() => page.textContent('a[href="/about"]')).toMatch('About')
  await page.click('a[href="/about"]')
  await expect.poll(() => page.textContent('h1')).toMatch('About')

  if (!isBuild) {
    editFile('src/pages/About.jsx', (code) =>
      code.replace('<h1>About', '<h1>changed'),
    )
    await expect.poll(() => page.textContent('h1')).toMatch('changed')
  }
})
