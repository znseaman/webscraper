import { expect, test } from 'vitest'
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML } from './crawl.js'

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

test('get heading from html: has h1, return text content', () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
  const expected = 'Test Title'
  expect(getHeadingFromHTML(inputBody)).toBe(expected)
})

test('get heading from html: has h2, return text content', () => {
  const inputBody = '<html><body><h2>Test Title 2</h2></body></html>'
  const expected = 'Test Title 2'
  expect(getHeadingFromHTML(inputBody)).toBe(expected)
})

test('get heading from html: no h1 or h2 found, return empty string', () => {
  const inputBody = '<html><body><p>No return</p></body></html>'
  const expected = ''
  expect(getHeadingFromHTML(inputBody)).toBe(expected)
})

test('get first paragraph from html: p found, return text content', () => {
  const inputBody = '<html><body><p>Test Paragraph</p></body></html>'
  const expected = 'Test Paragraph'
  expect(getFirstParagraphFromHTML(inputBody)).toBe(expected)
})

test('get first paragraph from html: no p found, return empty string', () => {
  const inputBody = '<html><body><a>Yeah!</p></body></html>'
  const expected = ''
  expect(getFirstParagraphFromHTML(inputBody)).toBe(expected)
})

test('get first paragraph from html: main found, return text content', () => {
  const inputBody = '<html><body><main>Main Section</main></body></html>'
  const expected = 'Main Section'
  expect(getFirstParagraphFromHTML(inputBody)).toBe(expected)
})




