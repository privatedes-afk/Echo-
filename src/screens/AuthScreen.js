import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function afterAuth(userId, userEmail) {
    await supabase.from('users').upsert({ id: userId, email: userEmail }, { onConflict: 'id' });

    const { data: profile } = await supabase.from('profiles').select('user_id').eq('user_id', userId).maybeSingle();

    if (profile) {
      navigation.replace('Chat', { userId });
    } else {
      navigation.replace('Onboarding', { userId });
    }
  }

  async function handleEmailAuth() {
    setError('');
    setLoading(true);
    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      if (data.user) await afterAuth(data.user.id, data.user.email);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'echo://auth-callback' },
      });
      if (error) throw error;
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <LinearGradient colors={['#E8DFFF', '#D8E8FF']} style={styles.container}>
      <Text style={styles.logo}>Echo</Text>
      <Text style={styles.tagline}>Talk to who you're becoming.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#A79FC7"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#A79FC7"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleEmailAuth} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : isSignUp ? 'Sign Up' : 'Log In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleAuth}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.toggle}>
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: { fontSize: 40, fontWeight: '800', color: '#3A2E63', textAlign: 'center' },
  tagline: { fontSize: 15, color: '#6B5F94', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#FFFFFFCC', borderRadius: 14, padding: 16, fontSize: 15,
    color: '#3A2E63', marginBottom: 14, borderWidth: 1, borderColor: '#E1D6FF',
  },
  error: { color: '#D0568A', marginBottom: 10, textAlign: 'center' },
  button: { backgroundColor: '#8B6FF0', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  googleButton: {
    backgroundColor: '#FFFFFFCC', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: '#E1D6FF',
  },
  googleText: { color: '#3A2E63', fontSize: 15, fontWeight: '500' },
  toggle: { textAlign: 'center', color: '#8B7FB0' },
});
