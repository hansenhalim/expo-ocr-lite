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
    val image = InputImage.fromMediaImage(frame.image, 0)

    return try {
      val task = recognizer.process(image)
      val visionText = com.google.android.gms.tasks.Tasks.await(task)

      val result = mutableListOf<Map<String, Any>>()

      for (block in visionText.textBlocks) {
        val blockMap = mutableMapOf<String, Any>()
        blockMap["text"] = block.text
        // blockMap["boundingBox"] = mapOf(
        //   "left" = block.boundingBox?.left ?: 0,
        //   "top" = block.boundingBox?.top ?: 0,
        //   "right" = block.boundingBox?.right ?: 0,
        //   "bottom" = block.boundingBox?.bottom ?: 0
        // )

        val lines = mutableListOf<Map<String, Any>>()
        for (line in block.lines) {
          val lineMap = mutableMapOf<String, Any>()
          lineMap["text"] = line.text
          // lineMap["boundingBox"] = mapOf(
          //   "left" = line.boundingBox?.left ?: 0,
          //   "top" = line.boundingBox?.top ?: 0,
          //   "right" = line.boundingBox?.right ?: 0,
          //   "bottom" = line.boundingBox?.bottom ?: 0
          // )
          lines.add(lineMap)
        }
        blockMap["lines"] = lines
        result.add(blockMap)
      }

      result
    } catch (e: Exception) {
      emptyList<Map<String, Any>>()
    }
  }
}