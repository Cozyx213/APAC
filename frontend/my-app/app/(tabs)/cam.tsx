import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Platform,
} from "react-native";
// axios is unused when using fetch for file upload
// import axios from "axios";

export default function App() {
    const [permission, requestPermission] = useCameraPermissions();
    const [text, setText] = useState("");
    const cameraRef = useRef<CameraView>(null);
    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const handleScan = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            const formData = new FormData();

            try {
                // Append the image and plant fields to the FormData object
                formData.append("image", {
                    uri: photo.uri,
                    name: "photo.jpg",
                    type: "image/jpeg",
                } as any);
                formData.append("plant", text);

                // Debugging: Log the FormData parts
                console.log("FormData parts", formData);

                // Use appropriate host for emulator vs real device
                const host ="http://192.168.1.6:5000";
                // Send request using fetch (better file upload support in React Native)
                const response = await fetch(`${host}/generate`, {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                console.log("Response:", data);
            } catch (error) {
                console.error("Error:", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef}>
                <View style={styles.buttonContainer}>
                    <View style={{ padding: 10 }}>
                        <TextInput
                            style={{ height: 40, padding: 5 }}
                            placeholder="What plant is this?"
                            placeholderTextColor="white"
                            onChangeText={(newText) => setText(newText)}
                            defaultValue={text}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleScan}
                    >
                        <Text style={styles.text}>Scan</Text>
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
    },
    message: {
        textAlign: "center",
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "transparent",
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: "flex-end",
        alignItems: "center",
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
});
