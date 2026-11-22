import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const source = await readFile(new URL("../app/icon.svg", import.meta.url))
const render = (size) => sharp(source, { density: 384 }).resize(size, size, { fit: "contain" })
const output = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

await render(32).png().toFile(output("icon-light-32x32.png"))
await render(32).png().toFile(output("icon-dark-32x32.png"))
await render(180).png().toFile(output("apple-icon.png"))

console.log("Generated favicons from app/icon.svg")
