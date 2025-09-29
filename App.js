import { StyleSheet, Dimensions } from "react-native";
import {
  Camera,
  runAsync,
  runAtTargetFps,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import PermissionsPage from "./components/PermissionsPage";
import NoCameraDeviceError from "./components/NoCameraDeviceError";
import { detectText } from "./hooks/useDetectText";

const TARGET_FPS = 1;

export default function App() {
  const device = useCameraDevice("back");
  const { hasPermission } = useCameraPermission();

  if (!hasPermission) return <PermissionsPage />;
  if (device == null) return <NoCameraDeviceError />;

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    runAtTargetFps(TARGET_FPS, () => {
      "worklet";
      runAsync(frame, () => {
        "worklet";
        const textLines = detectText(frame);
        if (textLines && textLines.length > 0) {
          console.log("");
          console.log("");
          console.log("");
          console.log("");
          console.log("");
          console.log("=== Text Detection Results ===");
          textLines.forEach((line, lineIndex) => {
            if (line.text === "NIK") {
              console.log(
                `\x1b[32m    Line ${lineIndex + 1}: "${line.text}"\x1b[0m`
              );
            } else if (line.text === "Nama") {
              console.log(
                `\x1b[31m    Line ${lineIndex + 1}: "${line.text}"\x1b[0m`
              );
            } else {
              console.log(`    Line ${lineIndex + 1}: "${line.text}"`);
            }
          });
          console.log("==============================");
          console.log(`Frame: ${frame.width}x${frame.height}`);
          console.log("");
          console.log("");
          console.log("");
          console.log("");
          console.log("");
        } else {
          console.log("No text detected in frame");
        }
      });
    });
  }, []);

  return (
    <Camera
      frameProcessor={frameProcessor}
      style={styles.camera}
      device={device}
      isActive={true}
      zoom={1.5}
      outputOrientation="preview"
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    marginTop: 200,
    marginLeft: 25,
    width: 300,
    height: 400,
  },
});
