type EnvBag = Record<string, string | undefined>

type ShareProxyConfig = {
  upstreamBaseUrl: string
}

function readEnv(name: string): string | undefined {
  const importMetaEnv = (import.meta as ImportMeta & { env: EnvBag }).env
  if (importMetaEnv[name]) return importMetaEnv[name]

  if ('process' in globalThis) {
    const runtimeEnv = (
      globalThis as typeof globalThis & {
        process: { env: EnvBag }
      }
    ).process.env

    return runtimeEnv[name]
  }

  return undefined
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getShareProxyConfig(): ShareProxyConfig {
  const raw = readEnv('SHARE_TARGET_URL')

  if (!raw) {
    throw new Error(
      '[share:bff] Missing upstream target. Set SHARE_TARGET_URL for the share BFF.',
    )
  }

  return {
    upstreamBaseUrl: trimTrailingSlash(raw),
  }
}

export async function probeShareUpstream() {
  const { upstreamBaseUrl } = getShareProxyConfig()
  const checkedAt = Date.now()

  try {
    const res = await fetch(`${upstreamBaseUrl}/todos`, {
      method: 'GET',
    })

    return {
      ok: res.ok,
      status: res.status,
      checkedAt,
      error: res.ok ? null : `HTTP ${res.status}`,
      target: upstreamBaseUrl,
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      checkedAt,
      error: error instanceof Error ? error.message : 'Unknown error',
      target: upstreamBaseUrl,
    }
  }
}
