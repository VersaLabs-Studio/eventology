import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Eventology</Text>
        <Text style={styles.subtitle}>App is working!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fafafa" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 32, fontWeight: "800", color: "#0a0a0a" },
  subtitle: { fontSize: 16, color: "#737373", marginTop: 8 },
});
