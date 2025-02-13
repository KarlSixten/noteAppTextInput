import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, FlatList } from 'react-native';
import  AsyncStorage  from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const NOTES_KEY = '@notes';
  const Stack = createNativeStackNavigator()
  const Tab = createBottomTabNavigator()

  export default function App() {
    return (
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen name="Notes" component={NotesStack} options={{ headerShown: false }} />
          <Tab.Screen name="Tab Two" component={TabTwo} />
          <Tab.Screen name="Tab Three" component={TabThree} />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }

const ListPage = ({ navigation }) => {

  const [text, setText] = useState("")
  const [notes, setNotes] = useState([])

  useEffect(() => {
    async function loadNotes() {
      try {
        const storedNotes = await AsyncStorage.getItem(NOTES_KEY);
        if (storedNotes !== null) {
          setNotes(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.log("Error loading notes:", error);
      }
    }
    loadNotes();
  }, []);

  useEffect(() => {
    async function saveNotes() {
      try {
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      } catch (error) {
        console.log("Error saving notes:", error);
      }
    }
    saveNotes();
  }, [notes]);

  function saveInput(input) {
    if (input == "") { return }
    setNotes(
      [...notes, {key:notes.length, name: input}])
    setText("");
  }

  function deleteAllNotes() {
    setNotes([])
  }

  return (
    <View style={styles.container}>
      
      <TextInput
        style={styles.textInput}
        onChangeText={setText}
        value={text}
        placeholder="Enter your note"
      />
      <Pressable style={styles.saveButton} onPress={() => saveInput(text)}>
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => navigation.navigate("NoteDetailPage", { note: item })}>
              <Text style={styles.noteItem}>
                {item.name.length > 25 ? item.name.slice(0, 25) + "..." : item.name}
              </Text>
            </Pressable>
          );
        }}
      />
      <StatusBar style="auto" />
      <Pressable style={styles.deleteButton} onPress={() => deleteAllNotes()}>
        <Text style={styles.deleteButtonText}>Delete all</Text>
      </Pressable>
    </View>
  );
}

const NoteDetailPage = ({ route }) => {
  const { note } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.noteDetailText}>{note.name}</Text>
    </View>
  );
};

function NotesStack() {
  return (
    <Stack.Navigator initialRouteName='ListPage'>
      <Stack.Screen name='ListPage' component={ListPage}/>
      <Stack.Screen name="NoteDetailPage" component={NoteDetailPage} options={{ title: 'Note Details' }} />
    </Stack.Navigator>
  )
}

function TabTwo() {
  return (
    <View style={styles.container}>
      <Text style={styles.tabText}>Tab Two</Text>
    </View>
  );
}

function TabThree() {
  return (
    <View style={styles.container}>
      <Text style={styles.tabText}>Tab Three</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: 'blue',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    fontSize: 16,
  },
  noteDetailText: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});