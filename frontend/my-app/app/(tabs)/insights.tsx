import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Linking,
    TouchableOpacity,
    Image,
} from "react-native";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
type NewsItem = {
    id: number;
    title: string;
    description: string;
    url: string;
    image_url: string;
};

export default function IndexScreen() {
    const [news, setNews] = React.useState<NewsItem[]>([]);

    //const host =  "https://apac-app-562528254517.asia-southeast1.run.app";
    const host = "http://192.168.1.12:5000";
    const getNews = async () => {
        try {
            const response = await fetch(`${host}/get_news`);
            const data = await response.json();
            console.log("News data:", data);
            setNews(data);
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    };
    React.useEffect(() => {
        getNews();
    }, []);
    const imgUrl =
        "https://www.da.gov.ph/wp-content/uploads/2025/05/p20-rice-rollout_11-2048x1326.jpg";

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>News AI Summary Analysis</Text>
            {news.map((item, index) => (
                <View key={index} style={styles.newsBlock}>
                    <Text style={styles.newsTitle}>{item.title}</Text>
                    {/* <Image source={{ uri: item.image }} style={{ width: 200, height: 200, borderRadius: 10 }} /> */}
                    {/* <Text style={styles.newsText}>{item.image}</Text> */}
                    <Text style={styles.newsText}>{item.description}</Text>
                    <Image
                        source={{ uri: item.image_url }}
                        style={{ height: 200, borderRadius: 10 }}
                    />

                    <TouchableOpacity
                        style={styles.newsUrlButton}
                        onPress={() => Linking.openURL(item.url)}
                    >
                        <Text style={styles.readMore}>Read More</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    newsBlock: {
        backgroundColor: "#E2EEC8", // Green background for the block
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    newsTitle: {
        fontSize: 16,
        color: "green", // White text for contrast
        marginBottom: 5,

        fontWeight: "bold",
    },
    newsText: {
        fontSize: 16,
        color: "green", // White text for contrast
       
    },
    readMore: {
        fontSize: 14,
        color: "white", // Light green for the URL
    },
    newsUrlButton: {
        backgroundColor: "green",
        padding: 12,
        margin: 10,
        borderRadius: 8,
        alignItems: "center",
    },
});
