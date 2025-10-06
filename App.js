import { StyleSheet, Dimensions } from "react-native";
import {
  Camera,
  runAsync,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import PermissionsPage from "./components/PermissionsPage";
import NoCameraDeviceError from "./components/NoCameraDeviceError";
import { detectText } from "./hooks/useDetectText";
import { detectOcra } from "./hooks/useDetectOcra";

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

        const isHorizontallyInline = (
          line1,
          line2,
          offsetX = 0,
          offsetY = 0,
          threshold = 0.5
        ) => {
          const bbox1 = line1.bbox;
          const bbox2 = line2.bbox;
          const width1 = line1.width;
          const height1 = line1.height;

          // Calculate the offset position
          const offsetXPosition = bbox1.left + offsetX * width1;

          // Check if bbox2 is to the right of the offset position
          if (bbox2.left < offsetXPosition) {
            return false;
          }

          // Apply relative offset to bbox1 to create adjusted anchor position
          const adjustedBbox1 = {
            left: bbox1.left + offsetX * width1,
            top: bbox1.top + offsetY * height1,
            right: bbox1.right + offsetX * width1,
            bottom: bbox1.bottom + offsetY * height1,
          };

          // Calculate the height of each bbox
          const adjustedHeight1 = adjustedBbox1.bottom - adjustedBbox1.top;
          const height2 = line2.height;

          // Calculate vertical overlap
          const overlapTop = Math.max(adjustedBbox1.top, bbox2.top);
          const overlapBottom = Math.min(adjustedBbox1.bottom, bbox2.bottom);
          const overlapHeight = Math.max(0, overlapBottom - overlapTop);

          // Check if there's significant vertical overlap
          const minHeight = Math.min(adjustedHeight1, height2);
          const overlapRatio = overlapHeight / minHeight;

          return overlapRatio >= threshold;
        };

        const isIdentityNumber = (anchor, line) => {
          return isHorizontallyInline(anchor, line, 1);
        };

        const isIdentityName = (anchor, line) => {
          return isHorizontallyInline(anchor, line, 2.6, 1.3);
        };

        const lines = detectText(frame);
        if (lines && lines.length > 0) {
          console.log("");
          console.log("");
          console.log("=== Text Detection Results ===");
          const anchor = lines.find((line) => line.text === "NIK");
          if (anchor) {
            console.log(anchor);
            lines.forEach((line) => {
              // console.log(line);
              if (isIdentityNumber(anchor, line)) {
                console.log("Identity Number Found:", line.text);

                // Crop the frame to the identity number bbox
                const bbox = line.bbox;
                const x = Math.max(0, Math.floor(bbox.left));
                const y = Math.max(0, Math.floor(bbox.top));
                const width = Math.min(Math.floor(line.width), frame.width - x);
                const height = Math.min(
                  Math.floor(line.height),
                  frame.height - y
                );

                // Process the cropped region with OCRA detection
                const ocraResult = detectOcra(frame, { x, y, width, height });
                if (ocraResult) {
                  console.log("OCRA Detection Result:", ocraResult);
                }
              }
              if (isIdentityName(anchor, line)) {
                console.log("Identity Name Found:", line.text);
              }
            });
          }
          console.log("==============================");
          console.log(`Frame: ${frame.width}x${frame.height}`);
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
