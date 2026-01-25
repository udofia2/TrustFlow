'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

/**
 * MiniAppInitializer
 * 
 * Handles initialization of the Facaster Mini App SDK.
 * Detects if the app is running in a Facaster Mini App environment
 * and calls ready() to hide the splash screen.
 * 
 * This component should be included in the root layout to ensure
 * proper initialization across all pages.
 */
export function MiniAppInitializer() {
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Check if we're running in a Mini App environment
        const isMiniApp = await sdk.isInMiniApp()
        
        if (isMiniApp) {
          // Call ready() to hide the splash screen
          // This must be called once the app is ready to display
          await sdk.actions.ready()
          
          // Optional: Log context for debugging
          const context = await sdk.context
          console.log('Facaster Mini App context:', context)
        }
      } catch (error) {
        // Silently fail if not in mini app environment
        // This is expected when running as a regular web app
        console.debug('Not running in Facaster Mini App:', error)
      }
    }
    
    initMiniApp()
  }, [])

  // This component doesn't render anything
  return null
}

