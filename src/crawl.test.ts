import { expect, test } from 'vitest'
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML, getURLsFromHTML, getImagesFromHTML, extractPageData, getHTML } from './crawl.js'

test.for([
  {url: 'https://www.boot.dev/blog/path/', expected: 'www.boot.dev/blog/path'},
  {url: 'https://www.boot.dev/blog/path', expected: 'www.boot.dev/blog/path'},
  {url: 'https://www.boot.dev/blog/path/', expected: 'www.boot.dev/blog/path'},
  {url: 'http://www.boot.dev/blog/path', expected: 'www.boot.dev/blog/path'},
])('normalize url: $url', ({ url, expected }) => {
  expect(normalizeURL(url)).toBe(expected)
})

test.for([
  {inputBody: '<html><body><h1>Test Title</h1></body></html>', expected: 'Test Title', test_case_description: 'has h1, return text content'},
  {inputBody: '<html><body><h2>Test Title 2</h2></body></html>', expected: 'Test Title 2', test_case_description: 'has h2, return text content'},
  {inputBody: '<html><body><p>No return</p></body></html>', expected: '', test_case_description: 'no h1 or h2 found, return empty string'},
])('get heading from html: $test_case_description', ({ inputBody, expected }) => {
  expect(getHeadingFromHTML(inputBody)).toBe(expected)
})

test.for([
  {inputBody: '<html><body><p>Test Paragraph</p></body></html>', expected: 'Test Paragraph', test_case_description: 'p found, return text content'},
  {inputBody: '<html><body><a>Yeah!</p></body></html>', expected: '', test_case_description: 'no p found, return empty string'},
  {inputBody: '<html><body><main>Main Section</main></body></html>', expected: 'Main Section', test_case_description: 'main found, return text content'},
])('get first paragraph from html: $test_case_description', ({ inputBody, expected }) => {
  expect(getFirstParagraphFromHTML(inputBody)).toBe(expected)
})

test.for([
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>', expected: ['https://crawler-test.com/path/one'], test_case_description: 'absolute'},
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><a href="https://www.boot.dev"><span>Boot.dev</span></a></body></html>', expected: ['https://www.boot.dev'], test_case_description: 'external site'},
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><span>Hi</span></body></html>', expected: [], test_case_description: 'no urls found, returns empty array'},
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><a href="">Empty HREF</span></body></html>', expected: [], test_case_description: 'empty url found, returns empty array'},
])('getURLsFromHTML: $test_case_description', ({ inputURL, inputBody, expected }) => {
  expect(getURLsFromHTML(inputBody, inputURL)).toStrictEqual(expected)
})


test.for([
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><img src="/logo.png"></img></body></html>', expected: ['https://crawler-test.com/logo.png'], test_case_description: 'relative urls found, returns absolute urls'},
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><span>Hi</span></body></html>', expected: [], test_case_description: 'no urls found, returns empty array'},
  {inputURL: 'https://crawler-test.com', inputBody: '<html><body><img src=""></img></body></html>', expected: [], test_case_description: 'empty url found, returns empty array'},
])('getImagesFromHTML: $test_case_description', ({ inputURL, inputBody, expected }) => {
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
    firstParagraph: "This is the first paragraph.",
    outgoingLinks: ["https://crawler-test.com/link1"],
    imageURLs: ["https://crawler-test.com/image1.jpg"],
  }

  expect(extractPageData(inputBody, inputURL)).toStrictEqual(expected)
})

test.for([
  {inputURL: 'https://wikipedia.org', expected: 'body', shouldReject: false, test_case_description: 'correct url, returns html body'},
  {inputURL: 'https://jsonplaceholder.typicode.com/todos/1', expected: /Got non-HTML response:/, shouldReject: true, test_case_description: 'correct url, wrong content-type'},
  {inputURL: 'https://example.com/bestURL', expected: /Got HTTP error/, shouldReject: true, test_case_description: 'response 404, return false'},
])('getHTML: $test_case_description', async ({ inputURL, expected, shouldReject }) => {
  if (shouldReject) {
    await expect(getHTML(inputURL)).rejects.toThrow(expected)
  } else {
    const result = await getHTML(inputURL)
    expect(result).toMatch(expected)
  }
})
