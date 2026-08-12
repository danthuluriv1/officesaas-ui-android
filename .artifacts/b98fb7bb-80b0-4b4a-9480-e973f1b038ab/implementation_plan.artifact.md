# Implementation Plan: Cleanup Incompatible Dependencies

I will remove the unused components and dependencies that are currently causing the Expo Go app to crash.

## Proposed Changes

### [Unused Components]

#### [DELETE] [animated-icon.tsx](file:///C:/Users/vinay/source/repos/OfficeSaaS-UI/officesaas-android/src/components/animated-icon.tsx)
- Removing because it uses `react-native-worklets` (incompatible with Expo Go) and is not used in any screens.

#### [DELETE] [collapsible.tsx](file:///C:/Users/vinay/source/repos/OfficeSaaS-UI/officesaas-android/src/components/ui/collapsible.tsx)
- Removing because it uses an experimental version of `react-native-reanimated` and is not used in any screens.

---

### [Configuration]

#### [MODIFY] [package.json](file:///C:/Users/vinay/source/repos/OfficeSaaS-UI/officesaas-android/package.json)
- Remove `react-native-worklets` from dependencies.
- Remove `react-native-reanimated` from dependencies.

## Verification Plan

### Automated Tests
- None applicable.

### Manual Verification
- Start the app with `npx expo start --clear`.
- Verify that the app loads in the emulator/device via Expo Go without crashing.
