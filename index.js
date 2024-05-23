import fetch from "node-fetch"
import { parseStringPromise } from "xml2js"
import { JSDOM } from "jsdom"

function logInColor(text, colorCode) {
    console.log(`\x1b[${colorCode}m${text}\x1b[0m`)
}

async function analyzeHTML(url, classNames, totalCounts) {
    const html = await downloadHTML(url)

    const dom = new JSDOM(html)
    classNames.forEach((className, index) => {
        const instanceCount = dom.window.document.querySelectorAll(`.${className}`).length
        if (instanceCount > 0) {
            logInColor(`Found ${instanceCount} instances of .${className} in ${url}`, 31 + (index % 7)) // 31 to 37 are color codes for red to white
        }
        totalCounts[className] += instanceCount
    })
    console.log(`Analyzed HTML for ${url}`)
}

async function downloadHTML(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}. Status: ${response.status}`)
    }
    return await response.text()
}

async function downloadSitemapAndParse(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}. Status: ${response.status}`)
    }

    const xmlContent = await response.text()
    const parsedResult = await parseStringPromise(xmlContent)

    if (!parsedResult || !parsedResult.urlset || !parsedResult.urlset.url) {
        console.log(parsedResult)
        throw new Error(`Invalid sitemap format for ${url}`)
    }

    return parsedResult.urlset.url.map((entry) => entry.loc[0])
}

async function main(sitemapURLs, classNames) {
    const urls = []
    const totalCounts = {}

    classNames.forEach((className) => {
        totalCounts[className] = 0
    })

    for (const sitemapURL of sitemapURLs) {
        console.log("Downloading sitemap")
        urls.push(...(await downloadSitemapAndParse(sitemapURL)))
    }

    for (const url of urls) {
        try {
            await analyzeHTML(url, classNames, totalCounts)
        } catch (error) {
            console.error(`Error processing ${url}: ${error.message}`)
        }
    }

    Object.keys(totalCounts).forEach((className) => {
        console.log(`Total instances of .${className}: ${totalCounts[className]}`)
    })
}

main(
    [
        "https://ubuntu.com/static/files/sitemap.xml",
        "https://ubuntu.com/tutorials/sitemap.xml",
        "https://ubuntu.com/engage/sitemap.xml",
        "https://ubuntu.com/server/docs/sitemap.xml",
        "https://ubuntu.com/ceph/docs/sitemap.xml",
        "https://ubuntu.com/security/livepatch/docs/sitemap.xml",
        "https://ubuntu.com/robotics/docs/sitemap.xml",
    ],
    ["p-button", "p-button--positive", "p-button--negative", "p-button--brand", "p-button--link", "p-button--base"]
)
