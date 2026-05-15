import { cwd } from "node:process"
import path from "node:path"
import fs from "node:fs"
import { ExtractedPageData } from "./crawl"

export function writeJSONReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.json",
): void {
    const sorted = Object.values(pageData).sort((a, b) => a.url.localeCompare(b.url))

    const file = path.resolve(cwd(), filename)
    const data = JSON.stringify(sorted, null, 2)
    fs.writeFileSync(file, data)
}