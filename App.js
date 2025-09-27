import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import PermissionsPage from "./components/PermissionsPage";
import NoCameraDeviceError from "./components/NoCameraDeviceError";
import { detectText } from "./hooks/useDetectText";

export default function App() {
  const device = useCameraDevice("back");
  const { hasPermission } = useCameraPermission();

  if (!hasPermission) return <PermissionsPage />;
  if (device == null) return <NoCameraDeviceError />;

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    // const text = detectText(frame);
    // console.log(`Text in Frame: ${text}`);
    // console.log(`Frame: ${frame.width}x${frame.height} (${frame.pixelFormat})`);
  }, []);

  return (
    <View style={styles.container}>
      <Camera
        frameProcessor={frameProcessor}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
