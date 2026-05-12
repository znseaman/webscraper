export function normalizeURL(url: string): string {
	let {hostname, pathname} = new URL(url)

	let hasTrailingSlash = pathname[pathname.length - 1] == '/'
	if (hasTrailingSlash) { 
		pathname = pathname.slice(0, -1)
	}

	return `${hostname}${pathname}`
}
