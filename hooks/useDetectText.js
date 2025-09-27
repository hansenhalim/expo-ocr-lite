import { VisionCameraProxy } from "react-native-vision-camera";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("detectText");

export function detectText(frame) {
  "worklet";
  if (plugin == null) {
    throw new Error("Failed to load Frame Processor Plugin!");
  }
  return plugin.call(frame);
}
