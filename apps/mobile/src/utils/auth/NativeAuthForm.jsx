import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../supabase';
import { useAuthStore, useAuthModal } from './store';

export const NativeAuthForm = ({ mode: initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const { close } = useAuthModal();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setAuth({ jwt: data.session.access_token, user: data.user });
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (authError) throw authError;
        // signUp returns a session immediately if email confirmation is disabled
        if (data.session) {
          setAuth({ jwt: data.session.access_token, user: data.user });
        } else {
          setError('Check your email to confirm your account, then sign in.');
          setLoading(false);
          return;
        }
      }
      close();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleAppleSignIn = async () => {
    setError('');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { data, error: authError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (authError) throw authError;

      // Apple only sends name/email on the very first sign-in — persist it if present
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ');
      if (fullName || credential.email) {
        await supabase.auth.updateUser({
          email: credential.email || undefined,
          data: { name: fullName || undefined },
        });
      }

      setAuth({ jwt: data.session.access_token, user: data.user });
      close();
    } catch (err) {
      if (err.code === 'ERR_REQUEST_CANCELED') return; // user dismissed sheet
      setError(err.message || 'Apple Sign In failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#4e1709' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}
      >
        <Text style={{ fontSize: 32, fontWeight: '800', color: '#ffefdd', marginBottom: 8 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </Text>
        <Text style={{ fontSize: 16, color: '#7e3f2d', marginBottom: 40 }}>
          {mode === 'signin'
            ? 'Sign in to continue journaling'
            : 'Start your journaling journey'}
        </Text>

        {mode === 'signup' && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor="#7e3f2d"
            autoCapitalize="words"
            autoCorrect={false}
            style={styles.input}
          />
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#7e3f2d"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#7e3f2d"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        {error ? (
          <Text style={{ color: '#f9a35e', marginBottom: 16, fontSize: 14 }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: '#f9a35e',
            padding: 18,
            borderRadius: 16,
            alignItems: 'center',
            marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#4e1709" />
          ) : (
            <Text style={{ color: '#4e1709', fontSize: 17, fontWeight: '700' }}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#ffefdd', fontSize: 15 }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={{ color: '#f9a35e', fontWeight: '600' }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#7e3f2d' }} />
              <Text style={{ color: '#7e3f2d', marginHorizontal: 12, fontSize: 13 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#7e3f2d' }} />
            </View>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={16}
              style={{ height: 54 }}
              onPress={handleAppleSignIn}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  input: {
    backgroundColor: '#3a1005',
    color: '#ffefdd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7e3f2d',
  },
};
