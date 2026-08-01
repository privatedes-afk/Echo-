import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { generateCapsuleReflection } from '../lib/ai';

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function formatCountdown(unlockAt) {
  const diff = new Date(unlockAt) - new Date();
  if (diff <= 0) return 'Ready to open';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  return `${days}d ${hours}h left`;
}

export default function TimeCapsuleScreen({ route }) {
  const { userId } = route.params;
  const [capsules, setCapsules] = useState([]);
  const [writing, setWriting] = useState(false);
  const [message, setMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState(daysFromNow(30));
  const [showPicker, setShowPicker] = useState(false);
  const [opened, setOpened] = useState(null);
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    loadCapsules();
  }, []);

  async function loadCapsules() {
    const { data } = await supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', userId)
      .order('unlock_at', { ascending: true });
    setCapsules(data || []);
  }

  async function createCapsule() {
    if (!message.trim()) return;
    await supabase.from('time_capsules').insert({
      user_id: userId,
      message: message.trim(),
      unlock_at: unlockDate.toISOString(),
    });
    setMessage('');
    setWriting(false);
    loadCapsules();
  }

  async function openCapsule(capsule) {
    setOpened(capsule);
    const r = await generateCapsuleReflection(capsule.message);
    setReflection(r);
    await supabase.from('time_capsules').update({ delivered: true }).eq('id', capsule.id);
  }

  const isUnlocked = (c) => new Date(c.unlock_at) <= new Date();

  if (opened) {
    return (
      <LinearGradient colors={['#F3EEFF', '#E7F0FF']} style={styles.container}>
        <Text style={styles.title}>A message from your past self</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>{opened.message}</Text>
        </View>
        <Text style={styles.reflectionLabel}>Future You reflects:</Text>
        <View style={[styles.card, styles.reflectionCard]}>
          <Text style={styles.cardText}>{reflection || 'Reflecting...'}</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => setOpened(null)}>
          <Text style={styles.buttonText}>Back to Capsules</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F3EEFF', '#E7F0FF']} style={styles.container}>
      <Text style={styles.title}>Time Capsules</Text>

      {!writing ? (
        <>
          <FlatList
            data={capsules}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                disabled={!isUnlocked(item)}
                onPress={() => isUnlocked(item) && openCapsule(item)}
              >
                <Text style={styles.cardText} numberOfLines={isUnlocked(item) ? undefined : 1}>
                  {isUnlocked(item) ? 'Tap to open ✨' : '🔒 Locked message'}
                </Text>
                <Text style={styles.countdown}>{formatCountdown(item.unlock_at)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No capsules yet. Write one to your future self.</Text>}
          />
          <TouchableOpacity style={styles.button} onPress={() => setWriting(true)}>
            <Text style={styles.buttonText}>+ New Time Capsule</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Dear future me..."
            placeholderTextColor="#A79FC7"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.dateButtonText}>Unlock on: {unlockDate.toDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={unlockDate}
              mode="date"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowPicker(Platform.OS === 'ios');
                if (date) setUnlockDate(date);
              }}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={createCapsule}>
            <Text style={styles.buttonText}>Seal Capsule</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setWriting(false)}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#3A2E63', marginBottom: 16, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFFCC', borderRadius: 16, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#E1D6FF',
  },
  reflectionCard: { backgroundColor: '#EFE7FF' },
  cardText: { fontSize: 15, color: '#3A2E63' },
  countdown: { fontSize: 13, color: '#8B6FF0', marginTop: 6 },
  reflectionLabel: { fontSize: 14, color: '#6B5F94', marginBottom: 6 },
  empty: { textAlign: 'center', color: '#8B7FB0', marginTop: 40 },
  input: {
    backgroundColor: '#FFFFFFCC', borderRadius: 16, padding: 16, fontSize: 15,
    color: '#3A2E63', minHeight: 140, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, borderColor: '#E1D6FF',
  },
  dateButton: { backgroundColor: '#FFFFFFCC', borderRadius: 12, padding: 14, marginBottom: 16, alignItems: 'center' },
  dateButtonText: { color: '#3A2E63', fontWeight: '500' },
  button: { backgroundColor: '#8B6FF0', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { textAlign: 'center', color: '#8B7FB0' },
});
