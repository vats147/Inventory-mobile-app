// Demo data and API functions for testing without backend
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo products data
const DEMO_PRODUCTS = [
  {
    _id: '1',
    name: 'Coca-Cola 500ml',
    price: 2.50,
    quantity: 25,
    category: 'Beverages',
    qrCode: 'ABC123',
    description: 'Classic Coca-Cola in 500ml bottle',
    lowStockThreshold: 5,
    isLowStock: false,
    isExpired: false,
    isExpiringSoon: false,
  },
  {
    _id: '2',
    name: 'Marlboro Red',
    price: 12.99,
    quantity: 3,
    category: 'Tobacco',
    qrCode: 'MAR001',
    description: 'Marlboro Red cigarettes pack',
    lowStockThreshold: 5,
    isLowStock: true,
    isExpired: false,
    isExpiringSoon: false,
  },
  {
    _id: '3',
    name: 'Heineken Beer 4-Pack',
    price: 8.99,
    quantity: 15,
    category: 'Alcohol',
    qrCode: 'HEIN004',
    description: 'Heineken beer 4-pack cans',
    lowStockThreshold: 10,
    isLowStock: false,
    isExpired: false,
    isExpiringSoon: false,
  },
  {
    _id: '4',
    name: 'Milk 1L',
    price: 1.85,
    quantity: 8,
    category: 'Dairy',
    qrCode: 'MILK001',
    description: 'Fresh whole milk 1 litre',
    lowStockThreshold: 5,
    isLowStock: false,
    isExpired: false,
    isExpiringSoon: true,
  },
  {
    _id: '5',
    name: 'Bread Loaf',
    price: 1.20,
    quantity: 0,
    category: 'Food',
    qrCode: 'BREAD01',
    description: 'White bread loaf',
    lowStockThreshold: 2,
    isLowStock: true,
    isExpired: true,
    isExpiringSoon: false,
  },
];

// Demo dashboard metrics
const DEMO_METRICS = {
  totalProducts: DEMO_PRODUCTS.length,
  lowStock: DEMO_PRODUCTS.filter(p => p.isLowStock).length,
  totalValue: DEMO_PRODUCTS.reduce((sum, p) => sum + (p.price * p.quantity), 0),
  todaysSales: 42,
  expiredProducts: DEMO_PRODUCTS.filter(p => p.isExpired).length,
  expiringSoon: DEMO_PRODUCTS.filter(p => p.isExpiringSoon).length,
};

// Check if app is in demo mode
export const isDemoMode = async (): Promise<boolean> => {
  const demoMode = await AsyncStorage.getItem('demoMode');
  return demoMode === 'true';
};

// Demo API functions
export const demoAPI = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 1000)); // Simulate network delay
    return {
      data: {
        token: 'demo-token-' + Date.now(),
        user: {
          id: 'demo-user-' + Date.now(),
          username: credentials.username,
          email: credentials.username,
          role: credentials.username.includes('admin') ? 'admin' : 'staff',
          firstName: 'Demo',
          lastName: 'User'
        }
      }
    };
  },

  // Products
  getProducts: async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    return {
      data: {
        products: DEMO_PRODUCTS
      }
    };
  },

  getProductByQR: async (qrCode: string) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    const product = DEMO_PRODUCTS.find(p => p.qrCode.toLowerCase() === qrCode.toLowerCase());
    if (product) {
      return { data: product };
    } else {
      throw { response: { status: 404 } };
    }
  },

  updateQuantity: async (productId: string, data: { quantityChange: number }) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    const productIndex = DEMO_PRODUCTS.findIndex(p => p._id === productId);
    if (productIndex >= 0) {
      DEMO_PRODUCTS[productIndex].quantity = Math.max(0, DEMO_PRODUCTS[productIndex].quantity + data.quantityChange);
      DEMO_PRODUCTS[productIndex].isLowStock = DEMO_PRODUCTS[productIndex].quantity <= DEMO_PRODUCTS[productIndex].lowStockThreshold;
      return { data: { success: true } };
    } else {
      throw { response: { status: 404 } };
    }
  },

  reduceStock: async (data: { productId: string; quantity: number; reason?: string }) => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    const productIndex = DEMO_PRODUCTS.findIndex(p => p._id === data.productId);
    if (productIndex >= 0) {
      DEMO_PRODUCTS[productIndex].quantity = Math.max(0, DEMO_PRODUCTS[productIndex].quantity - data.quantity);
      DEMO_PRODUCTS[productIndex].isLowStock = DEMO_PRODUCTS[productIndex].quantity <= DEMO_PRODUCTS[productIndex].lowStockThreshold;
      return { data: { success: true } };
    } else {
      throw { response: { status: 404 } };
    }
  },

  // Analytics
  getDashboard: async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    // Recalculate metrics based on current product state
    const metrics = {
      totalProducts: DEMO_PRODUCTS.length,
      lowStock: DEMO_PRODUCTS.filter(p => p.isLowStock).length,
      totalValue: DEMO_PRODUCTS.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      todaysSales: 42,
      expiredProducts: DEMO_PRODUCTS.filter(p => p.isExpired).length,
      expiringSoon: DEMO_PRODUCTS.filter(p => p.isExpiringSoon).length,
    };
    return { data: metrics };
  }
};

export default demoAPI;
