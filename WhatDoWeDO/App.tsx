import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MapScreen } from './src/screens/MapScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { useAuth } from './src/hooks/useAuth';

export default function App() {
  const { session, loading, signIn, signUp, signOut } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF5A5F" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {session ? (
        <MapScreen onSignOut={signOut} />
      ) : (
        <AuthScreen onSignIn={signIn} onSignUp={signUp} />
      )}
    </SafeAreaProvider>
  );
}
