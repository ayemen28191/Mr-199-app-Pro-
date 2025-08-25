import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Icons from './Icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Icons.AlertCircle size={48} color="#ef4444" />
          </View>
          
          <Text style={styles.title}>حدث خطأ غير متوقع</Text>
          
          <Text style={styles.message}>
            عذراً، حدث خطأ في التطبيق. يرجى إعادة المحاولة أو إعادة تشغيل التطبيق.
          </Text>
          
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
          >
            <Icons.RefreshCw size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 280,
  },
  errorDetails: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: 300,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;