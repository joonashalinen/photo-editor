
import React from "react";
import Canvas from "./Canvas.js";
import ToolsMenu from "./ToolsMenu.js";
import Upload from "./Upload.js" ;
import Jimp from "jimp/es";
import Cropper from "cropperjs";
import Konva from "konva";
import CanvasFreeDrawing from "./CanvasFreeDrawing.js";
import Colors from "./Colors.js";
import EffectSlider from "./EffectSlider.js";
import TextField from "./TextField.js";
import { Input, Button, Tooltip } from "antd";
import { RotateRightOutlined } from "@ant-design/icons"
import '@simonwep/pickr/dist/themes/nano.min.css';
import "./PhotoEditor.css";
import iro from '@jaames/iro';
import UndoRedo from "./UndoRedo.js"
import DropdownMenu from "./DropdownMenu.js";

class PhotoEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      image: props.image ? props.image : "",
      numberOfTextFields: 0,
      showAcceptCancelMenu: false,
      drawingLineWidth: 3
    }
    this.imageFilters = {
      contrast: 0,
      brightness: 0,
      saturation: 0
    }
    this.colors = new Colors();
    this.activeTransformers = [];
    this.reattachTextAnchorList = [];
    this.imageInstanced = false;

    this.inCropMode = false;
    this.texts = [];

    this.selectedFont = "Impact";
    this.fonts = ["Impact", "Calibri", "Arial"];

    this.offsetX = 0;
    this.offsetY = 0;

    this.offsetLeftOriginX = 0;
    this.offsetLeftOriginY = 0;

    this.undoRedoLib = new UndoRedo(this);

    this.Konva = Konva;
  }

  initKonva() {
    var stage = new Konva.Stage({
      container: 'overlayCanvasContainer',
      width: document.getElementById("canvas").clientWidth,
      height: document.getElementById("canvas").clientHeight
    });

    console.log(document.getElementById("canvas").clientWidth)

    var layer = new Konva.Layer();

    stage.add(layer);

    this.layer = layer;
    this.stage = stage;

    document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    document.getElementById("overlayCanvasContainer").firstElementChild.style.position = `absolute`;

    this.konvaReady = true;

    this.konvaJsContent = document.getElementById("overlayCanvasContainer").firstElementChild;

  }

  undo() {
    this.undoRedoLib.undoRedo("undo");
  }

  redo() {
    this.undoRedoLib.undoRedo("redo")
  }

  applyEffects() {

    var canvas = document.getElementById("canvas")

    var ctx = canvas.getContext("2d");

    var image = this.originalImage.clone();

    for (var filter in this.imageFilters) {
      if (this.imageFilters[filter]) {
        if (filter === "saturation") continue;
        image[filter](this.imageFilters[filter]);
      }
    }

    var imageData = new ImageData(Uint8ClampedArray.from(image.bitmap.data), image.bitmap.width);

    this.colors.saturate(imageData, 1 + this.imageFilters.saturation);

    ctx.putImageData(imageData, 0, 0);

  }

  contrast(value) {
    this.imageFilters.contrast = value / 100;
    this.applyEffects();
  }

  saturate(value) {

    this.imageFilters.saturation = value / 100;
    this.applyEffects();

  }

  brightness(value) {
    this.imageFilters.brightness = value / 100;
    this.applyEffects();
  }

  zoom = (e) => {

    e.preventDefault();

    console.log(e.offsetX, e.offsetY)

    var factor = e.deltaY < 0 ? 1 : -1
    var zoomConstant = 0.05 * factor;

    var canvas = document.getElementById("canvas");
    var drawingCanvas = document.getElementById("drawingCanvas");
    var konvaCanvas = document.getElementById("overlayCanvasContainer").firstElementChild;


    this.scale += zoomConstant;


    var offsetLeftOriginX = canvas.width * zoomConstant / 2;
    var offsetLeftOriginY = canvas.height * zoomConstant / 2;

    this.offsetLeftOriginX += offsetLeftOriginX;
    this.offsetLeftOriginY += offsetLeftOriginY

    var x = e.offsetX;
    var y = e.offsetY;

    var newX = 1.05 * x;
    var newY = 1.05 * y;

    this.offsetX += (newX - x) * -1 * factor;
    this.offsetY += (newY - y) * -1 * factor;

    if (this.cfd) {
      this.cfd.cssTransformScale = this.scale;
      console.log(this.offsetLeftOriginX, this.offsetLeftOriginY, this.offsetX, this.offsetY)
      this.cfd.cssTransformOffsetX = this.offsetX;
      this.cfd.cssTransformOffsetY = this.offsetY;
      this.cfd.cssTransformOffsetLeftOriginX = this.offsetLeftOriginX;
      this.cfd.cssTransformOffsetLeftOriginY = this.offsetLeftOriginY;
    }

    canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    konvaCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

  }

  async changeImage(buffer) {

    if (!this.imageInstanced) {

      document.getElementById("saveImageButton").addEventListener("click", () => {
        this.exportImage();
      });

      document.getElementById("canvasesContainer").addEventListener("wheel", this.zoom);

      document.getElementById("canvasesContainer").addEventListener("mousedown", () => {
        this.beginDragMode();
      });

      this.canvas = document.getElementById("canvas");
      this.drawingCanvas = document.getElementById("drawingCanvas");

    }

    this.imageInstanced = true;

    console.log(buffer);

    var image = await Jimp.read(buffer);

    var canvas = document.getElementById("canvas");

    canvas.height = image.bitmap.height;
    canvas.width = image.bitmap.width;

    var ctx = canvas.getContext("2d");

    var canvasContainer = canvas.parentElement;

    var imageRatio = image.bitmap.width / image.bitmap.height;
    var canvasRatio = canvasContainer.clientWidth / canvasContainer.clientHeight;

    var scale = imageRatio > canvasRatio ?
      (canvasContainer.clientWidth / image.bitmap.width) : canvasContainer.clientHeight / image.bitmap.height;

    if (canvasContainer.clientWidth >= image.bitmap.width && canvasContainer.clientHeight >= image.bitmap.height) {
      scale = 1;
    }

    this.scale = scale;
    this.nativeScale = scale;

    canvas.style.transform = `scale(${scale})`;

    var imageData = new ImageData(Uint8ClampedArray.from(image.bitmap.data), image.bitmap.width);
    ctx.putImageData(imageData, 0, 0);

    this.image = image.clone();
    this.originalImage = image;

    this.originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    this.currentImageData = imageData;

    this.enableDrawingColorPicker();
    this.enableDrawing();

    this.focusCanvasContainer("canvasContainer");

  }

  addText() {

    this.focusCanvasContainer("overlayCanvasContainer")

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.getKonvaUndoRedo());

    var layer = this.layer;

    console.log(this.layer.offsetX() + (this.offsetX  / this.scale) + (this.offsetLeftOriginX / this.scale))

    console.log(this.scale, this.nativeScale)

    var scaleOffsetX = this.originalImageData.width * (this.scale - this.nativeScale) / this.scale / 2;
    var scaleOffsetY = this.originalImageData.height * (this.scale - this.nativeScale) / this.scale / 2;

    var zoomOffsetLeftOriginX = this.offsetLeftOriginX / this.scale * -1;
    var zoomOffsetLeftOriginY = this.offsetLeftOriginY / this.scale * -1;

    var zoomOffsetX = this.offsetX / this.scale * -1;
    var zoomOffsetY = this.offsetY / this.scale * -1;

    if (this.nativeScale > this.scale) {
      scaleOffsetX = scaleOffsetY = zoomOffsetLeftOriginX = zoomOffsetLeftOriginY = zoomOffsetX = zoomOffsetY = 0;
    }

    var text = new Konva.Text({
      x: this.layer.offsetX() + scaleOffsetX + zoomOffsetLeftOriginX + zoomOffsetX,
      y: this.layer.offsetY() + scaleOffsetY + zoomOffsetLeftOriginY + zoomOffsetY,
      text: 'Simple Text',
      fontSize: 70,
      fontFamily: this.selectedFont,
      fill: this.selectedTextColor.hexString,
      draggable: true
    });

    console.log(text.x(), text.y(), this.layer.offsetX(), this.layer.offsetY(), this.offsetX, this.offsetY)

    text.x(text.x() < this.layer.offsetX() ? this.layer.offsetX() : text.x());
    text.y(text.y() < this.layer.offsetY() ? this.layer.offsetY() : text.y());

    text.on("mousedown", (e) => {
      e.evt.cancelBubble = true
    })

    text.on("dragstart", (e) => {
      this.undoRedoLib.addToUndoCache(this.undoRedoLib.getKonvaUndoRedo());
    });

    layer.add(text);

    var transformer = new Konva.Transformer({
      nodes: [text],
      rotateAnchorOffset: 60,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    })

    transformer.on("mousedown", (e) => {
      e.evt.cancelBubble = true
      this.undoRedoLib.addToUndoCache(this.undoRedoLib.getKonvaUndoRedo());
    })

    layer.add(transformer);

    text.text("Add text")

    layer.draw();

    document.getElementById("overlayCanvasContainer").style.pointerEvents = "auto"

    this.activeTransformers.push(transformer);

    return text;
  }

  beginDragMode() {

    if (this.state.selectedTool === "draw" || this.state.selectedTool === "erase") return;

    var canvasesContainer = document.getElementById("canvasesContainer");

    this.dragModeEventHandler = (e) => {

      this.offsetX += e.movementX;
      this.offsetY += e.movementY;

      this.canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      if (this.konvaReady) this.konvaJsContent.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }

    canvasesContainer.addEventListener("mousemove", this.dragModeEventHandler)

    canvasesContainer.addEventListener("mouseup", () => {
      this.endDragMode();
    })

    canvasesContainer.addEventListener("mouseout", () => {
      this.endDragMode();
    })
  }

  endDragMode() {
    document.getElementById("canvasesContainer").removeEventListener("mousemove", this.dragModeEventHandler);
  }

  rotateCanvas(canvas) {

    var canvasCtx = canvas.getContext("2d");

    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

    canvas.height = canvas.width;
    canvas.width = tempCanvas.height;

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.save();
    canvasCtx.translate(canvas.width / 2, canvas.height / 2)
    canvasCtx.rotate(90 * Math.PI / 180);
    canvasCtx.translate(canvas.width / -2, canvas.height / -2)
    canvasCtx.drawImage(tempCanvas, (tempCanvas.height - tempCanvas.width) / 2, (tempCanvas.width - tempCanvas.height) / 2);
    canvasCtx.restore();

  }

  rotateCanvasSize(canvas) {

    var canvasCtx = canvas.getContext("2d");

    var tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

    canvas.height = canvas.width;
    canvas.width = tempCanvas.height;

    canvasCtx.drawImage(tempCanvas, (tempCanvas.height - tempCanvas.width) / 2, (tempCanvas.width - tempCanvas.height) / 2);

  }



  async rotate() {

    this.undoRedoLib.prepareFullClone("rotate", "undo");

    this.rotateCanvas(this.canvas);
    this.rotateCanvasSize(this.drawingCanvas);
    if (this.state.selectedTool === "erase") this.enableDrawingEraser();

    if (this.konvaReady) {
      this.stage.width(this.canvas.width);
      this.stage.height(this.canvas.height);
    }

    this.originalImage.rotate(-90);

    var canvasContainer = this.canvas.parentElement;

    var imageRatio = this.canvas.width / this.canvas.height;
    var canvasRatio = canvasContainer.clientWidth / canvasContainer.clientHeight;

    var scale = imageRatio > canvasRatio ?
      (canvasContainer.clientWidth / this.canvas.width) : canvasContainer.clientHeight / this.canvas.height;

    if (canvasContainer.clientWidth >= this.canvas.width && canvasContainer.clientHeight >= this.canvas.height) {
      scale = 1;
    }

    this.scale = scale;

    var transformString = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    this.canvas.style.transform = transformString;
    this.drawingCanvas.style.transform = transformString;
    if (this.konvaReady) this.konvaJsContent.style.transform = transformString;

  }

  getTexts() {
    return this.layer.nodes();
  }

  updateText(text, value) {
    this.undoRedoLib.addToUndoCache(this.layer.clone(), "konva")
    text.text(value)
    this.layer.draw();
  }

  deleteText(text) {

    var [transformer] = this.activeTransformers.filter((transformer) => {
      var textNode = transformer.nodes()[0];
      if (textNode === text) return true;
    });

    transformer.detach();

    text.destroy();
    this.layer.draw();
  }

  removeAllAnchors() {

    console.log("removing anchors")

    if (!this.layer || !this.stage) return;

    for (var i = 0; i < this.activeTransformers.length; i++) {
      this.reattachTextAnchorList.push([this.activeTransformers[i], this.activeTransformers[i].nodes()])
      this.activeTransformers[i].detach();
    }

    this.activeTransformers = [];

    this.layer.draw();

  }

  readdAllAnchors() {

    console.log("readding anchors")

    for (var i = 0; i < this.reattachTextAnchorList.length; i++) {
      var attachPair = this.reattachTextAnchorList[i];
      attachPair[0].nodes(attachPair[1]);
      this.activeTransformers.push(attachPair[0]);
    }

    this.reattachTextAnchorList = [];

    this.layer.draw();
  }

  cloneKonvaStage() {

    var stage = new Konva.Stage({
      container: document.createElement("div"),
      width: document.getElementById("canvas").clientWidth,
      height: document.getElementById("canvas").clientHeight
    });

    console.log(document.getElementById("canvas").clientWidth)

    var layer = new Konva.Layer();

    stage.add(layer);

    var textNodes = this.layer.getChildren();

    textNodes.each((textNode, n) => {
      layer.add(textNode);
    });

    console.log(stage)

    return stage;

  }

  beginCrop() {

    this.focusCanvasContainer("canvasContainer");

    document.getElementById("drawingCanvasContainer").style.visibility = "hidden";
    document.getElementById("overlayCanvasContainer").style.visibility = "hidden";

    var canvas = document.getElementById("canvas");

    var ctx = document.getElementById("canvas").getContext("2d");

    var imageData = ctx.getImageData(0, 0, canvas.clientWidth, canvas.clientHeight);

    var originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    ctx.drawImage(document.getElementById("drawingCanvas"), 0, 0);
    ctx.drawImage(this.stage.toCanvas(), 0, 0);

    this.beforeCropImageData = originalImageData;

    var cropper = new Cropper(canvas, {
      crop(event) {
      },
    });

    this.cropper = cropper;
  }

  endCrop() {
    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.putImageData(this.beforeCropImageData, 0, 0);

    document.getElementById("drawingCanvasContainer").style.visibility = "visible";
    document.getElementById("overlayCanvasContainer").style.visibility = "visible";

    this.cropper.destroy();
  }

  getCroppedCanvas(cropData, id) {

    var canvas = document.getElementById(id);

    var ctx = canvas.getContext("2d");

    var croppedImageData = ctx.getImageData(cropData.x, cropData.y, cropData.width, cropData.height);

    var croppedCanvas = canvas;
    croppedCanvas.width = cropData.width;
    croppedCanvas.height = cropData.height;
    croppedCanvas.id = id;

    ctx = croppedCanvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(croppedImageData, 0, 0);

    return croppedCanvas;
  }

  async acceptCrop() {

    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.putImageData(this.beforeCropImageData, 0, 0);

    this.undoRedoLib.prepareFullClone("crop", "undo");

    var cropData = this.cropper.getData();

    var croppedImageData = ctx.getImageData(cropData.x, cropData.y, cropData.width, cropData.height);

    var croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropData.width;
    croppedCanvas.height = cropData.height;

    ctx = croppedCanvas.getContext("2d");

    ctx.putImageData(croppedImageData, 0, 0);

    croppedCanvas.toBlob((blob) => {
      blob.arrayBuffer().then(async (buffer) => {

        await this.changeImage(buffer);

        this.layer.offsetX(Math.floor(this.layer.offsetX() + cropData.x));
        this.layer.offsetY(Math.floor(this.layer.offsetY() + cropData.y));

        this.stage.size({
          width: Math.floor(cropData.width),
          height: Math.floor(cropData.height)
        })

        this.layer.draw();

        var croppedDrawingCanvas = this.getCroppedCanvas(cropData, "drawingCanvas");

        document.getElementById("drawingCanvasContainer").firstElementChild.remove();
        document.getElementById("drawingCanvasContainer").appendChild(croppedDrawingCanvas);

        document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `scale(${this.scale})`;
        document.getElementById("drawingCanvas").style.transform = `scale(${this.scale})`;

        document.getElementById("drawingCanvasContainer").style.visibility = "visible";
        document.getElementById("overlayCanvasContainer").style.visibility = "visible";

        this.cropper.destroy();

      })
    });

  }

  enableDrawing() {

    var checkIfAnyUndo = () => {

      var undoCache = this.undoRedoLib.getUndoCache();

      for (var i = 0; i < undoCache.length; i++) {
        var cacheItem = undoCache[i];
        if (cacheItem.type === "drawingCanvas") return true;
      }

      return false;

    }

    this.focusCanvasContainer("drawingCanvasContainer");

    if (this.cfd) {
      return;
    }

    const cfd = new CanvasFreeDrawing({
      elementId: 'drawingCanvas',
      width: document.getElementById("canvas").clientWidth,
      height: document.getElementById("canvas").clientHeight,
      backgroundColor: [0,0,0,0]
    });

    cfd.setLineWidth(this.state.drawingLineWidth);
    cfd.setStrokeColor([this.selectedDrawingColor.red, this.selectedDrawingColor.green, this.selectedDrawingColor.blue]);

    var redrawCounter = 0;

    cfd.on({ event: 'redraw' }, () => {
      if (!checkIfAnyUndo() || this.drawToolWasJustSelected || redrawCounter % 100 === 0) {
        this.drawToolWasJustSelected = false;
        this.undoRedoLib.addToUndoCache(this.undoRedoLib.cloneCanvas(this.drawingCanvas), "drawingCanvas")
        console.log("added drawing to undo cache")
      }
      redrawCounter++;
    });

    cfd.on({ event: 'mousedown' }, () => {
      if (!checkIfAnyUndo() || this.drawToolWasJustSelected || redrawCounter % 100 === 0) {
        this.undoRedoLib.addToUndoCache(this.undoRedoLib.cloneCanvas(this.drawingCanvas), "drawingCanvas")
        console.log("added drawing to undo cache")
      }
      redrawCounter++;
    });

    cfd.on({ event: 'mouseup' }, () => {
      this.undoRedoLib.addToUndoCache(this.undoRedoLib.cloneCanvas(this.drawingCanvas), "drawingCanvas")
      console.log("added drawing to undo cache")
      redrawCounter++;
    });

    this.cfd = cfd;

    document.getElementById("drawingCanvas").style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    this.cfd.cssTransformScale = this.scale;
    this.cfd.cssTransformNativeScale = this.nativeScale;
    this.cfd.cssTransformOriginalImageWidth = this.originalImageData.width;
    this.cfd.cssTransformOriginalImageHeight = this.originalImageData.height;



  }

  disableDrawing() {

  }

  changeDrawingColor(color) {

    this.selectedDrawingColor = color;
    this.cfd.setStrokeColor([color.red, color.green, color.blue])

  }

  setDrawingLineWidth(value) {
    if (this.cfd) this.cfd.setLineWidth(value);
    this.setState({
      drawingLineWidth: value
    });
  }

  enableDrawingEraser() {
    if (this.cfd) this.cfd.enableEraseMode();
  }

  disableDrawingEraser() {
    if (this.cfd) this.cfd.disableEraseMode();
  }

  eraseAllDrawing() {

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.cloneCanvas(this.drawingCanvas), "drawingCanvas");
    this.drawingCanvas.getContext("2d").clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

  }

  getDefaultColorPicker(id) {
    return new iro.ColorPicker(id, {
      width: 75,
      color: "#f00",
      layout: [
        {
          component: iro.ui.Box,
          options: {}
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'hue'
          }
        },
      ],
      sliderSize: 10,
      padding: 0
    })
  }

  enableDrawingColorPicker() {
    if (this.drawingColorPicker) return;
    this.drawingColorPicker = this.getDefaultColorPicker("#drawing-color-picker");
    this.drawingColorPicker.on("color:change", (color) => {
      this.selectedDrawingColor = color;
      document.getElementById("drawing-color-picker-button").style.backgroundColor = color.rgbaString;
      this.changeDrawingColor(color)
    })
    this.selectedDrawingColor = this.drawingColorPicker.color;
  }

  enableTextColorPicker() {
    if (this.textColorPicker) return;
    this.textColorPicker = this.getDefaultColorPicker("#text-color-picker");
    this.textColorPicker.on("color:change", (color) => {
      this.selectedTextColor = color;
      document.getElementById("text-color-picker-button").style.backgroundColor = color.rgbaString;
    });
    this.selectedTextColor = this.textColorPicker.color;
  }

  showColorPicker(id) {

    document.getElementById(id).style.visibility = "visible";
    document.getElementById(id).style.opacity = 1;

    setTimeout(() => {

      function hideColorPickerHandler(e) {

        if (e.target.id === id) return;

        var parentElement = e.target.parentElement;

        while (true) {
          if (!parentElement) {
            break;
          }
          console.log(parentElement)
          if (parentElement.id === id) {
            return;
          }
          parentElement = parentElement.parentElement;
        }

        document.getElementById(id).style.opacity = 0;
        setTimeout(() => {
          document.getElementById(id).style.visibility = "hidden";
        }, 300);

        window.removeEventListener("click", hideColorPickerHandler)

      }

      window.addEventListener("click", hideColorPickerHandler);

    }, 100);

  }

  focusCanvasContainer(id) {
    document.getElementById("canvasContainer").style.pointerEvents = id === "canvasContainer" ? "auto" : "none";
    document.getElementById("drawingCanvasContainer").style.pointerEvents = id === "drawingCanvasContainer" ? "auto" : "none";
    document.getElementById("overlayCanvasContainer").style.pointerEvents = id === "overlayCanvasContainer" ? "auto" : "none";
  }

  exportImage() {

    console.log(this.state.selectedTool)

    if (this.state.selectedTool === "addText") this.removeAllAnchors();

    var canvas = document.getElementById("canvas");

    var ctx = document.getElementById("canvas").getContext("2d");

    var imageData = ctx.getImageData(0, 0, canvas.clientWidth, canvas.clientHeight);

    var originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    var downloadCanvas = document.createElement("canvas");
    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;

    var downloadCtx = downloadCanvas.getContext("2d");

    downloadCtx.putImageData(imageData, 0, 0);

    downloadCtx.drawImage(document.getElementById("drawingCanvas"), 0, 0);
    if (this.stage) downloadCtx.drawImage(this.stage.toCanvas(), 0, 0);

    if (this.state.selectedTool === "addText") this.readdAllAnchors();

    download(downloadCanvas, "image.png")

    function download(canvas, filename) {

      var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");

      var lnk = document.createElement('a');
      lnk.download = filename;

      lnk.href = canvas.toDataURL("image/png;base64");

      lnk.click();

    }
  }

  removeImageInstance() {

    if (!this.imageInstanced) return;

    var canvas = document.getElementById("canvas");
    var drawingCanvas = document.getElementById("drawingCanvas");

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx = drawingCanvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.konvaReady) {

      document.getElementById("overlayCanvasContainer").firstElementChild.remove();

      this.stage = false;
      this.layer = false;
      this.konvaReady = false;

    }

    this.cfd = false;

    this.texts = [];
    this.setState({
      numberOfTexts: 0
    })

    this.offsetX = 0;
    this.offsetY = 0;

    this.offsetLeftOriginX = 0;
    this.offsetLeftOriginY = 0;

    this.activeTransformers = [];
    this.reattachTextAnchorList = [];
    this.imageInstanced = false;

    this.undoRedoLib.clearRedoCache();
    this.undoRedoLib.clearUndoCache();

  }

  focusTool(tool) {
    var toolContainers = {
      crop: "canvasContainer",
      addText:"overlayCanvasContainer",
      draw: "drawingCanvasContainer"
    }
    this.focusCanvasContainer(toolContainers[tool]);
  }

  render() {

    setTimeout(() => {
      console.log("asdd");
    }, 5000)

    var toolFunctions = {
      beginDrawing: this.beginDrawing,
      enableDrawing: this.enableDrawing,
      beginCrop: this.beginCrop,
      endCrop: this.endCrop,
      acceptCrop: this.acceptCrop,
      addText: this.addText,
      updateText: this.updateText,
      exportImage: this.exportImage,
      contrast: this.contrast,
      brightness: this.brightness,
      saturate: this.saturate,
      removeAnchors: this.removeAnchors,
      removeAllAnchors: this.removeAllAnchors,
      deleteText: this.deleteText,
      focusTool: this.focusTool
    }

    var acceptedImageTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg",
      "x-icon/svg",
      "image/tiff",
      "image/bmp",
      "image/gif"
    ]

    var callToolFunction = (functionName, args) => {
      if (!this.konvaReady) this.initKonva();
      return this[functionName].apply(this, args);
    }

    return (
      <div id="mainContainer" className="mainContainer">
        <div className="upperRow" style={{position: "relative"}}>
          <Upload onUpload={(file) => {
            if (!acceptedImageTypes.includes(file.type)) return;
            this.removeImageInstance();
            file.arrayBuffer().then(buffer => {
              this.changeImage(buffer);
            });
            this.setState({
              uploadFileList: []
            })
          }}
          accept="image/png,image/jpeg,image/jpg"
          showUploadList={{showPreviewIcon: false}}
          fileList={this.state.uploadFileList}/>
          <img className="toolIcon undoRedoButton" src="redo.svg" height="18px" style={{position: "absolute", bottom: "0px", marginRight: "10px"}} onClick={() => {
            this.redo();
          }}></img>
          <img className="toolIcon undoRedoButton" src="redo.svg" height="18px" style={{position: "absolute", bottom: "0px", marginRight: "34px", transform: "scaleX(-1)"}} onClick={() => {
            this.undo();
          }}></img>
        </div>
        <div className="canvasTools">
          <div id="canvasesContainer" className="canvasesContainer">
            <Canvas id="canvas" containerId="canvasContainer"/>
            <Canvas id="drawingCanvas" containerId="drawingCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            <Canvas id="overlayCanvas" containerId="overlayCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
          </div>
          <div id="tools" className="toolsMenuContainer">
            <EffectSlider min={-100} max={100} defaultValue={0} title="Contrast" onChange={(value) => {
              callToolFunction("contrast", [value])
            }}/>
            <EffectSlider min={-100} max={100} defaultValue={0} title="Brightness" onChange={(value) => {
              callToolFunction("brightness", [value])
            }}/>
            <EffectSlider min={-100} max={100} defaultValue={0} title="Saturation" onChange={(value) => {
              callToolFunction("saturate", [value])
            }}/>
            <div className="toolIcons">
              <Tooltip title="Crop">
                <div className={`toolIconContainer${this.state.selectedTool === "crop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                  if (this.state.selectedTool === "crop") return;
                  if (this.state.selectedTool === "addText") callToolFunction("removeAllAnchors", [])
                  callToolFunction("focusTool", ["crop"])
                  this.setState({
                    showAcceptCancelMenu: true,
                    selectedTool: "crop",
                    inCropMode: true
                  });
                  callToolFunction("beginCrop", [])
                }}>
                  <img className="toolIcon" src="crop-alt.svg" width="24px"></img>
                </div>
              </Tooltip>
              <Tooltip title="Add Text">
                <div className={`toolIconContainer${this.state.selectedTool === "addText" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                  if (this.state.selectedTool === "addText") return;
                  if (this.state.selectedTool === "crop") callToolFunction("endCrop", [])
                  callToolFunction("readdAllAnchors", [])
                  callToolFunction("focusTool", ["addText"])
                  this.setState({
                    selectedTool: "addText"
                  })
                  this.enableTextColorPicker();
                }}>
                  <img className="toolIcon" src="text.svg" width="24px"></img>
                </div>
              </Tooltip>
              <Tooltip title="Draw">
                <div className={`toolIconContainer${this.state.selectedTool === "draw" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                  if (this.state.selectedTool === "draw") return;
                  if (this.state.selectedTool === "crop") callToolFunction("endCrop", [])
                  if (this.state.selectedTool === "addText") callToolFunction("removeAllAnchors", [])
                  callToolFunction("focusTool", ["draw"])
                  this.setState({
                    selectedTool: "draw"
                  });
                  this.disableDrawingEraser();
                  this.drawToolWasJustSelected = true;
                }}>
                  <img className="toolIcon" src="pen.svg" height="18px"></img>
                </div>
              </Tooltip>
              <Tooltip title="Erase">
                <div className={`toolIconContainer${this.state.selectedTool === "erase" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                  if (this.state.selectedTool === "erase") return;
                  if (this.state.selectedTool === "crop") callToolFunction("endCrop", [])
                  if (this.state.selectedTool === "addText") callToolFunction("removeAllAnchors", [])
                  callToolFunction("focusTool", ["draw"])
                  this.setState({
                    selectedTool: "erase"
                  });
                  this.enableDrawingEraser();
                }}>
                  <img className="toolIcon" src="eraser.png" height="18px"></img>
                </div>
              </Tooltip>
              <Tooltip title="Rotate">
                <div className="toolIconContainer">
                  <img className="toolIcon" src="refresh.svg" height="18px" style={{transform: "scaleX(-1)"}} onClick={() => {
                    this.rotate();
                  }}></img>
                </div>
              </Tooltip>
              {
                this.state.selectedTool === "crop" ?
                  ( <>
                      <Button onClick={(e) => {
                        callToolFunction("acceptCrop", [])

                        this.setState({
                          selectedTool: "",
                          showAcceptCancelMenu: false
                        });
                        this.inCropMode = false;
                      }} type="primary" className="cropAccept"><img className="whiteCheckmark" src="check.svg" height="18px"></img></Button>
                      <Button onClick={() => {
                        callToolFunction("endCrop", [])
                        this.setState({
                          selectedTool: "",
                          showAcceptCancelMenu: false
                        });
                        this.inCropMode = false;
                      }} className="cropCancel">Cancel</Button>
                    </>
                  )
                :
                null
              }

            </div>
            <div style={{marginTop: "10px", position: "relative", display: this.state.selectedTool === "addText" ? "inline-block" : "none"}}>
              <Tooltip title="Color">
                <div id="text-color-picker-button" className="colorPickerButton" onClick={() => {
                  this.showColorPicker("text-color-picker");
                }}></div>
              </Tooltip>
              <div id="text-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", backgroundColor: "white", transition: "opacity 0.3s"}}></div>
            </div>
            <div style={{display: this.state.selectedTool === "addText" ? "inline-block" : "none"}}>
              <DropdownMenu items={this.fonts} defaultSelectedKey={this.fonts.indexOf(this.selectedFont)} onSelect={(selectedItem) => {
                this.selectedFont = selectedItem;
              }}/>
            </div>
            {
              this.state.selectedTool === "addText" ?
                <>
                  <Button onClick={() => {
                    var text = callToolFunction("addText", [])
                    this.texts.push(text);
                    this.setState({
                      numberOfTexts: this.texts.length
                    });
                  }} type="dashed" size="small" style={{display:"block", fontSize: "12px", marginTop: "10px"}}>+ New Text Field</Button>
                  <div style={{height: "48px", overflow: "auto", marginTop: "5px"}}>
                    {
                      this.state.numberOfTexts > 0 ?
                        this.texts.map((text, index) =>
                          <TextField defaultValue={text.text()} key={text._id} onDelete={() => {
                            callToolFunction("deleteText", [text]);
                            this.texts.splice(this.texts.indexOf(text), 1);
                            this.setState({
                              numberOfTexts: this.state.numberOfTexts - 1
                            });
                            this.forceUpdate();
                          }} onInput={(e) => {
                            callToolFunction("updateText", [text, e.target.value])
                          }}/>
                        )
                        :
                        null
                    }
                  </div>
                </>
              :
              null
            }
            <div style={{marginTop: "10px", position: "relative", display: this.state.selectedTool === "draw" ? "block" : "none"}}>
              <Tooltip title="Color">
                <button id="drawing-color-picker-button" className="colorPickerButton" onClick={() => {
                  this.showColorPicker("drawing-color-picker");
                }}></button>
              </Tooltip>
              <div id="drawing-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", backgroundColor: "white", transition: "opacity 0.3s"}}></div>
            </div>
            {
              this.state.selectedTool === "draw" ?
                <>
                  <div style={{height: "10px"}}></div>
                  <EffectSlider min={1} max={50} defaultValue={this.state.drawingLineWidth} title="Size" onChange={(value) => {
                    this.setDrawingLineWidth(value);
                  }}/>
                </>
              :
              null
            }
            {
              this.state.selectedTool === "erase" ?
                <>
                  <Button onClick={() => {
                    this.eraseAllDrawing();
                  }} type="dashed" size="small" style={{fontSize: "12px", marginTop: "10px"}}>Erase All</Button>
                  <div style={{height: "10px"}}></div>
                  <EffectSlider min={1} max={50} defaultValue={this.state.drawingLineWidth} title="Size" onChange={(value) => {
                    this.setDrawingLineWidth(value);
                  }}/>
                </>
              :
              null
            }
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoEditor;
