import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { getFutureSelfReply } from '../lib/ai';

const FREE_DAILY_LIMIT = 5;

export default function ChatScreen({ navigation, route }) {
  const { userId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [todayCount, setTodayCount] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    loadEverything();
  }, []);

  async function loadEverything() {
    const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    setProfile(profileData);

    const { data: userData } = await supabase.from('users').select('subscription_status').eq('id', userId).single();
    setSubscriptionStatus(userData?.subscription_status || 'free');

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    setMessages(msgs || []);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const count = (msgs || []).filter(
      (m) => m.role === 'user' && new Date(m.created_at) >= startOfDay
    ).length;
    setTodayCount(count);
  }

  const limitReached = subscriptionStatus === 'free' && todayCount >= FREE_DAILY_LIMIT;

  async function handleSend() {
    if (!input.trim() || sending) return;
    if (limitReached) {
      navigation.navigate('Paywall', { userId });
      return;
    }

    const userMsg = { role: 'user', content: input.trim(), user_id: userId };
    setInput('');
    setSending(true);

    const optimistic = { ...userMsg, id: `local-${Date.now()}`, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);

    const { data: saved } = await supabase.from('messages').insert(userMsg).select().single();
    setTodayCount((c) => c + 1);

    try {
      const history = [...messages, saved].map((m) => ({ role: m.role, content: m.content }));
      const reply = await getFutureSelfReply(profile, history);

      const assistantMsg = { role: 'assistant', content: reply, user_id: userId };
      const { data: savedReply } = await supabase.from('messages').insert(assistantMsg).select().single();
      setMessages((prev) => [...prev.filter((m) => m.id !== optimistic.id), saved, savedReply]);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <LinearGradient colors={['#F3EEFF', '#E7F0FF']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Text style={styles.header}>Future You</Text>
        {subscriptionStatus === 'free' && (
          <Text style={styles.limitLabel}>{Math.max(FREE_DAILY_LIMIT - todayCount, 0)} messages left today</Text>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={item.role === 'user' ? styles.userText : styles.aiText}>{item.content}</Text>
            </View>
          )}
        />

        {sending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#8B6FF0" />
            <Text style={styles.typingText}>Future You is typing...</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={limitReached ? 'Upgrade to keep chatting...' : 'Say something...'}
            placeholderTextColor="#A79FC7"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>{limitReached ? 'Upgrade' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: '700', color: '#3A2E63', textAlign: 'center' },
  limitLabel: { textAlign: 'center', color: '#8B6FF0', fontSize: 13, marginTop: 4 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 18, marginVertical: 6 },
  userBubble: { backgroundColor: '#8B6FF0', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#FFFFFFE0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  userText: { color: '#fff', fontSize: 15 },
  aiText: { color: '#3A2E63', fontSize: 15 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingBottom: 6 },
  typingText: { marginLeft: 8, color: '#8B6FF0', fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: '#FFFFFFCC', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, color: '#3A2E63', marginRight: 8, borderWidth: 1, borderColor: '#E1D6FF',
  },
  sendButton: { backgroundColor: '#8B6FF0', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  sendText: { color: '#fff', fontWeight: '600' },
});
