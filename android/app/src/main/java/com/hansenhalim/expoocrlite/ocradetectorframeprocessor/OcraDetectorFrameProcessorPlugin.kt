package com.hansenhalim.expoocrlite.ocradetectorframeprocessor

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.media.Image
import com.googlecode.tesseract.android.TessBaseAPI
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer

class OcraDetectorFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {
  private val context: Context = proxy.context
  private val tessBaseAPI: TessBaseAPI = TessBaseAPI()

  init {
    val tessDataPath = File(context.filesDir, "tesseract")
    val tessDataDir = File(tessDataPath, "tessdata")

    if (!tessDataDir.exists()) {
      tessDataDir.mkdirs()
    }

    val trainedDataFile = File(tessDataDir, "ocra.traineddata")
    if (!trainedDataFile.exists()) {
      copyAssetToInternalStorage("tessdata/ocra.traineddata", trainedDataFile)
    }

    tessBaseAPI.init(tessDataPath.absolutePath, "ocra")
  }

  private fun copyAssetToInternalStorage(assetPath: String, destFile: File) {
    context.assets.open(assetPath).use { input ->
      FileOutputStream(destFile).use { output ->
        input.copyTo(output)
      }
    }
  }

  private fun toGrayscale(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

    for (x in 0 until width) {
      for (y in 0 until height) {
        val pixel = bitmap.getPixel(x, y)
        val r = Color.red(pixel)
        val g = Color.green(pixel)
        val b = Color.blue(pixel)
        val gray = (0.299 * r + 0.587 * g + 0.114 * b).toInt()
        result.setPixel(x, y, Color.rgb(gray, gray, gray))
      }
    }

    return result
  }

  private fun increaseContrast(bitmap: Bitmap, contrast: Float): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val result = Bitmap.createBitmap(width, height, bitmap.config ?: Bitmap.Config.ARGB_8888)

    val factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))

    for (x in 0 until width) {
      for (y in 0 until height) {
        val pixel = bitmap.getPixel(x, y)
        val gray = Color.red(pixel)

        val newGray = ((factor * (gray - 128)) + 128)
          .coerceIn(0f, 255f)
          .toInt()

        result.setPixel(x, y, Color.rgb(newGray, newGray, newGray))
      }
    }

    return result
  }

  private fun otsuBinarization(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

    val histogram = IntArray(256)
    for (x in 0 until width) {
      for (y in 0 until height) {
        val gray = Color.red(bitmap.getPixel(x, y))
        histogram[gray]++
      }
    }

    val totalPixels = width * height
    var sum = 0
    for (i in 0..255) sum += i * histogram[i]

    var sumB = 0
    var wB = 0
    var maxVariance = 0.0
    var threshold = 0

    for (t in 0..255) {
      wB += histogram[t]
      if (wB == 0) continue

      val wF = totalPixels - wB
      if (wF == 0) break

      sumB += t * histogram[t]
      val mB = sumB.toDouble() / wB
      val mF = (sum - sumB).toDouble() / wF
      val variance = wB.toDouble() * wF * (mB - mF) * (mB - mF)

      if (variance > maxVariance) {
        maxVariance = variance
        threshold = t
      }
    }

    for (x in 0 until width) {
      for (y in 0 until height) {
        val gray = Color.red(bitmap.getPixel(x, y))
        result.setPixel(x, y, if (gray <= threshold) Color.BLACK else Color.WHITE)
      }
    }

    return result
  }

  fun extractBlackText(bitmap: Bitmap): Bitmap {
    return bitmap
        .let { toGrayscale(it) }
        .let { increaseContrast(it, 1.5f) }
        .let { otsuBinarization(it) }
  }

  private fun imageToBitmap(image: Image): Bitmap {
    val planes = image.planes
    val yPlane = planes[0]
    val uPlane = planes[1]
    val vPlane = planes[2]

    val yBuffer = yPlane.buffer
    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer

    yBuffer.rewind()
    uBuffer.rewind()
    vBuffer.rewind()

    val ySize = yBuffer.remaining()
    val uSize = uBuffer.remaining()
    val vSize = vBuffer.remaining()

    val nv21 = ByteArray(ySize + uSize + vSize)

    // Copy Y plane
    yBuffer.get(nv21, 0, ySize)

    // NV21 format requires V then U interleaved
    val uvPixelStride = uPlane.pixelStride
    if (uvPixelStride == 1) {
      // Planar format - copy V then U
      vBuffer.get(nv21, ySize, vSize)
      uBuffer.get(nv21, ySize + vSize, uSize)
    } else {
      // Semi-planar format - interleave V and U
      val uvSize = image.width * image.height / 4
      var pos = ySize
      for (i in 0 until uvSize) {
        nv21[pos++] = vBuffer.get(i * uvPixelStride)
        nv21[pos++] = uBuffer.get(i * uvPixelStride)
      }
    }

    val yuvImage = android.graphics.YuvImage(
      nv21,
      android.graphics.ImageFormat.NV21,
      image.width,
      image.height,
      null
    )

    val out = java.io.ByteArrayOutputStream()
    yuvImage.compressToJpeg(
      android.graphics.Rect(0, 0, image.width, image.height),
      100,
      out
    )

    val imageBytes = out.toByteArray()
    return android.graphics.BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
  }

  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
    try {
      val bitmap = imageToBitmap(frame.image)

      val x = (arguments?.get("x") as? Number)?.toInt() ?: 0
      val y = (arguments?.get("y") as? Number)?.toInt() ?: 0
      val width = (arguments?.get("width") as? Number)?.toInt() ?: bitmap.width
      val height = (arguments?.get("height") as? Number)?.toInt() ?: bitmap.height

      val safeX = x.coerceIn(0, bitmap.width - 1)
      val safeY = y.coerceIn(0, bitmap.height - 1)
      val safeWidth = width.coerceIn(1, bitmap.width - safeX)
      val safeHeight = height.coerceIn(1, bitmap.height - safeY)

      val croppedBitmap = Bitmap.createBitmap(bitmap, safeX, safeY, safeWidth, safeHeight)

      val processedBitmap = extractBlackText(croppedBitmap)

      tessBaseAPI.setImage(processedBitmap)

      val text = tessBaseAPI.utF8Text

      return mapOf(
        "text" to (text ?: "")
      )
    } catch (e: Exception) {
      return mapOf(
        "text" to "",
        "error" to e.message
      )
    }
  }
}