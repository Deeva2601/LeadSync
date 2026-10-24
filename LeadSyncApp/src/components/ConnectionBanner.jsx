// ─────────────────────────────────────────────────────────────────────────────
// src/components/ConnectionBanner.jsx
// Shows a small coloured pill at the top indicating socket connection state.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ConnectionBanner = ({ status }) => {
  const configs = {
    connected:    { color: '#06D6A0', label: '● Live' },
    connecting:   { color: '#FB8500', label: '◌ Connecting…' },
    disconnected: { color: '#E63946', label: '✕ Disconnected' },
  };

  const cfg = configs[status] || configs.disconnected;

  return (
    <View style={[styles.banner, { backgroundColor: cfg.color + '22' }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConnectionBanner;
