import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, FlatList, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { db, storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker'


const NOTES_COLLECTION = 'notes';
const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Notes" component={NotesStack} />
        <Tab.Screen name="Tab Two" component={TabTwo} />
        <Tab.Screen name="Tab Three" component={TabThree} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const ListPage = ({ navigation }) => {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    async function loadNotes() {
      try {
        const snapshot = await getDocs(collection(db, NOTES_COLLECTION));
        const loadedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setNotes(loadedNotes);
      } catch (error) {
        console.log("Error loading notes:", error);
      }
    }
    loadNotes();
  }, []);

  async function saveInput(input) {
    if (input.trim() === "") return;
    try {
      const docRef = await addDoc(collection(db, NOTES_COLLECTION), { name: input });
      setNotes([...notes, { id: docRef.id, name: input }]); // Update UI immediately
      setText("");
      console.log("Note added:", docRef.id);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  }

  async function deleteAllNotes() {
    try {
      const querySnapshot = await getDocs(collection(db, NOTES_COLLECTION)); // Fetch all notes
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref)); // Delete each note
      await Promise.all(deletePromises); // Wait for all deletions

      setNotes([]);
      console.log("All notes deleted successfully.");
    } catch (error) {
      console.log("Error deleting notes:", error);
    }
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
        keyExtractor={(item) => item.id} // Firestore uses 'id'
        renderItem={({ item }) => {
          return (
            <Pressable onPress={() => {
              console.log("Navigating with note:", item); // Debug before navigating
              navigation.navigate("NoteDetailPage", { note: item, setNotes });
            }}>
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

const NoteDetailPage = ({ route, navigation }) => {
  const { note, setNotes } = route.params; // Getting the note and setNotes function from params
  const [imagePath, setImagePath] = useState(note?.imageUrl || null); // Storing the image path
  const [currentNote, setCurrentNote] = useState(note); // Store the latest version of the note
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take pictures.');
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

  useEffect(() => {
    console.log("Received note in NoteDetailPage:", note);
  }, [note]);

  useEffect(() => {
    const fetchNote = async () => {
      if (!note?.id) {
        console.error("Note ID is missing");
        return;
      }

      try {
        const noteRef = doc(db, "notes", note.id);
        const noteSnap = await getDoc(noteRef);

        console.log(noteSnap.data())

        if (noteSnap.exists()) {
          const updatedNote = noteSnap.data();
          updatedNote.id = noteSnap.id
          setCurrentNote(updatedNote);        
          setImagePath(updatedNote.imageUrl || null);
        } else {
          console.log("Note does not exist");
        }
      } catch (error) {
        console.error("Error fetching note:", error);
      }
    };

    if (note?.id) {
      fetchNote();
    }
  }, [note?.id]);

  const deleteNote = async (noteId) => {
    if (!noteId) {
      console.error("Error: Note ID is undefined");
      return;
    }

    try {
      await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      console.log(`Note with id: ${noteId} deleted`);
      navigation.goBack(); // Go back to the previous screen after deletion
    } catch (error) {
      console.error(`Error deleting note with id: ${noteId}`, error);
    }
  };

  const launchCamera = async () => {  
    if (!hasPermission) {
      Alert.alert("Camera Permission", "Camera access is not granted.");
      return;
    }
  
    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });
    
      if (!result.canceled) {
        setImagePath(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error launching camera:", error);
    }
  };

  const uploadImage = async (noteId, imagePath) => {
    noteId = currentNote.id;

    if (!imagePath) {
      console.log("No image selected");
      return;
    }

    if (!noteId) {
      console.error("Error: Note ID is undefined");
      return;
    }

    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();

      const storageRef = ref(storage, `notes/${noteId}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, { imageUrl: downloadURL });


    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.noteDetailText}>{currentNote.name}</Text>

      {imagePath ? (
        <Image style={{ width: 200, height: 200 }} source={{ uri: imagePath }} />
      ) : (
        <Text>No image uploaded</Text>
      )}

      <Pressable style={styles.pickImageButton} onPress={launchCamera}>
        <Text style={styles.pickImageButtonText}>Take Picture</Text>
      </Pressable>

      <Pressable style={styles.uploadButton} onPress={() => uploadImage(currentNote?.id, imagePath)}>
        <Text style={styles.uploadButtonText}>Upload Image</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={() => deleteNote(currentNote?.id)}>
        <Text style={styles.deleteButtonText}>Delete Note</Text>
      </Pressable>
    </View>
  );
};

function NotesStack() {
  return (
    <Stack.Navigator initialRouteName='ListPage'>
      <Stack.Screen name='ListPage' component={ListPage} options={{ headerShown: false }} />
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
  pickImageButton: {
    backgroundColor: 'blue',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: 'green',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickImageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
})