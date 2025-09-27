import { StyleSheet, Text, View } from "react-native";

export default function NoCameraDeviceError() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Tidak ada perangkat kamera yang tersedia. Coba gunakan perangkat lain
        atau periksa kembali koneksi kamera.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
});
