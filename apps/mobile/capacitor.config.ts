import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.jtrack.crm',
  appName: 'JTrack',
  webDir: '../web/.output/public',
  server: {
    androidScheme: 'https'
  }
}

export default config
