export const OPENLEARNIA_TOOLS = [
  { name: 'Image Tools', href: 'https://image-tools.openlearnia.com' },
  { name: 'Image Metadata Viewer', href: 'https://image-metadata-viewer.openlearnia.com' },
  { name: 'JSON Toolkit', href: 'https://json-toolkit.openlearnia.com' },
  { name: 'Password Strength Lab', href: 'https://password-strength-lab.openlearnia.com' },
  { name: 'Markdown Editor', href: 'https://markdown-editor.openlearnia.com' },
  { name: 'Database Lab', href: 'https://schema-builder.openlearnia.com' },
] as const

export function relatedExcept(currentHref: string) {
  return OPENLEARNIA_TOOLS.filter((t) => t.href !== currentHref)
}
