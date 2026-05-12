import { expect, test } from 'vitest'
import { normalizeURL } from './crawl.js'

test('normalize 1st url: https://www.boot.dev/blog/path/', () => {
  const url = 'https://www.boot.dev/blog/path/'
  const expected = 'www.boot.dev/blog/path'
  expect(normalizeURL(url)).toBe(expected)
})

test('normalize 2nd url: https://www.boot.dev/blog/path', () => {
  const url = 'https://www.boot.dev/blog/path'
  const expected = 'www.boot.dev/blog/path'
  expect(normalizeURL(url)).toBe(expected)
})

test('normalize 3rd url: http://www.boot.dev/blog/path/', () => {
  const url = 'http://www.boot.dev/blog/path/'
  const expected = 'www.boot.dev/blog/path'
  expect(normalizeURL(url)).toBe(expected)
})

test('normalize 4th url: http://www.boot.dev/blog/path', () => {
  const url = 'http://www.boot.dev/blog/path'
  const expected = 'www.boot.dev/blog/path'
  expect(normalizeURL(url)).toBe(expected)
})

