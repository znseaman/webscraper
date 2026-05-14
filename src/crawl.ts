import { JSDOM } from 'jsdom'

export function normalizeURL(url: string): string {
	let {hostname, pathname} = new URL(url)

	return `${hostname}${trimTrailingSlash(pathname)}`
}

export function getHeadingFromHTML(html: string): string {
	const dom = new JSDOM(html)
	const h1 = dom.window.document.querySelectorAll('h1')
	if (h1.length > 0) {
		return h1[0].textContent
	}
	
	const h2 = dom.window.document.querySelectorAll('h2')
	if (h2.length > 0) {
		return h2[0].textContent
	}

	return ''
}

export function getFirstParagraphFromHTML(html: string): string {
	const dom = new JSDOM(html)
	const main = dom.window.document.querySelectorAll('main')
	if (main.length > 0) {
		return main[0].textContent
	}

	const p = dom.window.document.querySelectorAll('p')
	if (p.length > 0) {
		return p[0].textContent
	}

	return ''
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
	const dom = new JSDOM(html)
	const aTags = Array.from(dom.window.document.querySelectorAll('a'))
	if (aTags.length > 0) {
		const strings = []
		for (const a of aTags) {
			if (!a.href) continue
			try {
				const url = new URL(a.href)
				strings.push(trimTrailingSlash(url.toString()))
			} catch {
				const url = new URL(a.href, baseURL)
				strings.push(trimTrailingSlash(url.toString()))
			}
		}
		return strings
	}
	
	return []
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
	const dom = new JSDOM(html)
	const imgTags = Array.from(dom.window.document.querySelectorAll('img'))
	if (imgTags.length > 0) {
		const strings = []
		for (const img of imgTags) {
			if (!img.src) continue
			try {
				const url = new URL(img.src)
				strings.push(trimTrailingSlash(url.toString()))
			} catch {
				const url = new URL(img.src, baseURL)
				strings.push(trimTrailingSlash(url.toString()))
			}
		}
		return strings
	}

	return []	
}

function trimTrailingSlash(url: string): string {
	let hasTrailingSlash = url[url.length - 1] == '/'
	if (hasTrailingSlash) {
		url = url.slice(0, -1)
	}
	return url
}

type ExtractedPageData = {
	url: string;
	heading: string;
	firstParagraph: string;
	outgoingLinks: string[];
	imageURLs: string[];
}

export function extractPageData(html: string, pageURL: string): ExtractedPageData {
	return {
		url: pageURL,
		heading: getHeadingFromHTML(html),
		first_paragraph: getFirstParagraphFromHTML(html),
		outgoing_links: getURLsFromHTML(html, pageURL),
		image_urls: getImagesFromHTML(html, pageURL)
	} 
}

export async function getHTML(url: string) {
	const reqHeaders = new Headers();
	reqHeaders.set("User-Agent", "BootCrawler/1.0")
	try {
		const response = await fetch(url, {
			headers: reqHeaders
		})

		if (response.status >= 400) {
			console.error(response.statusText)
			return false
		}
		
		const contentType = response.headers.get("Content-Type")
		if (!contentType?.includes("text/html")) {
			console.error(`Received ${response.headers.get("Content-Type")} when expecting "text/html"`)
			return false
		}
		
		const htmlString = await response.text();
		const dom = new JSDOM(htmlString)
		const body = dom.window.document.querySelector('body')
		return body.outerHTML
	} catch (error) {
		console.error(error)
		return false
	}
}

export async function crawlPage(baseURL: string, currentURL: string = baseURL, pages: Record<string, number> = {}) {
	const baseHostName = new URL(baseURL)?.hostname
	const currentHostName = new URL(currentURL)?.hostname

	if (baseHostName !== currentHostName) {
		return pages
	}

	const normalizedCurrentURL = normalizeURL(currentURL)
	if (normalizedCurrentURL in pages) {
		pages[normalizedCurrentURL]++
		return pages
	}

	pages[normalizedCurrentURL] = 1

	console.log(`crawling ${currentURL} . . .`)

	let html = ""
	try {
		html = await getHTML(currentURL)
	} catch (error) {
		console.error(`${(err as Error).message}`)
		return pages
	}

	const urls = getURLsFromHTML(html, baseURL)
	
	for (const url of urls) {
		await crawlPage(baseURL, url, pages)
	}
	
	return pages
}

