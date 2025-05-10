import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import { useRef, useState } from "react";

import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    ActivityIndicator,
    ScrollView,
    ImageBackground,
} from "react-native";

// axios is unused when using fetch for file upload
// import axios from "axios";

export default function App() {
    const [permission, requestPermission] = useCameraPermissions();
    const [text, setText] = useState("");
    const [risk, setRiskLevel] = useState("");
    const [disease, setDisease] = useState("");
    const [farmer_actions, setFarmerActions] = useState<string[]>([
        "clean",
        "green",
    ]);
    const cameraRef = useRef<CameraView>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
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
    const handleScanAgain = () => {
        // Reset states to show the camera again
        setResult(null);
        setRiskLevel("");
        setDisease("");
        setFarmerActions([]);
        setText("");
    };

    const handleScan = async () => {
        setLoading(true);
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            const formData = new FormData();
            setPhotoUri(photo.uri);
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
                const host = "http://192.168.1.6:5000";
                // Send request using fetch (better file upload support in React Native)
                const response = await fetch(`${host}/generate`, {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();
                let raw = data.response;
                // remove the ```json prefix and any ``` suffix
                raw = raw
                    .replace(/^```json\s*/, "")
                    .replace(/```$/g, "")
                    .trim();
                // now parse it
                const payload = JSON.parse(raw);
                setResult(payload);
                setDisease(payload.disease);
                setRiskLevel(payload.risk_level);
                setFarmerActions(payload.farmer_actions);
                console.log("Response:", payload);
            } catch (error) {
                console.error("Error:", error);
            }
            setLoading(false);
        }
    };

    // simplified, minimalistic UI
    return (
        <View style={styles.container}>
            {!result && (
                <>
                    <View style={styles.topBar}>
                        <TextInput
                            style={styles.input}
                            placeholder="What plant is this?"
                            placeholderTextColor="#888"
                            onChangeText={setText}
                            value={text}
                        />
                    </View>
                    <CameraView style={styles.camera} ref={cameraRef}>
                        <View style={styles.bottomBar}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleScan}
                            >
                                <Text style={styles.buttonText}>Scan</Text>
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                </>
            )}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Processing...</Text>
                </View>
            )}
            {result &&  photoUri&&(
               <ImageBackground source={{ uri: photoUri }} style={styles.background}>
                <View style={styles.resultContainer}>
                    <ScrollView contentContainerStyle={{ padding: 10 }}>
                        <Text style={styles.diseaseText}>
                            Disease: {disease}
                        </Text>
                        <Text
                            style={[
                                styles.riskText,
                                {
                                    color:
                                        risk.toLowerCase() === "high"
                                            ? "#ff3333"
                                            : risk.toLowerCase() === "medium"
                                            ? "#ffaa00"
                                            : "#33ff33",
                                },
                            ]}
                        >
                            Risk: {risk}
                        </Text>

                        {farmer_actions.map((step, i) => (
                            <Text key={i} style={styles.farmerActionText}>
                                • {step}
                            </Text>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.scanAgainButton}
                        onPress={handleScanAgain}
                    >
                        <Text style={styles.scanAgainText}>Scan Again</Text>
                    </TouchableOpacity>
                </View>
                </ImageBackground>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { flex: 1 },
    topBar: {
        position: "absolute",
        top: 0,
        width: "100%",
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 2,
    },
    message: {
        color: "#fff",
        textAlign: "center",
        marginVertical: 10,
        fontSize: 16,
    },
    camera: { flex: 1, justifyContent: "flex-end" },
    bottomBar: {
        position: "absolute",
        bottom: 30,
        width: "100%",
        alignItems: "center",
        zIndex: 2,
    },
    button: {
        backgroundColor: "green",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: { color: "#fff", fontSize: 16 },
    topOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    bottomOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.2)",
        color: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
    },
    scanButton: {
        backgroundColor: "green",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    scanButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    loadingText: {
        color: "#fff",
        marginTop: 10,
        fontSize: 16,
    },
    resultContainer: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        height: "70%", // Adjust the height as needed
        backgroundColor: "rgba(0,128,0,0.8)", // Green with some transparency
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: "hidden",
    },
    resultTitle: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#fff",
        padding: 10,
        borderBottomWidth: 1,
        borderColor: "#ccc",
    },
    riskText: {
        fontSize: 16,
        marginBottom: 4,
    },
    diseaseText: {
        fontWeight: "bold",
        fontSize: 18,

        color: "#fff", // White text for disease
        marginBottom: 4,
    },
    farmerActionText: {
        fontSize: 14,
        color: "#d0f0d0", // Lighter green text for farmer actions
        marginBottom: 2,
    },
    scanAgainButton: {
        backgroundColor: "#fff",
        padding: 12,
        margin: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    scanAgainText: {
        color: "#green",
        fontSize: 16,
    },
});
