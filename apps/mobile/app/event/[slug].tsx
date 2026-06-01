import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function EventDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Event Detail</Text>
        <Text style={styles.subtitle}>{slug}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafafa" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#0a0a0a" },
  subtitle: { fontSize: 16, color: "#737373", marginTop: 8 },
});
