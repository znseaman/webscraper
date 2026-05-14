import { argv } from 'node:process';
import { getHTML } from './crawl.js'

async function main() {
	if (argv.length !== 3) {
		console.error(`usage: npm start <BASE_URL>`)
		process.exit(1)
	}

	const baseURL = argv[2]
	console.log(`Starting crawler from ${baseURL}...`)

	const result = await getHTML(baseURL)
	return result
}

main();
