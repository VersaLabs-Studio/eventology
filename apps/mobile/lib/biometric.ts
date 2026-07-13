// ============================================================================
// Biometric app-unlock (Part 2 §7.2 — expo-local-authentication)
// ============================================================================
// Opt-in Face ID / fingerprint gate. The preference lives in AsyncStorage; the
// gate component (BiometricGate) reads it on cold start and on foreground.
// All calls degrade safely on devices/emulators without biometric hardware.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const PREF_KEY = 'security:biometricLock';

/** Whether the device has enrolled biometric hardware we can use. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREF_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PREF_KEY, enabled ? '1' : '0');
  } catch {
    /* best-effort */
  }
}

/** Prompt for biometric auth. Returns true on success. */
export async function authenticate(promptMessage: string): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}
