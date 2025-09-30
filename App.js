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

        /**
         * Determines if line2 is horizontally inline with line1 (anchor) and to the right of the offset
         * @param {Object} line1 - Anchor line object with properties: bbox {left, top, right, bottom}, width, height
         * @param {Object} line2 - Second line object with properties: bbox {left, top, right, bottom}, width, height
         * @param {number} offsetX - Horizontal offset as percentage of line1 width (default: 0)
         * @param {number} offsetY - Vertical offset as percentage of line1 height (default: 0)
         * @param {number} threshold - Vertical overlap threshold (default: 0.5, represents 50% overlap)
         * @returns {boolean} - True if line2 is inline with offset anchor AND to the right of offset
         */
        function isHorizontallyInline(
          line1,
          line2,
          offsetX = 0,
          offsetY = 0,
          threshold = 0.5
        ) {
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
        }

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
              if (
                isHorizontallyInline(anchor, line, 3.4, 1.1, 0.5) //getIdentityName
              ) {
                console.log(line.text);
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
