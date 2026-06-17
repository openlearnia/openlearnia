import { useMemo, useState } from 'react'
import './App.css'

type PasswordCheck = {
  label: string
  passed: boolean
}

type PasswordAnalysis = {
  score: number
  rating: string
  checks: PasswordCheck[]
  suggestions: string[]
}

const COMMON_TERMS = [
  'password',
  '1234',
  'qwerty',
  'admin',
  'welcome',
  'letmein',
  'iloveyou',
  'abc123',
  'passw0rd',
]

const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?'

function generateStrongPassword(length = 16): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const all = `${lower}${upper}${numbers}${SYMBOLS}`

  const pick = (source: string) =>
    source[crypto.getRandomValues(new Uint32Array(1))[0] % source.length]

  const chars = [pick(lower), pick(upper), pick(numbers), pick(SYMBOLS)]

  while (chars.length < length) {
    chars.push(pick(all))
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}

function analyzePassword(password: string): PasswordAnalysis {
  if (!password) {
    return {
      score: 0,
      rating: 'Very weak',
      checks: [
        { label: 'At least 12 characters', passed: false },
        { label: 'Contains lowercase letter', passed: false },
        { label: 'Contains uppercase letter', passed: false },
        { label: 'Contains number', passed: false },
        { label: 'Contains symbol', passed: false },
        { label: 'Avoids repeated character runs', passed: false },
        { label: 'Avoids common patterns/words', passed: false },
      ],
      suggestions: [
        'Use at least 12-16 characters.',
        'Mix uppercase, lowercase, numbers, and symbols.',
      ],
    }
  }

  const hasLength = password.length >= 12
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const hasRepeatedRun = /(.)\1{2,}/.test(password)
  const hasRepeatedChunk = /(..+)\1/.test(password)
  const lower = password.toLowerCase()
  const hasCommonTerm = COMMON_TERMS.some((term) => lower.includes(term))
  const hasCommonSequence =
    /0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf|zxcv/i.test(password)

  const avoidsRepeats = !hasRepeatedRun && !hasRepeatedChunk
  const avoidsCommon = !hasCommonTerm && !hasCommonSequence

  let score = 0
  if (hasLength) score += 25
  if (hasLower) score += 10
  if (hasUpper) score += 10
  if (hasNumber) score += 10
  if (hasSymbol) score += 15
  if (avoidsRepeats) score += 15
  if (avoidsCommon) score += 15
  if (password.length >= 16) score += 10

  score = Math.min(score, 100)

  const checks: PasswordCheck[] = [
    { label: 'At least 12 characters', passed: hasLength },
    { label: 'Contains lowercase letter', passed: hasLower },
    { label: 'Contains uppercase letter', passed: hasUpper },
    { label: 'Contains number', passed: hasNumber },
    { label: 'Contains symbol', passed: hasSymbol },
    { label: 'Avoids repeated character runs', passed: avoidsRepeats },
    { label: 'Avoids common patterns/words', passed: avoidsCommon },
  ]

  const suggestions: string[] = []
  if (!hasLength) suggestions.push('Increase length to at least 12 characters.')
  if (!hasLower) suggestions.push('Add lowercase letters.')
  if (!hasUpper) suggestions.push('Add uppercase letters.')
  if (!hasNumber) suggestions.push('Include one or more numbers.')
  if (!hasSymbol) suggestions.push('Add symbols like !, #, or @.')
  if (!avoidsRepeats) suggestions.push('Avoid repeated blocks like aaa or xyzxyz.')
  if (!avoidsCommon)
    suggestions.push('Avoid common words, keyboard patterns, and sequences.')
  if (hasLength && password.length < 16)
    suggestions.push('Consider 16+ characters for stronger protection.')
  if (suggestions.length === 0)
    suggestions.push('Great password. Store it in a password manager.')

  let rating = 'Very weak'
  if (score >= 85) rating = 'Excellent'
  else if (score >= 70) rating = 'Strong'
  else if (score >= 50) rating = 'Moderate'
  else if (score >= 30) rating = 'Weak'

  return { score, rating, checks, suggestions }
}

function App() {
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  const analysis = useMemo(() => analyzePassword(password), [password])

  return (
    <main className="container">
      <section className="card">
        <h1>Password Strength Lab</h1>
        <p className="intro">
          Test passwords locally in your browser. Nothing is sent to a server.
        </p>

        <label className="input-label" htmlFor="password">
          Password
        </label>
        <div className="input-row">
          <input
            id="password"
            className="password-input"
            type={isVisible ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Type or generate a password"
            autoComplete="off"
          />
          <button
            type="button"
            className="button secondary"
            onClick={() => setIsVisible((state) => !state)}
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="actions">
          <button
            type="button"
            className="button"
            onClick={() => setPassword(generateStrongPassword(16))}
          >
            Generate strong password
          </button>
        </div>

        <div className="strength-header">
          <h2>Strength Score</h2>
          <p>
            <strong>{analysis.score}/100</strong> - {analysis.rating}
          </p>
        </div>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${analysis.score}%` }} />
        </div>

        <h2>Checklist</h2>
        <ul className="checklist">
          {analysis.checks.map((check) => (
            <li key={check.label} className={check.passed ? 'pass' : 'fail'}>
              <span className="marker">{check.passed ? '✓' : '•'}</span>
              {check.label}
            </li>
          ))}
        </ul>

        <h2>Suggestions</h2>
        <ul className="suggestions">
          {analysis.suggestions.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
