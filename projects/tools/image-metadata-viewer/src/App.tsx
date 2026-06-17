import { useMemo, useState } from 'react'
import exifr from 'exifr'
import './App.css'

type BasicMetadata = {
  filename: string
  sizeBytes: number
  mimeType: string
  width: number
  height: number
}

type MetadataBundle = {
  basic: BasicMetadata
  exif: Record<string, unknown> | null
}

type FlatEntry = {
  key: string
  value: string
}

function toReadableSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function flattenMetadata(input: unknown, prefix = ''): FlatEntry[] {
  if (input === null || input === undefined) {
    return [{ key: prefix || 'value', value: String(input) }]
  }

  if (input instanceof Date) {
    return [{ key: prefix || 'value', value: input.toISOString() }]
  }

  if (Array.isArray(input)) {
    return input.flatMap((value, index) =>
      flattenMetadata(value, `${prefix}[${index}]`),
    )
  }

  if (typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>).flatMap(
      ([key, value]) => {
        const nextKey = prefix ? `${prefix}.${key}` : key
        return flattenMetadata(value, nextKey)
      },
    )
  }

  return [{ key: prefix || 'value', value: String(input) }]
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image dimensions'))
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  })
}

function App() {
  const [metadata, setMetadata] = useState<MetadataBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const flattenedExif = useMemo(
    () => flattenMetadata(metadata?.exif ?? {}).sort((a, b) => a.key.localeCompare(b.key)),
    [metadata],
  )

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      setMetadata(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const dimensions = await getImageDimensions(file)
      const exifData = (await exifr.parse(file, true)) as Record<string, unknown> | null

      setMetadata({
        basic: {
          filename: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
          width: dimensions.width,
          height: dimensions.height,
        },
        exif: exifData,
      })
    } catch (processingError) {
      const message =
        processingError instanceof Error
          ? processingError.message
          : 'Unable to parse metadata from this image.'
      setError(message)
      setMetadata(null)
    } finally {
      setIsLoading(false)
    }
  }

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }
    void processImageFile(selectedFile)
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files?.[0]
    if (!droppedFile) {
      return
    }
    void processImageFile(droppedFile)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const downloadJson = () => {
    if (!metadata) {
      return
    }
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const safeName = metadata.basic.filename.replace(/\.[^.]+$/, '')
    link.download = `${safeName || 'image-metadata'}.metadata.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app">
      <header>
        <h1>Image Metadata Viewer</h1>
        <p>Inspect image metadata locally in your browser.</p>
      </header>

      <section className="upload-area" onDrop={onDrop} onDragOver={onDragOver}>
        <p>Drag and drop an image here, or select a file.</p>
        <label className="file-picker">
          <input type="file" accept="image/*" onChange={onFileInputChange} />
          Choose Image
        </label>
        {isLoading && <p className="status">Reading metadata...</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {metadata && (
        <section className="results">
          <div className="result-header">
            <h2>Basic Info</h2>
            <button type="button" onClick={downloadJson}>
              Export JSON
            </button>
          </div>
          <dl className="basic-grid">
            <div>
              <dt>Filename</dt>
              <dd>{metadata.basic.filename}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>
                {toReadableSize(metadata.basic.sizeBytes)} ({metadata.basic.sizeBytes} bytes)
              </dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>
                {metadata.basic.width} × {metadata.basic.height}
              </dd>
            </div>
            <div>
              <dt>MIME Type</dt>
              <dd>{metadata.basic.mimeType}</dd>
            </div>
          </dl>

          <h2>EXIF / Embedded Metadata</h2>
          {flattenedExif.length > 0 ? (
            <ul className="metadata-list">
              {flattenedExif.map((entry) => (
                <li key={entry.key}>
                  <span>{entry.key}</span>
                  <code>{entry.value}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p>No EXIF-like metadata was detected in this image.</p>
          )}
        </section>
      )}
    </main>
  )
}

export default App
