import { argv } from 'node:process';

function main() {
	if (argv.length !== 3) {
		console.error(`usage: npm start <BASE_URL>`)
		process.exit(1)
	}

	const baseURL = argv[2]
	console.log(`Starting crawler from ${baseURL}...`)
}

main();
