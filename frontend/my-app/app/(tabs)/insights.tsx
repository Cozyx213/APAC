import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Linking,
    TouchableOpacity,
    RefreshControl,
    Image,
} from "react-native";

type NewsItem = {
    id: number;
    title: string;
    description: string;
    url: string;
    image_url: string;
};

export default function IndexScreen() {
    const [news, setNews] = React.useState<NewsItem[]>([]);
    const [refreshing, setRefreshing] = React.useState(false);

    const host =  "https://apac-app-562528254517.asia-southeast1.run.app";
    //const host = "http://192.168.1.5:5000";
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

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await getNews();
        setRefreshing(false);
    }, []);
    return (<><View style={styles.header}>
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.logo}
                />
            </View>
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["green"]}
                />
            }
        >
          
            <Text style={styles.title}>News AI Summary Analysis</Text>
            {news.map((item) => (
                <View key={item.id} style={styles.newsBlock}>
                    <Text style={styles.newsTitle}>{item.title}</Text>
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
        </ScrollView></>
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
        fontSize: 20,
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
});
