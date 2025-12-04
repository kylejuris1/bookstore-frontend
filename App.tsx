import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { LibraryProvider } from "./context/LibraryContext"
import { Ionicons } from "@expo/vector-icons"
import HomeScreen from "./screens/HomeScreen"
import LibraryScreen from "./screens/LibraryScreen"
import SettingsScreen from "./screens/SettingsScreen"
import ReaderScreen from "./screens/ReaderScreen"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <LibraryProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: "#d4876f",
            tabBarInactiveTintColor: "#9b7b6f",
            tabBarStyle: {
              backgroundColor: "#1a1a1a",
              borderTopColor: "#333",
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName

              if (route.name === "Home") {
                iconName = focused ? "home" : "home-outline"
              } else if (route.name === "Library") {
                iconName = focused ? "bookmark" : "bookmark-outline"
              } else if (route.name === "Settings") {
                iconName = focused ? "person" : "person-outline"
              }

              return <Ionicons name={iconName} size={size} color={color} />
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeStack}
            options={{
              tabBarLabel: "Home",
            }}
          />
          <Tab.Screen
            name="Library"
            component={LibraryScreen}
            options={{
              tabBarLabel: "Library",
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: "Settings",
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </LibraryProvider>
  )
}
