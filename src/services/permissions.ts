import { Platform, PermissionsAndroid } from 'react-native';

export async function ensureCameraPermission() {
  // Since we're using manual scanner, we don't need actual camera permissions
  // This function is kept for compatibility and returns true
  console.log('Manual scanner mode - no camera permissions needed');
  return true;
}

export async function requestCameraPermission() {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to scan barcodes',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS permissions handled automatically
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
}
