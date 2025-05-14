// screens/HomeScreen.tsx
import React, { useState, useEffect, use } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Modal,
    Alert,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MaterialIcons } from "@expo/vector-icons";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
// Your first screen

//
// ——— Reusable CircularProgress ——
//
interface CircularProgressProps {
    size?: number;
    strokeWidth?: number;
    progress?: number; // 0–100
    color?: string;
    backgroundColor?: string;
}
interface logItem {
    disease: string;
    fertilizer_applied: string;
    growth_stage: string;
    height_cm: number;
    log_date: string;
    id: number;
    plant: string;
    watered: boolean;
    note: string;
}
const CircularProgress: React.FC<CircularProgressProps> = ({
    size = 80,
    strokeWidth = 8,
    progress = 0,
    color = "#65B04A",
    backgroundColor = "#EEE",
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress / 100);

    return (
        <View style={[styles.chartContainer, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    rotation="-90"
                    originX={size / 2}
                    originY={size / 2}
                    strokeDasharray={`${circumference}, ${circumference}`}
                    strokeDashoffset={offset}
                />
            </Svg>
            {/* Text inside the circle */}
            <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>{`${Math.round(
                    progress
                )}%`}</Text>
            </View>
        </View>
    );
};

//
// ——— HomeScreen Using CircularProgress ——
//
export default function HomeScreen() {
    const [modalVisible, setModalVisible] = useState(false);

    const [cropModalVisible, setCropModalVisible] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
    // State for fetching logs
    const [plantLogs, setPlantLogs] = useState<logItem[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    // State for the journal log modal
    const [plan, setPlan] = useState("");
    const [plant, setPlant] = useState("");
    const [height, setHeight] = useState("");
    const [fertilizer, setFertilizer] = useState("");
    const [disease, setDisease] = useState("");
    const [growthStage, setGrowthStage] = useState("Seedling");
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [note, setNotes] = useState("");
    const [activities, setActivities] = useState({ watered: false });
    const [seeMoreVisible, setSeeMoreVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // State to track text expansion
    const [suggestion, setSuggestion] = useState("");

    const growthStages = [
        "Sprout",
        "Seedling",
        "Vegetative",
        "Budding",
        "Flowering",
    ];

    //display logs
    const getSuggestion = async () => {
        try {
            const response = await fetch(
                `http://192.168.1.5:5000/get_weekly_suggestion`
            );
            const data = await response.json();
            console.log("Fetched suggestion:", data);
            setSuggestion(data.suggestion);
        } catch (error) {
            console.error("Error fetching suggestion:", error);
        }
    };

    const renderLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await fetch(
                `http://192.168.1.5:5000/get_logs?
                )}`
            );
            const data = await res.json();
            console.log("Fetched logs:", data);
            setPlantLogs(data);
        } catch (err) {
            console.error("Error fetching logs:", err);
        } finally {
            setLogsLoading(false);
        }
    };

    useEffect(() => {
        renderLogs();
    }, [selectedCrop]);
    useEffect(() => {
        getSuggestion();
    }, []);
    const handleSave = async () => {
        const logData = {
            plant,
            watered: activities.watered,
            height: parseFloat(height) || null,
            fertilizer: fertilizer, // Example fertilizer
            disease: disease, // Assuming notes contain disease info
            stage: growthStage,
            note: note,
        };

        try {
            const response = await fetch("http://192.168.1.5:5000/post_logs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(logData),
            });

            const result = await response.json();
            if (response.ok) {
                Alert.alert("Success", "Log added successfully!");
                setModalVisible(false);
                renderLogs(); // Refresh logs after saving
            } else {
                Alert.alert("Error", result.error || "Failed to save log.");
            }
        } catch (error) {
            Alert.alert("Error", "An error occurred while saving the log.");
            console.error(error);
        }
    };

    // Fetch logs when a crop is selected and the modal opens

    

    const toggleActivity = (activity: keyof typeof activities) => {
        setActivities((prev) => ({
            ...prev,
            [activity]: !prev[activity],
        }));
    };

    return (
        // Parent View to contain both the ScrollView and the absolute button
        <View style={styles.screenContainer}>
            {/* The ScrollView now fills the available space */}
            <ScrollView style={styles.scrollViewContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={require("../../assets/images/logo.png")}
                        style={styles.logo}
                    />
                </View>

                {/* Farm Info */}
                <View style={styles.farmInfo}>
                    <Text style={styles.farmTitle}>John Doe&#39;s Farm</Text>
                    <Text style={styles.farmDate}>As of May 12, 2025</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {/* Container for the Circular Progress and its label */}
                    

                    {/* Text field with label and paragraph next to the stat */}

                    <View style={styles.infoTextField}>
                        <Text style={styles.infoTextLabel}>For This Week:</Text>
                        <Text
                            style={styles.infoTextParagraph}
                            numberOfLines={isExpanded ? undefined : 3} // Limit to 3 lines if not expanded
                            ellipsizeMode="tail" // Add "..." at the end of truncated text
                        >
                            {suggestion}
                        </Text>
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={() => setIsExpanded(!isExpanded)} // Toggle expansion
                        >
                            <Text style={styles.seeMoreText}>
                                {isExpanded ? "See Less" : "See More"}
                            </Text>
                            <MaterialIcons
                                name={
                                    isExpanded
                                        ? "keyboard-arrow-up"
                                        : "keyboard-arrow-right"
                                }
                                size={16}
                                color="#555"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* My Crops */}
                <Text style={styles.sectionTitle}>Logs</Text>
                {/* Render the logs */}
                {plantLogs.map((log) => (
                    <View key={log.id} style={styles.logItem}>
                        <View style={styles.logCard}>
                            {/* Background Image */}
                            <Image
                                source={{
                                    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS35F4h6aKNT-OejbgDQP7uycsWjQs8UbZVPw&s", // Replace with your image URL
                                }}
                                style={styles.logCardImage}
                            />
                            {/* Overlay Content */}
                            <View style={styles.logCardContent}>
                                <View style={styles.nameDate}>
                                    <Text style={styles.logPlant}>
                                        {log.plant || "None"}
                                    </Text>
                                    <Text style={styles.logCardDate}>
                                        {new Date(
                                            log.log_date
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long", // Use the full month name
                                            day: "numeric",
                                        })}
                                    </Text>
                                </View>

                                <Text style={styles.logText}>
                                    Watered? {log.watered ? "Yes" : "No"}
                                </Text>
                                <Text style={styles.logText}>
                                    Fertilizer Used:{" "}
                                    {log.fertilizer_applied || "None"}
                                </Text>
                                <Text style={styles.logText}>
                                    Disease identified: {log.disease || "None"}
                                </Text>
                                <Text style={styles.logText}>
                                    Note: {log.note || "None"}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Add some padding at the bottom of the ScrollView */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Crop Button - Positioned Absolutely relative to the screenContainer */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <MaterialIcons name="add" size={28} color="white" />
            </TouchableOpacity>

            {/* Journal Log Modal */}

            {/* Crop Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalContainer}>
                        <KeyboardAvoidingView style={styles.modalContent}>
                            <ScrollView
                                contentContainerStyle={{ flexGrow: 1 }}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Modal Header */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        Journal Log
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <MaterialIcons
                                            name="close"
                                            size={24}
                                            color="#555"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Plant Name */}
                                <Text style={styles.modalSectionTitle}>
                                    Plant Name
                                </Text>
                                <TextInput
                                    style={styles.measurementInput}
                                    placeholder="Enter Plant"
                                    value={plant}
                                    onChangeText={setPlant}
                                />

                                {/* Plant Measurements */}
                                <Text style={styles.modalSectionTitle}>
                                    Plant Measurements
                                </Text>
                                <View style={styles.measurementRow}>
                                    <Text style={styles.measurementLabel}>
                                        Height:
                                    </Text>
                                    <TextInput
                                        style={styles.measurementInput}
                                        placeholder="Enter height"
                                        keyboardType="numeric"
                                        value={height}
                                        onChangeText={setHeight}
                                    />
                                    <Text style={styles.measurementUnit}>
                                        cm
                                    </Text>
                                </View>
                                <Text style={styles.modalSectionTitle}>
                                    Fertilizers
                                </Text>
                                <View style={styles.measurementRow}>
                                    <TextInput
                                        style={styles.measurementInput}
                                        placeholder="Enter Fertilizer"
                                        value={fertilizer}
                                        onChangeText={setFertilizer}
                                    />
                                </View>
                                {/* Growth Stage */}
                                <View>
                                    <Text style={styles.modalSectionTitle}>
                                        Growth Stage
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() =>
                                            setDropdownVisible(!dropdownVisible)
                                        }
                                    >
                                        <Text style={styles.dropdownText}>
                                            {growthStage}
                                        </Text>
                                        <MaterialIcons
                                            name={
                                                dropdownVisible
                                                    ? "keyboard-arrow-up"
                                                    : "keyboard-arrow-down"
                                            }
                                            size={20}
                                            color="#2E4F1A"
                                        />
                                    </TouchableOpacity>

                                    {dropdownVisible && (
                                        <View style={styles.dropdown}>
                                            {growthStages.map(
                                                (stage, index) => (
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={[
                                                            styles.dropdownItem,
                                                            growthStage ===
                                                                stage &&
                                                                styles.selectedDropdownItem,
                                                        ]}
                                                        onPress={() => {
                                                            setGrowthStage(
                                                                stage
                                                            );
                                                            setDropdownVisible(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.dropdownItemText,
                                                                growthStage ===
                                                                    stage &&
                                                                    styles.selectedDropdownItemText,
                                                            ]}
                                                        >
                                                            {stage}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )
                                            )}
                                        </View>
                                    )}
                                </View>

                                {/* Plant Activity */}
                                <Text style={styles.modalSectionTitle}>
                                    Plant Activity
                                </Text>
                                <TouchableOpacity
                                    style={styles.activityItem}
                                    onPress={() => toggleActivity("watered")}
                                >
                                    <MaterialIcons
                                        name={
                                            activities.watered
                                                ? "radio-button-checked"
                                                : "radio-button-unchecked"
                                        }
                                        size={20}
                                        color="#555"
                                    />
                                    <Text style={styles.activityText}>
                                        Watered Plant today
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.modalSectionTitle}>
                                    Disease History
                                </Text>
                                <View style={styles.measurementRow}>
                                    <TextInput
                                        style={styles.measurementInput}
                                        placeholder="Enter Disease"
                                        value={disease}
                                        onChangeText={setDisease}
                                    />
                                </View>
                                {/* Notes */}
                                <Text style={styles.modalSectionTitle}>
                                    Notes:
                                </Text>
                                <TextInput
                                    style={styles.notesInput}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Enter your notes here..."
                                    value={note}
                                    onChangeText={setNotes}
                                />

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.saveButtonText}>
                                        Save
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

//
// ——— Styles ——
//
const styles = StyleSheet.create({
    // Existing styles
    screenContainer: {
        flex: 1,
        backgroundColor: "#FEFDE8",
    },
    scrollViewContent: {
        flex: 1,
    },
    header: {
        backgroundColor: "#65B04A",
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: "center",
    },
    logo: {
        width: 120,
        height: 40,
        resizeMode: "contain",
    },
    appName: {
        borderBottomRightRadius: 20,
    },

    farmInfo: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    farmTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#2E4F1A",
    },
    farmDate: {
        color: "#4D4D4D",
    },
    statsRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: "flex-start",
    },
    statAndLabelContainer: {
        alignItems: "center",
        marginRight: 20,
    },
    statItemContent: {
        alignItems: "center",
    },
    chartContainer: {
        alignItems: "center",
        justifyContent: "center",
        margin: 4,
        position: "relative",
    },
    progressTextContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    progressText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#2E4F1A",
    },
    statLabel: {
        fontSize: 12,
        color: "#555",
        textAlign: "center",
        marginTop: 4,
    },
    infoTextField: {
        flex: 1,
        backgroundColor: "transparent",
        padding: 0,
    },
    infoTextLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2E4F1A",
        marginBottom: 5,
    },
    infoTextParagraph: {
        fontSize: 13,
        color: "#2E4F1A",
    },
    seeMoreButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        alignSelf: "flex-end",
    },
    seeMoreText: {
        fontSize: 12,
        color: "#555",
        marginRight: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "#DDD",
        marginHorizontal: 20,
        marginVertical: 20,
    },
    sectionTitle: {
        marginLeft: 20,
        fontSize: 18,
        fontWeight: "600",
        color: "#2E4F1A",
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#2E4F1A",
        marginTop: 15,
        marginBottom: 5,
    },
    dropdownButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#DFFFD6",
        padding: 10,
        borderRadius: 20,
    },
    dropdownText: {
        fontSize: 14,
        color: "#2E4F1A",
    },
    dropdown: {
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
        marginTop: 5,
        padding: 5,
    },
    dropdownItem: {
        padding: 10,
        borderRadius: 8,
    },
    selectedDropdownItem: {
        backgroundColor: "#DFFFD6",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#2E4F1A",
    },
    selectedDropdownItemText: {
        fontWeight: "bold",
    },
    cropCard: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#DDD",
    },
    cropText: {
        flex: 1,
        padding: 15,
    },
    cropName: {
        color: "#2E4F1A",
        fontSize: 18,
        fontWeight: "700",
    },
    cropDate: {
        color: "#4D4D4D",
        fontSize: 12,
        marginTop: 4,
    },
    cropImage: {
        width: 100,
        height: 80,
    },
    addButton: {
        backgroundColor: "#D9534F",
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: 20,
        right: 20,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    // New modal styles
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
        height: "100%",
        padding: 20,
    },
    modalContent: {
        flex: 1,
        backgroundColor: "#FEFDE8",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: "100%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2E4F1A",
    },
    modalDate: {
        color: "#4D4D4D",
        marginBottom: 20,
    },

    modalPlantName: {
        fontSize: 16,
        color: "#2E4F1A",
        fontWeight: "bold",
    },
    measurementRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    measurementLabel: {
        marginRight: 10,
        color: "#555",
    },
    measurementInput: {
        borderBottomWidth: 1,
        borderBottomColor: "#DDD",
        padding: 5,
        minWidth: 60,
        marginRight: 5,
    },
    measurementUnit: {
        color: "#555",
    },
    growthStage: {
        color: "#555",
    },
    activityItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
    },
    activityText: {
        marginLeft: 8,
        color: "#555",
    },
    fertilizerText: {
        color: "#555",
    },
    notesInput: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 8,
        padding: 10,
        textAlignVertical: "top",
        minHeight: 100,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: "#4A8C3E",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    saveButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    logItem: {
        marginBottom: 10,
    },
    logCard: {
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#DDD",
        marginHorizontal: 20,
        backgroundColor: "#FFF",
    },
    logCardImage: {
        width: "100%",
        height: 150,
    },
    logCardContent: {
        position: "absolute", // Make the content overlay the image
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "flex-end", // Align content to the bottom
        padding: 10,
        backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent black background
    },
    logCardDate: {
        fontSize: 14,
        fontWeight: "bold",
        color: "white",
        marginBottom: 5,
    },
    logText: {
        fontSize: 14,
        color: "white",
        marginBottom: 5,
    },
    nameDate: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    logPlant: {
        fontSize: 22,
        fontWeight: "bold",
        color: "white",
        marginBottom: 5,
    },
});
