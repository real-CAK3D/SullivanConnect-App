
import { Link, Tabs } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../../store/AppStateContext';
import { TouchableOpacity, Text } from 'react-native';

export default function AppLayout() {
  const { role } = useAppState();

  if (!role) {
    // Redirect is done from index to /login, this is just a safe guard
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTitleStyle: { color: '#FFFFFF', fontWeight: '800' },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.background },
        headerRight: () => (
          <Link href="/(app)/profile" asChild>
            <TouchableOpacity accessibilityLabel="Open profile" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="person-circle-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </Link>
        ),
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="chores/index"
        options={{
          title: 'Chores',
          tabBarIcon: ({ color }) => <Ionicons name="checkmark-done-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="objectives/index"
        options={{
          title: 'Objectives',
          tabBarIcon: ({ color }) => <Ionicons name="flag-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="safety/index"
        options={{
          title: 'Safety',
          tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="prizes/index"
        options={{
          title: 'Prizes',
          tabBarIcon: ({ color }) => <Ionicons name="gift-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="messages/index"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="schedule/index"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Ionicons name="notifications-outline" size={22} color={color || colors.text} />,
        }}
      />
      <Tabs.Screen
        name="requests/index"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Ionicons name="paper-plane-outline" size={22} color={color || colors.text} />,
        }}
      />
      {/* Hidden routes accessible via header/profile button */}
      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarButton: () => null,
          title: 'Profile',
          headerLeft: () => (
            <Link href="/(app)/home" asChild>
              <TouchableOpacity accessibilityLabel="Back to Home" style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Back</Text>
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory/edit"
        options={{
          tabBarButton: () => null,
          title: 'Edit Item',
        }}
      />
    </Tabs>
  );
}
