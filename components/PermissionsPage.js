import { Button, StyleSheet, Text, View } from "react-native";
import { useCameraPermission } from "react-native-vision-camera";

export default function PermissionsPage() {
  const { requestPermission } = useCameraPermission();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Izin kamera dibutuhkan untuk melanjutkan.</Text>
      <Button title="Izinkan Kamera" onPress={requestPermission} />
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
    marginBottom: 16,
  },
});
