import * as pdfjsLib from 'pdfjs-dist'
import { extractRawText } from 'mammoth'
import JSZip from 'jszip'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export async function fetchFileAsText(url, fileName) {
  if (!url) return ''
  const ext = fileName?.split('.').pop()?.toLowerCase() || ''
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Unable to load file (HTTP ${res.status})`)
  const blob = await res.blob()

  if (ext === 'pdf') return parsePdf(blob)
  if (ext === 'docx') return parseDocx(blob)
  if (['pptx', 'ppt'].includes(ext)) return parsePptx(blob)
  return blob.text()
}

export function getFileExtension(fileName) {
  return fileName?.split('.').pop()?.toLowerCase() || ''
}

export function isParseable(fileName) {
  return ['pdf', 'docx', 'pptx', 'ppt', 'txt', 'md', 'csv', 'json', 'html', 'css', 'js', 'jsx', 'ts', 'tsx'].includes(getFileExtension(fileName))
}

async function parsePdf(blob) {
  const buffer = await blob.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text)
  }
  return pages.join('\n\n')
}

async function parseDocx(blob) {
  const buffer = await blob.arrayBuffer()
  const result = await extractRawText({ buffer })
  return result.value || ''
}

async function parsePptx(blob) {
  const buffer = await blob.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const texts = []
  const slideFiles = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort()
  for (const name of slideFiles) {
    const xmlStr = await zip.files[name].async('text')
    const parser = new DOMParser()
    const xml = parser.parseFromString(xmlStr, 'text/xml')
    const tEls = xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't')
    for (const el of tEls) {
      const t = el.textContent?.trim()
      if (t) texts.push(t)
    }
  }
  return texts.join('\n')
}
