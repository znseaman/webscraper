import { JSDOM } from 'jsdom'

export function normalizeURL(url: string): string {
	let {hostname, pathname} = new URL(url)

	let hasTrailingSlash = pathname[pathname.length - 1] == '/'
	if (hasTrailingSlash) { 
		pathname = pathname.slice(0, -1)
	}

	return `${hostname}${pathname}`
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

