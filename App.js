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

const BANNED_WORDS = ["NIK", "Nama"];

export default function App() {
  const device = useCameraDevice("back");
  const { hasPermission } = useCameraPermission();

  if (!hasPermission) return <PermissionsPage />;
  if (device == null) return <NoCameraDeviceError />;

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
  ]);

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    runAtTargetFps(TARGET_FPS, () => {
      "worklet";
      runAsync(frame, () => {
        "worklet";
        const textBlocks = detectText(frame);
        let printcount = 0;
        if (textBlocks && textBlocks.length > 0) {
          console.log("");
          console.log("");
          console.log("");
          console.log("");
          console.log("");
          console.log("=== Text Detection Results ===");
          textBlocks.forEach((block, blockIndex) => {
            // console.log(`Block ${blockIndex + 1}:`);
            // console.log(`  Text: "${block.text}"`);

            if (block.lines && block.lines.length > 0) {
              // console.log(`  Lines (${block.lines.length}):`);
              block.lines.forEach((line, lineIndex) => {
                if (printcount > 5) {
                  return;
                }
                if (BANNED_WORDS.includes(line.text)) {
                  return;
                }
                console.log(`    Line ${lineIndex + 1}: "${line.text}"`);
                printcount++;
              });
            }
          });
          console.log("==============================");
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
      format={format}
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
