import { VisionCameraProxy } from "react-native-vision-camera";

const plugin = VisionCameraProxy.initFrameProcessorPlugin("detectOcra");

export function detectOcra(frame, options = {}) {
  "worklet";
  if (plugin == null) {
    throw new Error("Failed to load Frame Processor Plugin!");
  }
  return plugin.call(frame, options);
}
