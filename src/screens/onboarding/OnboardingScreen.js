import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { QUESTIONS } from './questions';
import { supabase } from '../../lib/supabase';
import { generateSummary } from '../../lib/ai';

export default function OnboardingScreen({ navigation, route }) {
  const { userId } = route.params;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ satisfaction_score: 5 });
  const [loading, setLoading] = useState(false);

  const question = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  const value = answers[question.key];
  const canContinue = question.optional || question.type === 'slider' || (value && value.trim().length > 0);

  const handleNext = async () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      const summary = await generateSummary(answers);
      const { error } = await supabase.from('profiles').upsert({
        user_id: userId,
        dream: answers.dream,
        career_goal: answers.career_goal,
        location_goal: answers.location_goal,
        fear: answers.fear,
        regret: answers.regret,
        relationships: answers.relationships,
        habit: answers.habit,
        satisfaction_score: answers.satisfaction_score,
        freeform: answers.freeform || null,
        summary_text: summary,
      });
      if (error) throw error;
      await supabase.from('users').update({ name: answers.name }).eq('id', userId);

      navigation.replace('Summary', { summary, userId });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (val) => setAnswers({ ...answers, [question.key]: val });

  return (
    <LinearGradient colors={['#E8DFFF', '#D8E8FF']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.content}>
          <Text style={styles.question}>{question.label}</Text>

          {question.type === 'slider' ? (
            <View style={styles.sliderWrap}>
              <Text style={styles.sliderValue}>{answers.satisfaction_score}</Text>
              <Slider
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={answers.satisfaction_score}
                onValueChange={(v) => setAnswer(v)}
                minimumTrackTintColor="#9B8AFB"
                maximumTrackTintColor="#D9D3F0"
              />
            </View>
          ) : (
            <TextInput
              style={[styles.input, question.multiline && styles.inputMultiline]}
              placeholder={question.placeholder}
              placeholderTextColor="#A79FC7"
              value={value || ''}
              onChangeText={setAnswer}
              multiline={question.multiline}
              autoFocus
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          disabled={!canContinue || loading}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Thinking...' : step === QUESTIONS.length - 1 ? 'Finish' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 70, paddingHorizontal: 24 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#FFFFFF88', marginBottom: 40 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#8B6FF0' },
  content: { flex: 1, justifyContent: 'center' },
  question: { fontSize: 24, fontWeight: '600', color: '#3A2E63', marginBottom: 24, lineHeight: 32 },
  input: {
    backgroundColor: '#FFFFFFCC', borderRadius: 16, padding: 18, fontSize: 17,
    color: '#3A2E63', borderWidth: 1, borderColor: '#E1D6FF',
  },
  inputMultiline: { minHeight: 120, textAlignVertical: 'top' },
  sliderWrap: { alignItems: 'center' },
  sliderValue: { fontSize: 48, fontWeight: '700', color: '#8B6FF0', marginBottom: 12 },
  button: {
    backgroundColor: '#8B6FF0', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 30,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
