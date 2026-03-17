import pdfParse from 'pdf-parse'

export interface ParsedResume {
  text: string
  pages: number
}

export async function parseResume(buffer: Buffer): Promise<ParsedResume> {
  try {
    const data = await pdfParse(buffer)

    const text = data.text.trim()

    if (!text || text.length < 10) {
      throw new Error('Could not extract text from PDF. The file may be image-based or corrupted.')
    }

    return {
      text,
      pages: data.numpages,
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Could not extract')) {
      throw err
    }
    throw new Error('Failed to parse PDF. Please upload a valid PDF resume.')
  }
}
