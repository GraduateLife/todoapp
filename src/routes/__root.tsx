import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeroUIProvider } from '@heroui/react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { STORAGE_STRATEGY, AI_PROVIDER, AI_MODEL } from '../lib/env'

import { lazy, Suspense, useEffect } from 'react'
import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { getLocale } from '#/paraglide/runtime'
import { useTodoStore, useFolderStore } from '../features/todo/store'
import { initStrategy as initAdapter } from '../lib/storage'
import { initAIProvider } from '../lib/ai'
import { initShareStrategy } from '../lib/share'

import appCss from '../styles/globals.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const DevTools = lazy(() => import('../components/DevTools'))

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },

  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function useAppBootstrap() {
  const initializeTodos = useTodoStore((s) => s.initialize)
  const initializeFolders = useFolderStore((s) => s.initialize)
  useEffect(() => {
    initAdapter()
      .then(({ todos: loadedTodos, folders }) => {
        initializeTodos(loadedTodos)
        initializeFolders(folders)
      })
      .catch(console.error)
    initAIProvider().catch(console.error)
    initShareStrategy().catch(console.error)
  }, [initializeTodos, initializeFolders])
}

function RootDocument({ children }: { children: React.ReactNode }) {
  useAppBootstrap()
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <TanStackQueryProvider>
          <HeroUIProvider>
            <Header />
            {import.meta.env.DEV && (
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  padding: '2px 8px',
                  opacity: 0.45,
                  color: 'var(--rf-text)',
                  userSelect: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 51,
                  pointerEvents: 'none',
                }}
              >
                <span>
                  data storage mode: {STORAGE_STRATEGY}
                  {' · '}
                  ai model: {AI_PROVIDER}/{AI_MODEL || 'default'}
                </span>
                <Suspense><DevTools /></Suspense>
              </div>
            )}
            {children}
            <Footer />
            {/* <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          /> */}
          </HeroUIProvider>
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}
