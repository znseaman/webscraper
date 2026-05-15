import { argv } from 'node:process';
import { crawlSiteAsync } from './crawl.js'

async function main() {
	if (argv.length !== 3) {
		console.error(`usage: npm start <BASE_URL>`)
		process.exit(1)
	}

	const baseURL = argv[2]
	console.log(`Starting crawler from ${baseURL}...`)

	const result = await crawlSiteAsync(baseURL, 5)
	
	console.log(`\nCrawled Pages by Count:`)
	console.log(JSON.stringify(result, null, 2))

	process.exit(0)
}

main();
