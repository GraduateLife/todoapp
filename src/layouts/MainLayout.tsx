import type { ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <main className="page-wrap px-4 pb-8 pt-14">{children}</main>
}
