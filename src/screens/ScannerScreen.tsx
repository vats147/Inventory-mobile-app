import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
  Vibration,
  PermissionsAndroid,
} from 'react-native';
import BarcodeScanner from 'react-native-scan-barcode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productsAPI } from '../services/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  qrCode: string;
  description?: string;
  lowStockThreshold?: number;
}

const ScannerScreen = () => {
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [operation, setOperation] = useState<'add' | 'reduce'>('reduce');
  const [quantity, setQuantity] = useState('1');
  const [scannerActive, setScannerActive] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('1');

  useEffect(() => {
    checkDemoMode();
  }, []);

  const checkDemoMode = async () => {
    try {
      const dm = await AsyncStorage.getItem('isDemoMode') || await AsyncStorage.getItem('demoMode');
      if (dm === 'true') setDemoMode(true);
    } catch (e) {
      console.warn('Failed to read demo mode flag', e);
    }
  };

  const searchProduct = async (qrCode: string) => {
    setLoading(true);
    try {
      const response = await productsAPI.getByQRCode(qrCode);
      setProduct(response.data);
      setShowProductModal(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        Alert.alert('Product Not Found', 'No product found with this QR code.');
      } else {
        Alert.alert('Error', 'Failed to fetch product details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced barcode read handler with vibration and auto-fill
  const onBarCodeRead = (data: string) => {
    if (data && data !== scannedCode) {
      // Trigger vibration feedback
      if (Platform.OS === 'android') {
        Vibration.vibrate(100); // 100ms vibration
      } else {
        Vibration.vibrate(); // Default iOS vibration
      }

      // Auto-fill the input box
      setManualCode(data);
      setScannedCode(data);
      
      // Close scanner modal
      setShowScanner(false);
      setScannerActive(false);
      
      // Automatically search for the product
      searchProduct(data);
    }
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code or barcode');
      return;
    }
    searchProduct(manualCode);
  };

  const startScanner = async () => {
    // You may want to request camera permission here using PermissionsAndroid for Android
    setShowScanner(true);
    setScannerActive(true);
  };

  const closeScannerModal = () => {
    setShowScanner(false);
    setScannerActive(false);
  };

  const handleQuantityUpdate = async () => {
    if (!product || !quantity) return;

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const quantityChange = operation === 'add' ? quantityNum : -quantityNum;
      
      if (operation === 'reduce') {
        await productsAPI.reduceStock({
          productId: product._id,
          quantity: quantityNum,
          reason: 'Sale'
        });
      } else {
        await productsAPI.updateQuantity(product._id, { quantityChange });
      }

      Alert.alert(
        'Success',
        `Stock ${operation === 'add' ? 'added' : 'reduced'} successfully!`,
        [{ text: 'OK', onPress: closeModal }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to ${operation} stock`;
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowProductModal(false);
    setProduct(null);
    setQuantity('1');
    setScannedCode('');
    setManualCode('');
  };

  // Barcode scanner camera view using react-native-scan-barcode
  const CameraView = () => {
    const [torchOn, setTorchOn] = useState(false);
    const [barcodeType, setBarcodeType] = useState('QR_CODE');
    return (
      <View style={styles.scannerContainer}>
        <BarcodeScanner
          style={styles.camera}
          torchMode={torchOn ? 'on' : 'off'}
          cameraType="back"
          barcodeType={barcodeType}
          onBarcodeRead={({ data }: { data: string }) => onBarCodeRead(data)}
        />
        <TouchableOpacity
          style={styles.demoScanButton}
          onPress={() => setTorchOn((prev) => !prev)}
        >
          <Text style={styles.demoScanButtonText}>{torchOn ? 'Turn Torch Off' : 'Turn Torch On'}</Text>
        </TouchableOpacity>
        <View style={styles.scannerFrame}>
          <View style={styles.scannerCorner} />
        </View>
        <Text style={styles.cameraPlaceholderText}>Align barcode within frame</Text>
        <View style={styles.demoScanButtons}>
          <TouchableOpacity 
            style={styles.demoScanButton}
            onPress={() => onBarCodeRead('ABC-abc-1234')}
          >
            <Text style={styles.demoScanButtonText}>Simulate Scan: ABC-abc-1234</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.demoScanButton}
            onPress={() => onBarCodeRead('APPL1L')}
          >
            <Text style={styles.demoScanButtonText}>Simulate Scan: APPL1L</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.demoScanButton}
            onPress={() => onBarCodeRead('TEST-123')}
          >
            <Text style={styles.demoScanButtonText}>Simulate Scan: TEST-123</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Product Scanner</Text>
        <Text style={styles.subtitle}>Scan barcodes or enter codes manually to update inventory</Text>

        {/* Scan Options Grid */}
        <View style={styles.scanOptions}>
          <Text style={styles.sectionTitle}>Scan Options</Text>
          
          <View style={styles.scanOptionsGrid}>
            <TouchableOpacity style={styles.scanOptionCard} onPress={() => {
              Alert.alert('Coming Soon', 'Image upload feature will be available soon.');
            }}>
              <Text style={styles.scanOptionIcon}>🖼️</Text>
              <Text style={styles.scanOptionTitle}>Upload Image</Text>
              <Text style={styles.scanOptionSubtitle}>JPG, PNG, etc.</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.scanOptionCard} 
              onPress={startScanner}
            >
              <Text style={styles.scanOptionIcon}>📷</Text>
              <Text style={styles.scanOptionTitle}>Use Camera</Text>
              <Text style={styles.scanOptionSubtitle}>Live scanning</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.scanOptionCard} onPress={() => {
              Alert.alert('Debug Console', 'Debug console feature for development.');
            }}>
              <Text style={styles.scanOptionIcon}>🔧</Text>
              <Text style={styles.scanOptionTitle}>Debug Console</Text>
              <Text style={styles.scanOptionSubtitle}>Clear logs</Text>
            </TouchableOpacity>
          </View>

          {demoMode && (
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: '#6f42c1' }]} 
              onPress={() => {
                const example = 'ABC-abc-1234';
                setManualCode(example);
                setScannedCode(example);
                searchProduct(example);
              }}
            >
              <Text style={styles.scanButtonText}>🎯 Demo: Scan Example Product</Text>
              <Text style={styles.scanButtonSubtext}>Test with ABC-abc-1234</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Manual Entry */}
        <View style={styles.manualEntry}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="APPL1L"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Test Codes */}
        <View style={styles.quickCodes}>
          <Text style={styles.sectionTitle}>Quick Test Codes</Text>
          {['ABC-abc-1234', 'APPL1L', 'TEST-123'].map((code) => (
            <TouchableOpacity 
              key={code}
              style={styles.quickCodeButton} 
              onPress={() => {
                setManualCode(code);
                searchProduct(code);
              }}
            >
              <Text style={styles.quickCodeText}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </ScrollView>

      {/* Camera Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeScannerModal}
      >
        <View style={styles.scannerModalContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity 
              style={styles.closeScannerButton} 
              onPress={closeScannerModal}
            >
              <Text style={styles.closeScannerText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <View style={{ width: 60 }} />
          </View>

          <CameraView />
        </View>
      </Modal>

      {/* Product Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Product Found</Text>
            
            {product && (
              <View style={styles.productCard}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>Price: £{product.price.toFixed(2)}</Text>
                <Text style={styles.productStock}>Current Stock: {product.quantity}</Text>
                <Text style={styles.productCategory}>Category: {product.category}</Text>
                <Text style={styles.productCode}>Code: {product.qrCode}</Text>
                {product.description && (
                  <Text style={styles.productDescription}>{product.description}</Text>
                )}
              </View>
            )}

            <View style={styles.operationSection}>
              <Text style={styles.sectionTitle}>Operation</Text>
              <View style={styles.operationButtons}>
                <TouchableOpacity
                  style={[
                    styles.operationButton,
                    operation === 'reduce' && styles.operationButtonActive
                  ]}
                  onPress={() => setOperation('reduce')}
                >
                  <Text style={[
                    styles.operationButtonText,
                    operation === 'reduce' && styles.operationButtonTextActive
                  ]}>
                    Reduce Stock
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.operationButton,
                    operation === 'add' && styles.operationButtonActive
                  ]}
                  onPress={() => setOperation('add')}
                >
                  <Text style={[
                    styles.operationButtonText,
                    operation === 'add' && styles.operationButtonTextActive
                  ]}>
                    Add Stock
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.quantityInput, { flex: 0.7 }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                />
                <TouchableOpacity
                  style={styles.calculatorButton}
                  onPress={() => {
                    setCalculatorValue(quantity || '1');
                    setShowCalculator(true);
                  }}
                >
                  <Text style={styles.calculatorButtonText}>Calculator</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleQuantityUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {operation === 'add' ? 'Add' : 'Reduce'} Stock
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Calculator Modal */}
      <Modal
        visible={showCalculator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalculator(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <Text style={styles.modalTitle}>Enter Quantity</Text>
            <View style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 48, fontWeight: '600' }}>{calculatorValue}</Text>
            </View>

            <View style={styles.keypadRow}>
              {['7','8','9'].map((n) => (
                <TouchableOpacity key={n} style={styles.keypadButton} onPress={() => setCalculatorValue(prev => (prev === '0' ? n : prev + n))}>
                  <Text style={styles.keypadText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {['4','5','6'].map((n) => (
                <TouchableOpacity key={n} style={styles.keypadButton} onPress={() => setCalculatorValue(prev => (prev === '0' ? n : prev + n))}>
                  <Text style={styles.keypadText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {['1','2','3'].map((n) => (
                <TouchableOpacity key={n} style={styles.keypadButton} onPress={() => setCalculatorValue(prev => (prev === '0' ? n : prev + n))}>
                  <Text style={styles.keypadText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={styles.keypadButton} onPress={() => setCalculatorValue('0')}>
                <Text style={styles.keypadText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadButton} onPress={() => setCalculatorValue(prev => prev.slice(0, -1) || '0')}>
                <Text style={styles.keypadText}>⌫</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.keypadButton, { backgroundColor: '#28a745' }]} onPress={() => { setQuantity(calculatorValue); setShowCalculator(false); }}>
                <Text style={[styles.keypadText, { color: '#fff' }]}>OK</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.cancelModalButton, { marginTop: 20 }]} onPress={() => setShowCalculator(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  scanOptions: {
    marginBottom: 20,
  },
  scanOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  scanOptionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  scanOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  scanOptionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: '#007bff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  manualEntry: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
  },
  searchButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickCodes: {
    marginBottom: 20,
  },
  quickCodeButton: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  quickCodeText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Scanner Modal Styles
  scannerModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  closeScannerButton: {
    padding: 10,
  },
  closeScannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Camera placeholder styles
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    position: 'relative',
    marginBottom: 40,
  },
  scannerCorner: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007bff',
    borderTopLeftRadius: 12,
  },
  cameraPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  cameraInstructions: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  demoScanButtons: {
    width: '100%',
    paddingHorizontal: 20,
  },
  demoScanButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  demoScanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  // Product Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  productCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: '#007bff',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  operationSection: {
    marginBottom: 20,
  },
  operationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  operationButton: {
    flex: 0.48,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  operationButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
  },
  operationButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  operationButtonTextActive: {
    color: '#fff',
  },
  quantitySection: {
    marginBottom: 30,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
  },
  calculatorButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  calculatorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  
  keypadButton: {
    backgroundColor: '#e9ecef',
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalButtons: {
    gap: 15,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    height: 300,
  },
});

export default ScannerScreen;