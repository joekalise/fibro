const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const isAndroid = process.env.EAS_BUILD_PLATFORM === 'android';

function withFmtFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');
      if (!contents.includes('fmt_compile_patch')) {
        // Patch fmt/compile.h in post_install so FMT_COMPILE expands to FMT_STRING
        // instead of the consteval-based compiled_string variant.
        // fmt 11.x unconditionally redefines FMT_CONSTEVAL, so compiler flags can't fix this.
        contents = contents.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|
  # fmt_compile_patch: disable consteval FMT_COMPILE — Apple Clang has broken consteval
  fmt_compile_patch = "#{installer.sandbox.root}/fmt/include/fmt/compile.h"
  if File.exist?(fmt_compile_patch)
    src = File.read(fmt_compile_patch)
    patched = src.sub(
      '#if defined(__cpp_if_constexpr) && defined(__cpp_return_type_deduction)',
      '#if 0 // disabled: consteval FMT_COMPILE breaks Apple Clang'
    )
    File.write(fmt_compile_patch, patched) if src != patched
  end`
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
}

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
      ...(isAndroid && { googleServicesFile: './google-services.json' }),
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
      [
        'expo-build-properties',
        {
          ios: {
            extraPods: [
              { name: 'GoogleUtilities', modular_headers: true },
            ],
          },
        },
      ],
      withFmtFix,
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
