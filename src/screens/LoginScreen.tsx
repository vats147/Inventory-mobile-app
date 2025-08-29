import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    Alert.alert('Error', `Attempting login with: ${email} , ${password}`);

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting login with:', { username: email, password: '***' });
      const response = await authAPI.login({ email: email, password });
      
      if (response && response.data) {
        console.log('Login response:', response.data);
        const { token, user } = response.data;
        
        // Store token and user info
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        
        onLogin();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        // If backend is not available, use demo mode
        Alert.alert(
          'Backend Not Available', 
          'Cannot connect to server. Would you like to continue in demo mode?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Demo Mode', onPress: () => handleDemoLogin() }
          ]
        );
        return;
      } else if (error.response?.status === 404) {
        errorMessage = 'Login endpoint not found. Please check the API configuration.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid credentials. Please check your username and password.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      // Create demo token and user for offline mode
      const demoToken = 'demo-token-' + Date.now();
      const demoUser = {
        id: 'demo-user',
        username: email,
        email: email,
        role: email.includes('admin') ? 'admin' : 'staff',
        firstName: 'Demo',
        lastName: 'User'
      };
      
      await AsyncStorage.setItem('authToken', demoToken);
      await AsyncStorage.setItem('userInfo', JSON.stringify(demoUser));
      await AsyncStorage.setItem('demoMode', 'true');
      
      onLogin();
    } catch (error) {
      console.error('Demo login error:', error);
      Alert.alert('Error', 'Failed to set up demo mode');
    }
  };

  const handleAdminLogin = async () => {
    setEmail('admin@offlicense.com');
    setPassword('admin123');
    setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authAPI.login({ email: 'admin@offlicense.com', password: 'admin123' });
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        
        onLogin();
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        Alert.alert('Login Error', errorMessage);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const handleStaffLogin = async () => {
    setEmail('staff@offlicense.com');
    setPassword('staff123');
    setTimeout(async () => {
      setLoading(true);
      try {
        const response = await authAPI.login({ email: 'staff@offlicense.com', password: 'staff123' });
        const { token, user } = response.data;
        
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        
        onLogin();
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        Alert.alert('Login Error', errorMessage);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory App</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.demoButtonsContainer}>
        <Text style={styles.demoText}>Demo Credentials</Text>
        
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity style={styles.demoButton} onPress={handleAdminLogin}>
            <Text style={styles.demoButtonText}>Admin Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.demoButton} onPress={handleStaffLogin}>
            <Text style={styles.demoButtonText}>Staff Login</Text>
          </TouchableOpacity>
        </View>

        {/* Demo Mode Button */}
        <TouchableOpacity 
          style={styles.demoModeButton} 
          onPress={handleDemoLogin}
          disabled={loading}
        >
          <Text style={styles.demoModeButtonText}>🚀 Demo Mode (No Backend)</Text>
        </TouchableOpacity>
        
        <Text style={styles.credentialsText}>
          Admin: admin@offlicense.com / admin123{'\n'}
          Staff: staff@offlicense.com / staff123{'\n'}
          Demo Mode: Test app without backend server
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  demoButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  demoButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  demoModeButton: {
    backgroundColor: '#6f42c1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
  },
  demoModeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  credentialsText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;
