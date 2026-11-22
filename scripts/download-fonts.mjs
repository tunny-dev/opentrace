import fs from 'fs'
import path from 'path'

async function downloadFonts() {
  const fontDir = path.resolve('public/fonts')
  if (!fs.existsSync(fontDir)) {
    fs.mkdirSync(fontDir, { recursive: true })
  }

  const cssUrl = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=JetBrains+Mono:wght@400..800&display=swap'
  const res = await fetch(cssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  })

  const css = await res.text()
  const blocks = css.split('@font-face')

  for (const block of blocks) {
    if (block.includes('/* latin */')) {
      const isManrope = block.includes("font-family: 'Manrope'")
      const isJetBrains = block.includes("font-family: 'JetBrains Mono'")
      const match = block.match(/url\((https:\/\/[^)]+\.woff2)\)/)

      if (match && (isManrope || isJetBrains)) {
        const url = match[1]
        const targetFilename = isManrope ? 'manrope-latin.woff2' : 'jetbrains-mono-latin.woff2'
        const targetPath = path.join(fontDir, targetFilename)

        console.log(`Downloading ${targetFilename} from ${url}...`)
        const fontRes = await fetch(url)
        const buffer = await fontRes.arrayBuffer()
        fs.writeFileSync(targetPath, Buffer.from(buffer))
        console.log(`Saved ${targetPath} (${buffer.byteLength} bytes)`)
      }
    }
  }
}

downloadFonts().catch(console.error)
