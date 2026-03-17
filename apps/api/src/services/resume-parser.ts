import pdfParse from 'pdf-parse'

export interface ParsedResume {
  text: string
  pages: number
}

export async function parseResume(buffer: Buffer): Promise<ParsedResume> {
  const data = await pdfParse(buffer)

  return {
    text: data.text.trim(),
    pages: data.numpages,
  }
}
