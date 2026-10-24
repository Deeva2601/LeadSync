// ─────────────────────────────────────────────────────────────────────────────
// src/screens/LeadsScreen.jsx
// Main screen – connects to the backend, renders the live lead list,
// and animates newly arriving leads at the top of the list.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Vibration,
} from 'react-native';

import LeadCard from '../components/LeadCard';
import ConnectionBanner from '../components/ConnectionBanner';
import EmptyState from '../components/EmptyState';
import { connectSocket, disconnectSocket, getSocket } from '../services/socketService';
import { SERVER_URL } from '../utils/config';

const LeadsScreen = () => {
  const [leads, setLeads]           = useState([]);
  const [connStatus, setConnStatus] = useState('connecting');
  // Track which lead IDs are "new" (just arrived via socket)
  const newLeadIds = useRef(new Set());
  const listRef    = useRef(null);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => setConnStatus('connected'));
    socket.on('disconnect', () => setConnStatus('disconnected'));
    socket.on('connect_error', () => setConnStatus('disconnected'));

    // Server sends existing leads on first connect
    socket.on('initial_leads', (initialLeads) => {
      setLeads(initialLeads);
    });

    // A new lead arrives – prepend to list with animation marker
    socket.on('new_lead', (lead) => {
      newLeadIds.current.add(lead.id);
      setLeads((prev) => [lead, ...prev]);

      // Small vibration to signal the event on physical device
      Vibration.vibrate(120);

      // Scroll to top so user sees the new card slide in
      listRef.current?.scrollToOffset({ offset: 0, animated: true });

      // Clear "new" marker after animation window (2 s)
      setTimeout(() => {
        newLeadIds.current.delete(lead.id);
      }, 2000);
    });

    // Allow clearing leads from the server side too
    socket.on('leads_cleared', () => setLeads([]));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('initial_leads');
      socket.off('new_lead');
      socket.off('leads_cleared');
      disconnectSocket();
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    Alert.alert('Clear Leads', 'Remove all leads from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${SERVER_URL}/leads`, { method: 'DELETE' });
          } catch {
            // Socket event will handle clearing UI if server is reachable
            setLeads([]);
          }
        },
      },
    ]);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const renderLead = useCallback(
    ({ item, index }) => (
      <LeadCard
        lead={item}
        index={index}
        isNew={newLeadIds.current.has(item.id)}
        key={item.id}
      />
    ),
    [],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F8FC" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LeadSync</Text>
          <Text style={styles.headerSub}>Meta Lead Ads · Live Feed</Text>
        </View>

        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearBtn}
          activeOpacity={0.7}
          accessibilityLabel="Clear all leads">
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* ── Connection pill ── */}
      <ConnectionBanner status={connStatus} />

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {leads.length} {leads.length === 1 ? 'lead' : 'leads'} received
        </Text>
      </View>

      {/* ── Lead list ── */}
      <FlatList
        ref={listRef}
        data={leads}
        renderItem={renderLead}
        keyExtractor={keyExtractor}
        contentContainerStyle={leads.length === 0 ? styles.listEmpty : styles.list}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
  },
  clearBtnText: {
    color: '#E63946',
    fontWeight: '600',
    fontSize: 13,
  },
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  list: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  listEmpty: {
    flex: 1,
  },
});

export default LeadsScreen;
