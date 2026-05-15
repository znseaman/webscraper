import { argv } from 'node:process';
import { crawlSiteAsync } from './crawl.js'
import { writeJSONReport } from './report.js'

async function main() {
	if (argv.length !== 5) {
		console.error(`usage: npm start <BASE_URL> <maxConcurrency> <maxPages>`)
		process.exit(1)
	}

	const baseURL = argv[2]
	console.log(`Starting crawler from ${baseURL}...`)

	const maxConcurrency = Number(argv[3])
	const maxPages = Number(argv[4])

	if (!Number.isFinite(maxConcurrency) || maxConcurrency <= 0) {
		console.error(`invalid <maxConcurrency>: passed ${argv[3]}`)
		console.error(`usage: npm start <BASE_URL> <maxConcurrency> <maxPages>`)
		process.exit(1)
	}

	if (!Number.isFinite(maxPages) || maxPages <= 0) {
		console.error(`invalid <maxPages>: passed ${argv[4]}`)
		console.error(`usage: npm start <BASE_URL> <maxConcurrency> <maxPages>`)
		process.exit(1)
	}

	console.log(`starting crawl of: ${baseURL} (concurrency=${maxConcurrency}, maxPages=${maxPages})`)

	const pages = await crawlSiteAsync(baseURL, maxConcurrency, maxPages)

	console.log(`Finished crawling.`)
	
	writeJSONReport(pages, "report.json")

	process.exit(0)
}

main();
