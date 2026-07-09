const isAndroid = process.env.EAS_BUILD_PLATFORM === 'android';

module.exports = {
  expo: {
    name: 'Fibro',
    slug: 'fibro',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#F97316',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.fibro.app',
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        NSHealthShareUsageDescription:
          'Fibro reads your health data to identify patterns that may relate to your fibromyalgia symptoms.',
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['fetch', 'processing'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#F97316',
      },
      package: 'com.fibro.app',
      googleServicesFile: './google-services.json',
      permissions: [
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.WAKE_LOCK',
      ],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#F97316',
        },
      ],
      // iOS-only plugins
      ...(!isAndroid ? [['expo-apple-authentication']] : []),
      ...(!isAndroid ? ['react-native-health'] : []),
      'expo-background-fetch',
      'expo-task-manager',
      '@sentry/react-native',
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          project: 'fibro',
          organization: 'fibro',
        },
      ],
      '@react-native-community/datetimepicker',
      '@react-native-firebase/app',
      'expo-updates',
    ],
    updates: {
      url: 'https://u.expo.dev/f338949f-07a0-4e19-80bb-a80d703bf83a',
      enabled: true,
      fallbackToCacheTimeout: 0,
      checkAutomatically: 'ON_LOAD',
    },
    runtimeVersion: '1.0.0',
    scheme: 'fibro',
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'f338949f-07a0-4e19-80bb-a80d703bf83a',
      },
    },
    owner: 'jbrockbanks-organization',
  },
};
