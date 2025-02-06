import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY = '@notes';

export default function App() {
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

  return (
    <View style={styles.container}>
      
      <TextInput
        style={styles.textInput}
        onChangeText={setText}
        value={text}
        placeholder="Enter your note"
      />
      <Pressable style={styles.button} onPress={() => saveInput(text)}>
        <Text style={{ color: 'white' }}>Save</Text>
      </Pressable>
      <FlatList
        data={notes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={{ padding: 10 }}>{item.name}</Text>}
      />
      <StatusBar style="auto" />
      <Pressable></Pressable>
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
  button: {
    backgroundColor: 'blue',
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
});
