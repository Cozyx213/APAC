import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export default function IndexScreen() {
    const [text, setText] = React.useState("");

  
    const host =  "https://apac-app-562528254517.asia-southeast1.run.app";
    const getNews = async () => {
        try {
            const response = await fetch(`${host}/`);
            const data = await response.json();
            console.log("News data:", data);
            setText(data.message);
        }catch (error) {
            console.error("Error fetching news:", error);
        }
    };
    React.useEffect(() => {
        getNews();
    }, []);
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Home Screen!</Text>
            {text&& (
                            <View style={{alignItems: "center"}}>
                                <Text >{text}</Text>
                               
                            </View>
                        )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
});
