// ─────────────────────────────────────────────────────────────────────────────
// src/components/LeadCard.jsx
// Renders a single lead row with avatar, name, email, phone and timestamp.
// The "new" animation plays once when the card first mounts.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import { getLeadName, getFieldValue, getInitials, formatTime } from '../utils/helpers';

// Colour palette for avatars – cycles by index
const AVATAR_COLOURS = [
  '#4361EE', '#3A0CA3', '#7209B7', '#F72585',
  '#4CC9F0', '#06D6A0', '#FB8500', '#E63946',
];

const LeadCard = ({ lead, index, isNew }) => {
  const slideAnim = useRef(new Animated.Value(isNew ? -80 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const glowAnim = useRef(new Animated.Value(isNew ? 1 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow fades out after entry
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 1800,
        delay: 400,
        useNativeDriver: false,
      }).start();
    }
  }, []);

  const name  = getLeadName(lead.fields);
  const email = getFieldValue(lead.fields, 'email');
  const phone = getFieldValue(lead.fields, 'phone_number') || getFieldValue(lead.fields, 'phone');
  const time  = formatTime(lead.createdAt);
  const initials = getInitials(name);
  const avatarColor = AVATAR_COLOURS[index % AVATAR_COLOURS.length];

  const glowBg = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(67,97,238,0)', 'rgba(67,97,238,0.08)'],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: glowBg,
        },
      ]}>
      {/* Avatar circle */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>

        {email ? (
          <Text style={styles.detail} numberOfLines={1}>✉  {email}</Text>
        ) : null}
        {phone ? (
          <Text style={styles.detail}>📞  {phone}</Text>
        ) : null}
      </View>

      {/* Timestamp */}
      <Text style={styles.time}>{time}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
  },
  detail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  newBadge: {
    backgroundColor: '#4361EE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

export default LeadCard;
