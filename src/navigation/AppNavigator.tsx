
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ScannerScreen from '../screens/ScannerScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
                <Tab.Navigator
          initialRouteName="Scanner"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              let iconName = '';
              if (route.name === 'Dashboard') iconName = 'view-dashboard-outline';
              if (route.name === 'Products') iconName = 'cube-outline';
              if (route.name === 'Scanner') iconName = 'camera';
              if (route.name === 'Analytics') iconName = 'chart-bar';
              return <Icon name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Products" component={ProductsScreen} />
          <Tab.Screen name="Scanner" component={ScannerScreen} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
