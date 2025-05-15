import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native";

type Crop = {
    crop: string;
    price: number;
    analysis: string;
};

type CropData = {
    increasing: Crop[];
    decreasing: Crop[];
};

const TopCrops: React.FC = () => {
    const [cropData, setCropData] = useState<CropData>({
        increasing: [],
        decreasing: [],
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    "http://192.168.1.5:5000/get_demand"
                );
                console.log("Response:", response);
                if (!response.ok)
                    throw new Error(`HTTP error! status: ${response.status}`);

                const temp = await response.json();
                // Determine the string payload (handles both temp.response and temp.json keys)
                let payloadStr: string;
                if (temp.response && typeof temp.response === "string") {
                    payloadStr = temp.response;
                } else if (temp.json && typeof temp.json === "string") {
                    payloadStr = temp.json;
                } else {
                    console.error(
                        "Missing 'response' or 'json' string field:",
                        temp
                    );
                    throw new Error("Missing payload field in response");
                }
                // First-level parse
                const firstParse = JSON.parse(payloadStr);
                // If nested 'response' exists, parse again
                const parsedJson =
                    firstParse.response &&
                    typeof firstParse.response === "string"
                        ? JSON.parse(firstParse.response)
                        : firstParse;
                console.log("Parsed JSON:", parsedJson);
                setCropData({
                    increasing: Array.isArray(parsedJson.increasing)
                        ? parsedJson.increasing
                        : [],
                    decreasing: Array.isArray(parsedJson.decreasing)
                        ? parsedJson.decreasing
                        : [],
                });
            } catch (error) {
                console.error("Fetch error:", error);
                setCropData({ increasing: [], decreasing: [] });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    const renderCropSection = (title: string, crops: Crop[], color: string) => (
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
            {crops.map((crop, index) => (
                <View key={index} style={styles.cropCard}>
                    <View style={styles.row}>
                        <Text style={styles.cropName}>
                            {index + 1}. {crop.crop}
                        </Text>
                        <Text style={styles.cropPrice}>
                            Php {crop.price.toFixed(2)}{" "}
                            <Text style={styles.perKilo}>/kilo</Text>
                        </Text>
                    </View>
                    {crop.analysis ? (
                        <View style={styles.analysisContainer}>
                            <Text style={styles.analysisHeader}>
                                🌟 AI Analysis
                            </Text>
                            <Text style={styles.analysisText}>
                                {crop.analysis}
                            </Text>
                        </View>
                    ) : null}
                </View>
            ))}
        </View>
    );
    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.date}>May 16, 2025</Text>
            <Text style={styles.title}>Crop Trend Analysis</Text>

            {renderCropSection(
                "Increasing Demand",
                cropData.increasing,
                "#2e7d32"
            )}
            {renderCropSection(
                "Decreasing Demand",
                cropData.decreasing,
                "#d32f2f"
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f1fce7",
        flex: 1,
    },
    date: {
        color: "#555",
        fontSize: 14,
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2e7d32",
        marginBottom: 16,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    cropCard: {
        backgroundColor: "#d0f0c0",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    cropCardRed: {
        backgroundColor: "red",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cropName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1b5e20",
    },
    cropPrice: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1b5e20",
    },
    perKilo: {
        fontSize: 12,
        color: "#666",
    },
    analysisContainer: {
        backgroundColor: "#b9e4b0",
        padding: 10,
        marginTop: 10,
        borderRadius: 8,
    },
    analysisHeader: {
        fontWeight: "bold",
        color: "#2e7d32",
        marginBottom: 4,
    },
    analysisText: {
        fontSize: 13,
        color: "#333",
    },
    seeMore: {
        alignItems: "flex-end",
        marginTop: 10,
    },
    seeMoreText: {
        color: "#2e7d32",
        fontWeight: "500",
    },
});

export default TopCrops;
