package com.hansenhalim.expoocrlite.textdetectorframeprocessor

import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class TextDetectorFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {

  private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
    val image = InputImage.fromMediaImage(frame.image, 90)

    return try {
      val task = recognizer.process(image)
      val visionText = com.google.android.gms.tasks.Tasks.await(task)

      val result = mutableListOf<Map<String, Any>>()

      for (block in visionText.textBlocks) {
        for (line in block.lines) {
          val lineMap = mutableMapOf<String, Any>()
          lineMap["text"] = line.text

          val bbox = line.boundingBox
          lineMap["bbox"] = mapOf(
            "left" to (bbox?.left ?: 0),
            "top" to (bbox?.top ?: 0),
            "right" to (bbox?.right ?: 0),
            "bottom" to (bbox?.bottom ?: 0)
          )

          lineMap["width"] = bbox?.width() ?: 0
          lineMap["height"] = bbox?.height() ?: 0
          lineMap["angle"] = (line.angle ?: 0.0f).toDouble()

          result.add(lineMap)
        }
      }

      result
    } catch (e: Exception) {
      emptyList<Map<String, Any>>()
    }
  }
}