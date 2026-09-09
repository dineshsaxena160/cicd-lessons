import { expect, test } from '@playwright/test'

test('shows a visible error when the browser model key is missing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: /question/i }).fill('What is my TDS deadline?')
  await page.getByRole('button', { name: /send question/i }).click()

  await expect(page.getByRole('status')).toContainText(/not configured/i)
  await expect(page.getByText(/general information only/i)).toBeVisible()
})
