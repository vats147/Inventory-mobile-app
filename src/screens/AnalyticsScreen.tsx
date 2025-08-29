import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { analyticsAPI } from '../services/api';

interface TopProduct {
  _id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

interface SalesData {
  date: string;
  totalSales: number;
  revenue: number;
}

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch top products
      const topProductsResponse = await analyticsAPI.getTopProducts({ 
        limit: 5, 
        period: selectedPeriod 
      });
      setTopProducts(topProductsResponse.data);

      // Fetch sales data
      const salesResponse = await analyticsAPI.getSalesData({ 
        groupBy: 'day' 
      });
      setSalesData(salesResponse.data);

      // Fetch inventory value
      const inventoryResponse = await analyticsAPI.getInventoryValue();
      setInventoryValue(inventoryResponse.data.totalValue);

    } catch (error) {
      console.error('Analytics fetch error:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Sales & Inventory Insights</Text>
      </View>

      {/* Period Selection */}
      <View style={styles.periodSelector}>
        <Text style={styles.sectionTitle}>Time Period</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {['7days', '30days', '3months', '6months'].map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period === '7days' ? 'Last 7 Days' : 
                 period === '30days' ? 'Last 30 Days' :
                 period === '3months' ? 'Last 3 Months' : 'Last 6 Months'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Inventory Value Card */}
      <View style={styles.valueCard}>
        <Text style={styles.valueTitle}>Total Inventory Value</Text>
        <Text style={styles.valueAmount}>£{inventoryValue.toFixed(2)}</Text>
      </View>

      {/* Top Products Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        {topProducts.length > 0 ? (
          topProducts.map((product, index) => (
            <View key={product._id} style={styles.productCard}>
              <View style={styles.productRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSales}>
                  {product.totalSold} units sold • £{product.revenue.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sales data available for this period</Text>
          </View>
        )}
      </View>

      {/* Sales Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sales Activity</Text>
        {salesData.length > 0 ? (
          <View style={styles.salesSummary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>
                {salesData.reduce((sum, day) => sum + day.totalSales, 0)}
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>
                £{salesData.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent sales data</Text>
          </View>
        )}
      </View>

      {/* Key Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>📈</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Sales Performance</Text>
            <Text style={styles.insightDescription}>
              {topProducts.length > 0 
                ? `${topProducts[0]?.name} is your best-selling product with ${topProducts[0]?.totalSold} units sold.`
                : 'Monitor your product sales to identify top performers.'
              }
            </Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightIcon}>💰</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Inventory Value</Text>
            <Text style={styles.insightDescription}>
              Your total inventory is valued at £{inventoryValue.toFixed(2)}. Monitor stock levels to optimize cash flow.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  periodSelector: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodScroll: {
    marginTop: 10,
  },
  periodButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  periodButtonActive: {
    backgroundColor: '#007bff',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  valueCard: {
    backgroundColor: '#e3f2fd',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valueTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSales: {
    fontSize: 14,
    color: '#666',
  },
  salesSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 0.48,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AnalyticsScreen;
