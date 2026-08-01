import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import { supabase } from '../lib/supabase';

const BENEFITS = [
  'Unlimited messages with Future You',
  'Unlimited time capsules',
  'Priority AI response speed',
  'Support the people building Echo',
];

export default function PaywallScreen({ navigation, route }) {
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.[0];
      if (!pkg) throw new Error('No package available');

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isActive = customerInfo.entitlements.active['unlimited'] != null;

      if (isActive) {
        await supabase.from('users').update({ subscription_status: 'paid' }).eq('id', userId);
        navigation.goBack();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#E8DFFF', '#D8E8FF']} style={styles.container}>
      <Text style={styles.title}>Talk to Future You, anytime</Text>
      <Text style={styles.subtitle}>You've hit today's free message limit. Upgrade for unlimited reflection.</Text>

      <View style={styles.benefitsCard}>
        {BENEFITS.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubscribe} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Subscribe — $6.99/month'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.later}>Maybe later</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100, paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700', color: '#3A2E63', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#6B5F94', textAlign: 'center', marginBottom: 30 },
  benefitsCard: { backgroundColor: '#FFFFFFCC', borderRadius: 20, padding: 22, marginBottom: 30 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkmark: { color: '#8B6FF0', fontSize: 18, fontWeight: '700', marginRight: 10 },
  benefitText: { fontSize: 15, color: '#3A2E63' },
  button: { backgroundColor: '#8B6FF0', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 14 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  later: { textAlign: 'center', color: '#8B7FB0' },
});
