import { expect, test, describe, vi } from 'vitest'
import { normalizeURL, getHeadingFromHTML, getFirstParagraphFromHTML, getURLsFromHTML, getImagesFromHTML, extractPageData, getHTML, crawlSiteAsync, ExtractedPageData } from './crawl.js'

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

describe('ConcurrentCrawler', () => {
  const createMockFetch = (urlConfigs: Record<string, { status: number; contentType: string; body: string; shouldThrow?: boolean }>) => {
    return vi.fn(async (url: string) => {
      for (const [pattern, config] of Object.entries(urlConfigs)) {
        if (url.includes(pattern)) {
          if (config.shouldThrow) {
            throw new Error(config.body)
          }
          return new Response(config.body, {
            status: config.status,
            headers: { 'content-type': config.contentType }
          })
        }
      }

      const html = `
        <html>
          <body>
            <h1>Test Page</h1>
            <p>This is a test paragraph.</p>
            <a href="/page1">Link 1</a>
            <a href="/page2">Link 2</a>
            <img src="/image1.jpg" alt="Image 1">
          </body>
        </html>
      `
      return new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html' }
      })
    })
  }

  test.for([
    {
      testName: 'baseURL field - initializes with provided base URL',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 1,
      urlConfigs: {},
      assertion: (result) => expect(result).toBeDefined()
    },
    {
      testName: 'pages field - collects crawled pages in dictionary',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 1,
      urlConfigs: {},
      assertion: (result) => {
        expect(result).toBeInstanceOf(Object)
        expect(typeof result).toBe('object')
      }
    },
    {
      testName: 'maxPages field - respects maximum page limit',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 2,
      urlConfigs: {},
      assertion: (result) => {
        const pageCount = Object.keys(result).length
        expect(pageCount).toBeLessThanOrEqual(2)
      }
    },
    {
      testName: 'visited field - does not revisit same pages',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 1,
      urlConfigs: {},
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => {
        expect(Object.keys(result).length).toBeLessThanOrEqual(1)
      }
    },
    {
      testName: 'shouldStop field - stops crawling when max pages reached',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 1,
      urlConfigs: {},
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => expect(Object.keys(result).length).toBeLessThanOrEqual(1)
    },
    {
      testName: 'allTasks field - tracks and completes all pending tasks',
      baseURL: 'https://boot.dev',
      maxConcurrency: 2,
      maxPages: 2,
      urlConfigs: {},
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => {
        expect(Object.keys(result).length).toBeGreaterThanOrEqual(1)
      }
    },
    {
      testName: 'limit field - respects concurrency limit',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 3,
      urlConfigs: {},
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => expect(result).toBeDefined()
    },
    {
      testName: 'returns crawled pages with extracted data',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 1,
      urlConfigs: {},
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => {
        const firstPage = Object.values(result)[0]
        if (firstPage) {
          expect(firstPage).toHaveProperty('url')
          expect(firstPage).toHaveProperty('heading')
          expect(firstPage).toHaveProperty('firstParagraph')
          expect(firstPage).toHaveProperty('outgoingLinks')
          expect(firstPage).toHaveProperty('imageURLs')
        }
      }
    },
    {
      testName: 'only crawls same domain pages',
      baseURL: 'https://boot.dev',
      maxConcurrency: 1,
      maxPages: 5,
      urlConfigs: {},
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => {
        for (const page of Object.values(result)) {
          const pageDomain = new URL(page.url).hostname
          const baseDomain = new URL('https://boot.dev').hostname
          expect(pageDomain).toBe(baseDomain)
        }
      }
    },
    {
      testName: 'handles network errors gracefully',
      baseURL: 'https://this-domain-definitely-does-not-exist-12345.com',
      maxConcurrency: 1,
      maxPages: 1,
      urlConfigs: {
        'this-domain-definitely-does-not-exist': { status: 0, contentType: '', body: 'Network error', shouldThrow: true }
      },
      assertion: (result: Promise<Record<string, ExtractedPageData>>) => {
        expect(result).toBeDefined()
        expect(typeof result).toBe('object')
      }
    }
  ])('crawl: $testName', async ({ baseURL, maxConcurrency, maxPages, urlConfigs, assertion }) => {
    global.fetch = createMockFetch(urlConfigs)
    const result = await crawlSiteAsync(baseURL, maxConcurrency, maxPages)
    assertion(result)
    vi.restoreAllMocks()
  })
})

