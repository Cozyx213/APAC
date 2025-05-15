import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import { useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
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
    Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";

// axios is unused when using fetch for file upload
// import axios from "axios";
async function fetchWithRetry(
    input: RequestInfo,
    init: RequestInit,
    retries = 2
) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        const res = await fetch(input, { ...init, signal: controller.signal });
        clearTimeout(timeout);
        return res;
    } catch (err) {
        if (retries > 0) return fetchWithRetry(input, init, retries - 1);
        throw err;
    }
}

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
    const isFocused = useIsFocused();

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
        setPhotoUri(null);
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

                const host =
                    "https://apac-app-562528254517.asia-southeast1.run.app";
                //const host = "http://192.168.1.5:5000";
                // Send request using fetch (better file upload support in React Native)

                try {
                    const response = await fetchWithRetry(`${host}/generate`, {
                        method: "POST",
                        body: formData,
                    });

                    // Check if the response status is OK (status code 200-299)
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(
                            `HTTP error! Status: ${response.status}, Body: ${errorText}`
                        );
                        throw new Error(
                            `Server returned an error: ${response.status}`
                        );
                    }

                    // Check if the response is JSON
                    const contentType = response.headers.get("content-type");
                    if (
                        !contentType ||
                        !contentType.includes("application/json")
                    ) {
                        const errorText = await response.text();
                        console.error("Non-JSON response received:", errorText);
                        throw new Error(
                            "Expected JSON response but received something else."
                        );
                    }

                    // Parse the JSON response
                    const data = await response.json();
                    if (!data.response) {
                        console.error(
                            "Response missing 'response' field:",
                            data
                        );
                        throw new Error("Invalid response format from server.");
                    }

                    let raw = data.response;
                    console.log("Raw response:", raw);

                    // Remove the ```json prefix and any ``` suffix
                    raw = raw
                        .replace(/^```json\s*/, "")
                        .replace(/```$/g, "")
                        .trim();

                    // Parse the cleaned JSON
                    const payload = JSON.parse(raw);
                    setResult(payload);
                    setDisease(payload.disease);
                    setRiskLevel(payload.risk_level);
                    setFarmerActions(payload.farmer_actions);
                    console.log("Response:", payload);
                } catch (err) {
                    if (err instanceof Error) {
                        alert(`Fetch failed: ${err.message}`);
                        console.error(
                            "Fetch failed:",
                            err.name,
                            err.message,
                            err
                        );
                    } else {
                        console.error(
                            "Fetch failed with an unknown error:",
                            err
                        );
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            }
            setLoading(false);
        }
    };

    // simplified, minimalistic UI
    return (
        <View style={styles.container}>
            {!result && isFocused && !photoUri && (
                <>
                    <CameraView
                        style={styles.camera}
                        ref={cameraRef}
                        enableTorch
                    />

                    <View style={styles.topBar}>
                        <TextInput
                            style={styles.input}
                            placeholder="What plant is this?"
                            placeholderTextColor="white"
                            onChangeText={setText}
                            value={text}
                        />
                    </View>
                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleScan}
                        >
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            {loading && photoUri && (
                <ImageBackground
                    source={{ uri: photoUri }}
                    style={styles.background}
                >
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                </ImageBackground>
            )}
            {result && photoUri && (
                <ImageBackground
                    source={{ uri: photoUri }}
                    style={styles.background}
                >
                    <View style={styles.resultContainer}>
                        <ScrollView contentContainerStyle={{ padding: 10 }}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Text style={styles.diseaseText}>
                                    Disease: {disease}
                                </Text>
                                <TouchableOpacity
                                    onPress={async () => {
                                        await Clipboard.setStringAsync(disease);
                                        Alert.alert(
                                            "Copied",
                                            "Disease copied to clipboard"
                                        );
                                    }}
                                    style={{ marginLeft: 8 }}
                                >
                                    <MaterialIcons
                                        name="content-copy"
                                        size={20}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text
                                style={[
                                    styles.riskText,
                                    {
                                        color:
                                            risk.toLowerCase() === "high"
                                                ? "#ff3333"
                                                : risk.toLowerCase() ===
                                                  "medium"
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
        marginTop: 50,
        width: "100%",
        padding: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
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
        height: "60%", // Adjust the height as needed
        backgroundColor: "rgba(0,128,0,0.75)", // Green with some transparency
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
