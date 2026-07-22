import type { ReactNode } from 'react'

type AppChromeProps = {
  productName: string
  githubUrl: string
  children: ReactNode
  relatedTools?: { name: string; href: string }[]
}

const PRIVACY = 'Runs locally — nothing leaves your device'

export function AppChrome({ productName, githubUrl, children, relatedTools = [] }: AppChromeProps) {
  return (
    <div className="app-chrome">
      <header className="app-header">
        <div className="app-header__brand">
          <strong>{productName}</strong>
          <a href="https://openlearnia.com">Openlearnia</a>
          <a href={githubUrl} rel="noreferrer" target="_blank">GitHub</a>
        </div>
        <p className="privacy-chip" role="status">{PRIVACY}</p>
      </header>
      <main>{children}</main>
      {relatedTools.length > 0 && (
        <nav className="related-tools" aria-label="Related tools">
          {relatedTools.map((t) => (
            <a key={t.href} href={t.href}>{t.name}</a>
          ))}
        </nav>
      )}
      <footer className="app-footer">
        <span>© Openlearnia</span>
        <a href="https://openlearnia.com">openlearnia.com</a>
        <a href={githubUrl} rel="noreferrer" target="_blank">GitHub</a>
        <span>{PRIVACY}</span>
      </footer>
    </div>
  )
}
