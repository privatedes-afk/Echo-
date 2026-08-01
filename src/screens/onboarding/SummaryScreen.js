import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';

export default function SummaryScreen({ navigation, route }) {
  const { summary, userId } = route.params;
  const [text, setText] = useState(summary);
  const [saving, setSaving] = useState(false);

  const confirmAndEnter = async () => {
    setSaving(true);
    try {
      await supabase.from('profiles').update({ summary_text: text }).eq('user_id', userId);
      navigation.replace('Chat', { userId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#E8DFFF', '#D8E8FF']} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Here's who Future You sees</Text>
        <Text style={styles.subtitle}>Feel free to edit this — it shapes how they'll talk to you.</Text>
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={setText}
          multiline
        />
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={confirmAndEnter} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Meet Future You'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70, paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#3A2E63', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B5F94', marginBottom: 20 },
  textArea: {
    backgroundColor: '#FFFFFFCC', borderRadius: 16, padding: 18, fontSize: 16,
    color: '#3A2E63', minHeight: 220, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E1D6FF',
  },
  button: {
    backgroundColor: '#8B6FF0', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 30,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
