import { Platform } from "react-native"

declare global {
  interface Window {
    fbq?: (...args: any[]) => void
    _fbq?: (...args: any[]) => void
  }
}

const DEFAULT_PIXEL_ID = "3137121563141800"

let didInit = false
let initInFlight: Promise<void> | null = null

function injectMetaPixelScript(): void {
  if (typeof window === "undefined") return
  if (window.fbq) return

  // Meta Pixel base code (adapted to a safe, idempotent injection)
  ;(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return
    n = (f.fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    })
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = "2.0"
    n.queue = []
    t = b.createElement(e)
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")
}

async function waitForFbq(timeoutMs = 3000): Promise<void> {
  const start = Date.now()
  while (typeof window !== "undefined" && !window.fbq && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 25))
  }
}

async function ensureInitialized(pixelId: string = DEFAULT_PIXEL_ID): Promise<void> {
  if (didInit) return
  if (Platform.OS !== "web") return
  if (typeof window === "undefined") return

  if (!initInFlight) {
    initInFlight = (async () => {
      injectMetaPixelScript()
      await waitForFbq()
      if (window.fbq) {
        window.fbq("init", pixelId)
        didInit = true
      }
    })().finally(() => {
      initInFlight = null
    })
  }

  await initInFlight
}

export const MetaPixelEvent = {
  /**
   * Track a Meta Pixel custom event by name.
   * Web-only; no-ops on iOS/Android.
   */
  async track(eventName: string, pixelId?: string): Promise<void> {
    await ensureInitialized(pixelId)
    if (Platform.OS !== "web") return
    if (typeof window === "undefined") return
    window.fbq?.("track", eventName)
  },
}

