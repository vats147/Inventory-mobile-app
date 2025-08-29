
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { productsAPI } from '../services/api';

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  qrCode: string;
  description?: string;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  expirationDate?: string;
}

const ProductsScreen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      const productsData = response.data.products || response.data;
      setProducts(productsData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map((p: Product) => p.category))] as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Fetch products error:', error);
      Alert.alert('Error', 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.qrCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const getStockStatusStyle = (product: Product) => {
    if (product.isExpired) {
      return styles.statusExpired;
    } else if (product.isExpiringSoon) {
      return styles.statusExpiringSoon;
    } else if (product.isLowStock) {
      return styles.statusLowStock;
    }
    return styles.statusNormal;
  };

  const getStockStatusText = (product: Product) => {
    if (product.isExpired) {
      return 'EXPIRED';
    } else if (product.isExpiringSoon) {
      return 'EXPIRES SOON';
    } else if (product.isLowStock) {
      return 'LOW STOCK';
    }
    return 'IN STOCK';
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => openProductModal(item)}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={[styles.statusBadge, getStockStatusStyle(item)]}>
          <Text style={styles.statusText}>{getStockStatusText(item)}</Text>
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <Text style={styles.productPrice}>£{item.price.toFixed(2)}</Text>
        <Text style={styles.productQuantity}>Stock: {item.quantity}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
      </View>
      
      <Text style={styles.productCode}>Code: {item.qrCode}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        
        {/* Search Bar */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryButton, !selectedCategory && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.categoryButtonText, !selectedCategory && styles.categoryButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item._id}
        renderItem={renderProductItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {/* Product Detail Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeProductModal}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Product Details</Text>
            
            {selectedProduct && (
              <View style={styles.productDetailCard}>
                <Text style={styles.detailProductName}>{selectedProduct.name}</Text>
                <Text style={styles.detailProductPrice}>£{selectedProduct.price.toFixed(2)}</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stock:</Text>
                  <Text style={[styles.detailValue, { color: selectedProduct.quantity <= 5 ? '#dc3545' : '#28a745' }]}>
                    {selectedProduct.quantity}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedProduct.category}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>QR Code:</Text>
                  <Text style={styles.detailValue}>{selectedProduct.qrCode}</Text>
                </View>
                
                {selectedProduct.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailDescription}>{selectedProduct.description}</Text>
                  </View>
                )}
                
                {selectedProduct.lowStockThreshold && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Low Stock Alert:</Text>
                    <Text style={styles.detailValue}>{selectedProduct.lowStockThreshold}</Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeProductModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#007bff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  productCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusNormal: {
    backgroundColor: '#28a745',
  },
  statusLowStock: {
    backgroundColor: '#ffc107',
  },
  statusExpiringSoon: {
    backgroundColor: '#fd7e14',
  },
  statusExpired: {
    backgroundColor: '#dc3545',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  productQuantity: {
    fontSize: 16,
    color: '#007bff',
  },
  productCategory: {
    fontSize: 14,
    color: '#6c757d',
  },
  productCode: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
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
  productDetailCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailProductName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailProductPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
  },
  descriptionSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  detailDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductsScreen;
