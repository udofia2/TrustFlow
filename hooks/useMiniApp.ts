'use client'

import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * useMiniApp Hook
 * 
 * Provides easy access to Facaster Mini App functionality.
 * Detects if the app is running in a Mini App environment
 * and provides access to the SDK context and actions.
 * 
 * @example
 * ```tsx
 * const { isMiniApp, context, signIn } = useMiniApp()
 * 
 * if (isMiniApp) {
 *   // Use mini app specific features
 * }
 * ```
 */
export function useMiniApp() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [context, setContext] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp()
        setIsMiniApp(inMiniApp)

        if (inMiniApp) {
          const ctx = await sdk.context
          setContext(ctx)
        }
      } catch (error) {
        console.debug('Error checking mini app status:', error)
        setIsMiniApp(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkMiniApp()
  }, [])

  return {
    isMiniApp,
    context,
    isLoading,
    // Expose SDK actions for convenience
    actions: {
      signIn: (options?: any) => sdk.actions.signIn(options || {}),
      ready: () => sdk.actions.ready(),
      close: () => sdk.actions.close(),
      openUrl: (url: string) => sdk.actions.openUrl({ url }),
      viewProfile: (fid: number) => sdk.actions.viewProfile({ fid }),
      viewCast: (hash: string) => sdk.actions.viewCast({ hash }),
      composeCast: (text: string) => sdk.actions.composeCast({ text }),
    },
    // Expose wallet functionality
    wallet: {
      getEthereumProvider: () => sdk.wallet.getEthereumProvider(),
    },
  }
}

