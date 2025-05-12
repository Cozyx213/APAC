import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      initialRouteName='index'
      screenOptions={{
        tabBarActiveTintColor: '#C5E689n',
        tabBarInactiveTintColor: 'white',
        tabBarStyle: { backgroundColor: '#65B04A' },
         headerShown: false, 
      }}
    >
       <Tabs.Screen
        name="cam"
        options={{
          tabBarLabel: 'Camera',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="camera-alt" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
         
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        // Hide the tab bar for the home screen
        }}
      />
     
     <Tabs.Screen
        name="insights"
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="insights" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}