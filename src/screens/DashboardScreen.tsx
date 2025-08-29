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

interface DashboardMetrics {
  totalProducts: number;
  lowStock: number;
  totalValue: number;
  todaysSales: number;
  expiredProducts: number;
  expiringSoon: number;
}

const DashboardScreen = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setMetrics(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Inventory Overview</Text>
      </View>

      {metrics && (
        <>
          {/* Key Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{metrics.totalProducts}</Text>
              <Text style={styles.metricLabel}>Total Products</Text>
            </View>

            <View style={[styles.metricCard, styles.valueCard]}>
              <Text style={styles.metricValue}>£{metrics.totalValue.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Total Value</Text>
            </View>

            <View style={[styles.metricCard, styles.salesCard]}>
              <Text style={styles.metricValue}>{metrics.todaysSales}</Text>
              <Text style={styles.metricLabel}>Today's Sales</Text>
            </View>

            <View style={[styles.metricCard, styles.lowStockCard]}>
              <Text style={styles.metricValue}>{metrics.lowStock}</Text>
              <Text style={styles.metricLabel}>Low Stock</Text>
            </View>
          </View>

          {/* Alert Cards */}
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Alerts</Text>
            
            {metrics.expiredProducts > 0 && (
              <TouchableOpacity style={[styles.alertCard, styles.expiredAlert]}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>⚠️</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Expired Products</Text>
                  <Text style={styles.alertDescription}>
                    {metrics.expiredProducts} product{metrics.expiredProducts !== 1 ? 's' : ''} expired
                  </Text>
                </View>
                <Text style={styles.alertValue}>{metrics.expiredProducts}</Text>
              </TouchableOpacity>
            )}

            {metrics.expiringSoon > 0 && (
              <TouchableOpacity style={[styles.alertCard, styles.expiringSoonAlert]}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>⏰</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Expiring Soon</Text>
                  <Text style={styles.alertDescription}>
                    {metrics.expiringSoon} product{metrics.expiringSoon !== 1 ? 's' : ''} expiring within 7 days
                  </Text>
                </View>
                <Text style={styles.alertValue}>{metrics.expiringSoon}</Text>
              </TouchableOpacity>
            )}

            {metrics.lowStock > 0 && (
              <TouchableOpacity style={[styles.alertCard, styles.lowStockAlert]}>
                <View style={styles.alertIcon}>
                  <Text style={styles.alertIconText}>📦</Text>
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Low Stock Items</Text>
                  <Text style={styles.alertDescription}>
                    {metrics.lowStock} product{metrics.lowStock !== 1 ? 's' : ''} running low
                  </Text>
                </View>
                <Text style={styles.alertValue}>{metrics.lowStock}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>📱</Text>
                <Text style={styles.quickActionLabel}>Scan Product</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>📋</Text>
                <Text style={styles.quickActionLabel}>View Products</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>📊</Text>
                <Text style={styles.quickActionLabel}>Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard}>
                <Text style={styles.quickActionIcon}>⚡</Text>
                <Text style={styles.quickActionLabel}>Low Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  valueCard: {
    backgroundColor: '#e3f2fd',
  },
  salesCard: {
    backgroundColor: '#e8f5e8',
  },
  lowStockCard: {
    backgroundColor: '#fff3cd',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  alertsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  alertCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expiredAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  expiringSoonAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#fd7e14',
  },
  lowStockAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  alertIcon: {
    marginRight: 15,
  },
  alertIconText: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
  },
  alertValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quickActionsSection: {
    padding: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default DashboardScreen;
