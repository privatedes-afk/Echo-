import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';

import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SummaryScreen from './src/screens/onboarding/SummaryScreen';
import ChatScreen from './src/screens/ChatScreen';
import TimeCapsuleScreen from './src/screens/TimeCapsuleScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { supabase } from './src/lib/supabase';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [initialParams, setInitialParams] = useState({});

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setInitialRoute('Auth');
      return;
    }
    const userId = session.user.id;
    const { data: profile } = await supabase.from('profiles').select('user_id').eq('user_id', userId).maybeSingle();
    if (profile) {
      setInitialRoute('Chat');
      setInitialParams({ userId });
    } else {
      setInitialRoute('Onboarding');
      setInitialParams({ userId });
    }
  }

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} initialParams={initialParams} />
        <Stack.Screen name="Summary" component={SummaryScreen} />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          initialParams={initialParams}
          options={{
            headerShown: true,
            title: '',
            headerTransparent: true,
            headerRight: () => (
              <TouchableOpacity onPress={() => {}}>
                <Text style={{ color: '#8B6FF0', fontWeight: '600' }}>Capsules</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen name="TimeCapsule" component={TimeCapsuleScreen} options={{ headerShown: true, title: 'Time Capsules' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
