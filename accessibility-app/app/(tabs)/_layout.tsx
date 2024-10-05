import { Tabs } from 'expo-router';
import WhisperTestPage from '../whisper-test';

export default function TabLayout() {
  return (
    <Tabs>
      {/* Your existing tabs */}
      <Tabs.Screen
        name="whisper-test"
        options={{
          title: 'Whisper Test',
          // Add any other options you need
        }}
      />
    </Tabs>
  );
}