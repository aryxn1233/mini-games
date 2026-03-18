import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aryxn.minigames',
  appName: 'Mini Games',
  webDir: 'out',
  server: {
    url: 'https://mini-games-seven-psi.vercel.app/',
    cleartext: true
  }
};

export default config;
