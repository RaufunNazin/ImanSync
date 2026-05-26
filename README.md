# 🌙 ImanSync

**ImanSync** is a beautifully designed, premium, and feature-rich Islamic companion application built using React Native and Expo. It serves as a comprehensive tool to sync your daily spiritual journey with modern features like local notifications, prayer times, full Quran with audio playback, Qibla compass, and custom Duas.

---

## ✨ Key Features

- 📖 **Complete Al-Quran**: Read the Holy Quran with full Bengali translation, high-quality audio playback, and background audio streaming.
- 🧭 **Live Qibla Compass**: Calculate and show precise Qibla direction based on the user's real-time location.
- 🔔 **Smart Prayer Time Notifications**:
  - Automatically calculates correct prayer timings using location coordinates (Aladhan API).
  - Features precise reminders using **Notifee** for exact triggers.
  - Custom quiet hours/Do Not Disturb configuration.
- 📿 **Dua & Adhkar Library**: Multi-category Dua collection with the ability to bookmark and save personal custom Duas.
- 🌓 **Rich & Premium UI**: Harmonious colors, custom dark mode, Outfit and Noto Naskh Arabic typography, and smooth micro-animations.
- 🌐 **Full Localization**: Seamlessly toggles between English and Bengali interfaces.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Expo](https://expo.dev) (SDK 55) & [React Native](https://reactnative.dev)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction) (File-based routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Local Storage**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) & `@react-native-async-storage/async-storage`
- **Audio Playback**: `expo-audio` & `expo-video`
- **Notifications**: `@notifee/react-native` (with support for exact background alarms and quiet-hour filters)
- **Localization**: `i18next` & `react-i18next`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Expo CLI](https://docs.expo.dev/more/expo-cli/)
- Android Studio / Xcode (for local emulation) or an Android device for USB debugging

### Installation

1. Clone the repository and navigate to the directory:
   ```bash
   cd ImanSync
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run android  # Run on Android emulator/device
   # or
   npm run ios      # Run on iOS simulator
   # or
   npm run start    # Open Expo development menu
   ```

---

## 📦 Builds & EAS Deployment (Expo Application Services)

The app is fully configured for EAS builds and over-the-air (OTA) updates under the `nusrat294` owner account.

### Build Profiles (`eas.json`)

- **`development`**: Builds an internal development client mapped to the `development` updates channel.
- **`preview`**: Builds an internal release APK mapped to the `preview` updates channel.
- **`production-apk`**: Builds an optimized, standalone release APK for direct distribution.
- **`production`**: Designed for Play Store/App Store deployment.

### Useful Deployment Commands

> [!WARNING]
> Because the application relies on strict background alarm permissions (`SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`), changes to `app.json` permissions **cannot** be delivered via OTA updates. You must rebuild the native APK instead.

#### 1. Native Build (APK)
To trigger a new standalone production APK build:
```bash
eas build --profile production-apk --platform android
```

#### 2. Over-The-Air (OTA) Updates
To remotely push updates to users already running the production client:
```bash
eas update --channel production --message "Describe your updates here"
```

---

## 📁 Project Structure

```
├── assets/               # Fonts, icons, and static images
├── src/
│   ├── app/              # Screen navigation layouts (Expo Router structure)
│   ├── components/       # Reusable UI components
│   ├── constants/        # Theme variables, colors, and layout metrics
│   ├── i18n/             # Translations (en/bn JSON translation files)
│   ├── lib/              # Database helper & notification setup files
│   ├── services/         # API fetchers, location & notification manager
│   ├── store/            # Zustand global stores (audio, preferences, theme)
│   └── utils/            # Helper utilities and formatters
├── app.json              # Expo system configuration
├── eas.json              # Build configurations & release channels
└── system_config.json    # Application versioning and dynamic changelog
```
