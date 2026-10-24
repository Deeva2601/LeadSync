// ─────────────────────────────────────────────────────────────────────────────
// src/components/EmptyState.jsx
// Shown when there are no leads yet.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyState = () => (
  <View style={styles.container}>
    <Text style={styles.icon}>📋</Text>
    <Text style={styles.title}>Waiting for leads…</Text>
    <Text style={styles.subtitle}>
      Submit a test lead via Meta's Lead Testing Tool.{'\n'}
      It will appear here in real-time — no refresh needed.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default EmptyState;
