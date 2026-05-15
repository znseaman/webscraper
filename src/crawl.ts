import { JSDOM } from 'jsdom'
import pLimit from 'p-limit'

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

class ConcurrentCrawler {
	private baseURL: string;
	private pages: Record<string, number>;
	private limit: <T>(fn: () => Promise<T>) => Promise<T>;

	constructor(baseURL: string, maxConcurrency: number = 5) {
		this.baseURL = baseURL
		this.pages = {};
		this.limit = pLimit(maxConcurrency)
	}

	private addPageVisit(normalizedURL: string): boolean {
		if (this.pages[normalizedURL]) {
			this.pages[normalizedURL]++;
			return false
		} else {
			this.pages[normalizedURL] = 1;
			return true
		}
	}

	private async getHTML(currentURL: string): Promise<string> {
		return await this.limit(async () => {
			const headers = new Headers({"User-Agent": "BootCrawler/1.0"});

			let res
			try {
				res = await fetch(currentURL, {
					headers 
				});
			} catch (err) {
				throw new Error(`Got Network error: ${(err as Error).message}`)
			}

			if (res.status > 399) {
				throw new Error(`Got HTTP error: ${res.status} ${res.statusText}`)
			}

			const contentType = res.headers.get("content-type");
			if (!contentType || !contentType.includes("text/html")) {
				throw new Error(`Got non-HTML response: ${contentType}`)
			}

			return res.text();
		})
	}

	private async crawlPage(currentURL: string): Promise<void> {
		const currentHostname = new URL(currentURL).hostname;
		const baseHostname = new URL(this.baseURL).hostname;
		if (currentHostname !== baseHostname) {
			return false
		}

		const normalizedURL = normalizeURL(currentURL);

		if (!this.addPageVisit(normalizedURL)) {
			return false
		}

		console.log(`crawling ${currentURL} . . .`)
		let html = ""
		try {
			html = await this.getHTML(currentURL)
		} catch (err) {
			console.log(`${(err as Error).message}`)
			return false
		}

		const nextURLs = getURLsFromHTML(html, this.baseURL)

		const crawlPromises = nextURLs.map((nextURL) => this.crawlPage(nextURL))

		await Promise.all(crawlPromises)
	}

	public async crawl(): Promise<Record<string, number>> {
		await this.crawlPage(this.baseURL)
		return this.pages
	}
}

export async function crawlSiteAsync(baseURL: string, maxConcurrency: number = 5) {
	const crawler = new ConcurrentCrawler(baseURL, maxConcurrency)
	return await crawler.crawl()
}

