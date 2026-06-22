import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// expo-secure-store has no web implementation, so we fall back to AsyncStorage there.
const isNative = Platform.OS !== 'web';

export async function getItem(key: string): Promise<string | null> {
  return isNative ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  return isNative ? SecureStore.setItemAsync(key, value) : AsyncStorage.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  return isNative ? SecureStore.deleteItemAsync(key) : AsyncStorage.removeItem(key);
}
