import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'

type FeedbackKind = 'success' | 'error'

type Feedback = {
  kind: FeedbackKind
  message: string
}

function getLineAndColumn(text: string, index: number) {
  const safeIndex = Math.max(0, Math.min(index, text.length))
  const segment = text.slice(0, safeIndex)
  const lines = segment.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  return { line, column }
}

function getParseErrorDetails(source: string, error: unknown): string {
  const fallbackMessage = error instanceof Error ? error.message : 'Invalid JSON.'
  const match = fallbackMessage.match(/position\s+(\d+)/i)

  if (!match) {
    return fallbackMessage
  }

  const position = Number.parseInt(match[1], 10)
  if (Number.isNaN(position)) {
    return fallbackMessage
  }

  const { line, column } = getLineAndColumn(source, position)
  return `${fallbackMessage} (line ${line}, column ${column})`
}

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const outputLength = useMemo(() => outputText.length, [outputText])

  const setErrorFeedback = (source: string, error: unknown) => {
    setFeedback({
      kind: 'error',
      message: getParseErrorDetails(source, error),
    })
  }

  const parseJson = (source: string) => JSON.parse(source)

  const handleFormat = () => {
    try {
      const parsed = parseJson(inputText)
      const formatted = JSON.stringify(parsed, null, 2)
      setOutputText(formatted)
      setFeedback({ kind: 'success', message: 'JSON formatted successfully.' })
    } catch (error) {
      setErrorFeedback(inputText, error)
    }
  }

  const handleMinify = () => {
    try {
      const parsed = parseJson(inputText)
      const minified = JSON.stringify(parsed)
      setOutputText(minified)
      setFeedback({ kind: 'success', message: 'JSON minified successfully.' })
    } catch (error) {
      setErrorFeedback(inputText, error)
    }
  }

  const handleValidate = () => {
    try {
      parseJson(inputText)
      setFeedback({ kind: 'success', message: 'Valid JSON.' })
    } catch (error) {
      setErrorFeedback(inputText, error)
    }
  }

  const handleCopyOutput = async () => {
    if (!outputText) {
      setFeedback({ kind: 'error', message: 'No output available to copy.' })
      return
    }

    try {
      await navigator.clipboard.writeText(outputText)
      setFeedback({ kind: 'success', message: 'Output copied to clipboard.' })
    } catch {
      setFeedback({ kind: 'error', message: 'Copy failed. Please copy manually.' })
    }
  }

  const handleFileLoad = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? []
    if (!file) {
      return
    }

    try {
      const fileContent = await file.text()
      setInputText(fileContent)
      setFeedback({
        kind: 'success',
        message: `Loaded ${file.name}.`,
      })
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Unable to read file.',
      })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>JSON Toolkit</h1>
        <p>Format, validate, and minify JSON entirely in your browser.</p>
      </header>

      <section className="panel">
        <label htmlFor="json-input" className="section-title">
          Input JSON
        </label>
        <textarea
          id="json-input"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder='Paste JSON here, e.g. {"name":"Openlearnia"}'
          spellCheck={false}
        />

        <div className="controls">
          <input type="file" accept=".json,application/json,text/plain" onChange={handleFileLoad} />
          <button type="button" onClick={handleFormat}>
            Pretty format
          </button>
          <button type="button" onClick={handleMinify}>
            Minify
          </button>
          <button type="button" onClick={handleValidate}>
            Validate
          </button>
          <button type="button" onClick={handleCopyOutput}>
            Copy output
          </button>
        </div>

        {feedback && (
          <p className={`feedback ${feedback.kind}`} role="status">
            {feedback.message}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="output-header">
          <h2>Output</h2>
          <span>{outputLength} chars</span>
        </div>
        <textarea value={outputText} readOnly spellCheck={false} placeholder="Output will appear here." />
      </section>
    </main>
  )
}

export default App
