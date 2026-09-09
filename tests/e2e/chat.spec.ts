import { expect, test, type Page, type Route } from '@playwright/test'

type CapturedRequest = Record<string, unknown>

function answerFor(question: string): string {
  const normalized = question.toLowerCase()
  if (normalized.includes('audit')) {
    return 'Whether you need a tax audit depends on your business facts. Please consult a CA for individualized guidance.'
  }
  if (normalized.includes('gst') || normalized.includes('quarterly')) {
    return 'GST return dates depend on the return type and filing frequency. Confirm the current deadline with a CA or the GST portal.'
  }
  if (normalized.includes('tds')) {
    return 'TDS deadlines depend on the payment and filing context. Check the current rule with a CA.'
  }
  return 'ITR deadlines depend on your taxpayer category and current rules. Please verify the date with a CA.'
}

async function interceptGemini(page: Page, requests: CapturedRequest[] = []) {
  await page.route(/generativelanguage\.googleapis\.com/, async (route: Route) => {
    const body = route.request().postDataJSON() as CapturedRequest
    requests.push(body)
    const contents = Array.isArray(body.contents) ? body.contents : []
    const lastContent = contents.at(-1) as { parts?: Array<{ text?: string }> } | undefined
    const question = lastContent?.parts?.map((part) => part.text ?? '').join(' ') ?? ''

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: answerFor(question) }],
            },
            finishReason: 'STOP',
          },
        ],
      }),
    })
  })

  return requests
}

test('supports the GST demo flow and shows a visible loading state', async ({ page }) => {
  let releaseResponse!: () => void
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(/generativelanguage\.googleapis\.com/, async (route: Route) => {
    await responseGate
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ content: { role: 'model', parts: [{ text: answerFor('gst') }] }, finishReason: 'STOP' }],
      }),
    })
  })
  await page.goto('/')

  await expect(page.getByRole('banner')).toContainText('CA Buddy')
  await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible()
  await expect(page.getByText(/general information only/i)).toBeVisible()

  await page.getByRole('textbox', { name: /question/i }).fill('When is my GST return due?')
  await page.getByRole('button', { name: /send question/i }).click()

  await expect(page.getByText('When is my GST return due?')).toBeVisible()
  await expect(page.getByRole('status')).toContainText(/thinking/i)
  releaseResponse()
  await expect(page.getByText(/GST return dates depend/i)).toBeVisible()
})

test('preserves follow-up context and clears it with New chat', async ({ page }) => {
  const requests = await interceptGemini(page)
  await page.goto('/')

  const input = page.getByRole('textbox', { name: /question/i })
  await input.fill('When is my GST return due?')
  await page.getByRole('button', { name: /send question/i }).click()
  await expect(page.getByText(/GST return dates depend/i)).toBeVisible()

  await input.fill('What if I file quarterly?')
  await page.getByRole('button', { name: /send question/i }).click()
  await expect(page.getByText(/GST return dates depend/i)).toHaveCount(2)
  await expect.poll(() => requests.length).toBe(2)
  expect(JSON.stringify(requests[1])).toContain('When is my GST return due?')
  expect(JSON.stringify(requests[1])).toContain('What if I file quarterly?')

  await page.getByRole('button', { name: /new chat/i }).click()
  await expect(page.getByText(/ask a question about GST/i)).toBeVisible()
  await expect(page.getByText('When is my GST return due?')).toHaveCount(0)
  await expect(page.getByText(/GST return dates depend/i)).toHaveCount(0)
})

test('recommends a CA for individualized audit questions', async ({ page }) => {
  await interceptGemini(page)
  await page.goto('/')

  await page.getByRole('textbox', { name: /question/i }).fill('Do I need a tax audit for my specific business?')
  await page.getByRole('button', { name: /send question/i }).click()
  await expect(page.getByText(/consult a CA/i)).toBeVisible()
  await expect(page.getByText(/general information only/i)).toBeVisible()
})

test('exposes provider failures as a safe recoverable status', async ({ page }) => {
  await page.route(/generativelanguage\.googleapis\.com/, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'simulated provider failure' } }),
    }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: /new chat/i }).click()
  await page.getByRole('textbox', { name: /question/i }).fill('What is my TDS deadline?')
  await page.getByRole('button', { name: /send question/i }).click()
  await expect(page.getByRole('status')).toContainText(/couldn't retrieve an answer/i)
})

test('keeps the full chat surface usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 })
  await interceptGemini(page)
  await page.goto('/')

  await expect(page.getByRole('textbox', { name: /question/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /send question/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible()
  await expect(page.getByText(/general information only/i)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})
