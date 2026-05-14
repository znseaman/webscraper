import { expect, test } from 'vitest'
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML, getURLsFromHTML, getImagesFromHTML, extractPageData, getHTML } from './crawl.js'

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

test('getURLsFromHTML absolute', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>'
  const expected = ["https://crawler-test.com/path/one"]
  expect(getURLsFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})

test('getURLsFromHTML external site', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><a href="https://www.boot.dev"><span>Boot.dev</span></a></body></html>'
  const expected = ["https://www.boot.dev"]
  expect(getURLsFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})

test('getURLsFromHTML: no urls found, returns empty array', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><span>Hi</span></body></html>'
  const expected = []
  expect(getURLsFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})

test('getURLsFromHTML: empty url found, returns empty array', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><a href="">Empty HREF</span></body></html>'
  const expected = []
  expect(getURLsFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})


test('getImagesFromHTML: relative urls found, returns absolute urls', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><img src="/logo.png"></img></body></html>'
  const expected = ["https://crawler-test.com/logo.png"]
  expect(getImagesFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})

test('getImagesFromHTML: no urls found, returns empty array', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><span>Hi</span></body></html>'
  const expected = []
  expect(getImagesFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})

test('getImagesFromHTML: empty url found, returns empty array', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = '<html><body><img src=""></img></body></html>'
  const expected = []
  expect(getImagesFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})

test('extractPageData basic', () => {
  const inputURL = "https://crawler-test.com"
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `
  const expected = {
    url: "https://crawler-test.com",
    heading: "Test Title",
    first_paragraph: "This is the first paragraph.",
    outgoing_links: ["https://crawler-test.com/link1"],
    image_urls: ["https://crawler-test.com/image1.jpg"],
  }

  expect(extractPageData(inputBody, inputURL)).toStrictEqual(expected)
})

test('getHTML: correct url, returns html body', async () => {
  const inputURL = "https://wikipedia.org"
  const expected = "body" 
  const result = await getHTML(inputURL)
  expect(result).toMatch(expected)
})

test('getHTML: correct url, wrong content-type', async () => {
  const inputURL = "https://jsonplaceholder.typicode.com/todos/1"
  const expected = false
  const result = await getHTML(inputURL)
  expect(result).toBe(false)
})

test('getHTML: response 404, return false', async () => {
  const inputURL = "https://example.com/bestURL"
  const expected = false 
  const result = await getHTML(inputURL)
  expect(result).toBe(expected)
})



