
import React from "react";
import Canvas from "./Canvas.js";
import Upload from "./Upload.js" ;
import Jimp from "jimp/es";
import Cropper from "cropperjs";
import Konva from "konva";
import CanvasFreeDrawing from "./CanvasFreeDrawing.js";
import Colors from "./Colors.js";
import EffectSlider from "./EffectSlider.js";
import TextField from "./TextField.js";
import { Input, Button, Tooltip, Empty, Select } from "antd";
import { RotateRightOutlined } from "@ant-design/icons"
import '@simonwep/pickr/dist/themes/nano.min.css';
import "./PhotoEditor.css";
import iro from '@jaames/iro';
import UndoRedo from "./UndoRedo.js"
import DropdownMenu from "./DropdownMenu.js";
import { Tabs } from 'antd';
import * as PIXI from 'pixi.js';
import * as PixiFilters from "pixi-filters";
import SoftBrush from "./SoftBrush.js";
import CanvasCursor from "./CanvasCursor.js";

class PhotoEditor extends React.Component {

  constructor(props) {
    super(props);





    this.state = {
      image: props.image ? props.image : "",
      numberOfTextFields: 0,
      showAcceptCancelMenu: false,
      drawingLineWidth: 10,
      imageInstanced: false,
      selectedTool: "view"
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

    this.selectableFilters = [
      "None",
      "Black & White",
      "Greyscale",
      "Browni",
      "Kodachrome",
      "Technicolor",
      "Negative",
      "Polaroid",
      "Sepia",
      "Vintage",
      "Tilt/Shift"
    ]

    this.defaultBrushSize = 10;

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

    this.stage.on("click", (e) => {
      if (this.editingText) return;
      if (e.target instanceof Konva.Text) return;
      this.addText(e);
    });

    this.stage.on("mousemove", (e) => {

      if (e.target instanceof Konva.Stage) {
        this.konvaJsContent.style.cursor = "text";
        return;
      }

      if (e.target instanceof Konva.Text) {
        this.konvaJsContent.style.cursor = "auto";
        return;
      }

    });

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

  setImageFilter(filterName, values) {

    filterName = filterName.toLowerCase();
    if (filterName === "none") return;

    var colorMatrixFilters = {
      "black & white": "blackAndWhite",
      "greyscale": "greyscale",
      "browni": "browni",
      "kodachrome": "kodachrome",
      "technicolor": "technicolor",
      "negative": "negative",
      "polaroid": "polaroid",
      "sepia": "sepia",
      "vintage": "vintage"
    }

    var generalFilters = {
      "tilt/shift": "TiltShiftFilter"
    }

    var generalCoreFilters = {
      "blur": "BlurFilter"
    }

    var adjustmentFilters = {
      "gamma": "gamma",
      "contrast": "contrast",
      "saturation": "saturation",
      "brightness": "brightness"
    }

    if (colorMatrixFilters[filterName]) {
      var filterFunctionName = colorMatrixFilters[filterName];
      var type = "colorMatrix";
    }

    if (generalFilters[filterName]) {
      var filterFunctionName = generalFilters[filterName];
      var type = "general";
    }

    if (generalCoreFilters[filterName]) {
      var filterFunctionName = generalCoreFilters[filterName];
      var type = "generalCore";
    }

    if (adjustmentFilters[filterName]) {
      var filterFunctionName = adjustmentFilters[filterName];
      var type = "adjustment";
    }

    if (!filterFunctionName) return;

    var canvasWithFilter = this.pixiFilter(filterFunctionName, values, type)

    this.canvas.getContext("2d").drawImage(canvasWithFilter, 0, 0);
  }

  pixiFilter(filterName, values, type) {

    function handleFilter(filterName, type, container) {

      if (type === "colorMatrix") {
        var colorMatrix = new PIXI.filters.ColorMatrixFilter(...values);
        container.filters = [colorMatrix];
        colorMatrix[filterName](true);
        return;
      }

      if (type === "general") {
        var filter = new PixiFilters[filterName](...values);
        container.filters = [filter];
        return;
      }

      if (type === "generalCore") {
        var filter = new PIXI.filters[filterName](...values);
        container.filters = [filter];
        return;
      }

      if (type === "adjustment") {
        var options = {};
        options[filterName] = values[0];
        var filter = new PixiFilters.AdjustmentFilter(options);
        container.filters = [filter];
      }

    }

    if (!values) {
      values = [];
    }

    if (!Array.isArray(values)) {
      values = [values];
    }

    var app = this.pixiApp;
    var container = app.stage.children[0];

    handleFilter(filterName, type, container);

    /*
    if (isColorMatrixFilter) {
      var colorMatrix = new PIXI.filters.ColorMatrixFilter();
      container.filters = [colorMatrix];
      colorMatrix[filterName](true);
    } else {
      var filter = new PixiFilters[filterName]();
      container.filters = [filter];
    } */

    return app.renderer.extract.canvas(app.stage);

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


    if (canvas.width * this.scale < canvas.parentElement.parentElement.offsetWidth ||
        canvas.height * this.scale < canvas.parentElement.parentElement.offsetHeight) {
      this.offsetLeftOriginX = this.offsetLeftOriginY = this.offsetX = this.offsetY = 0;
    }

    console.log(this.offsetX, this.offsetY)

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
    this.cursorCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    var scaleOffsetX = this.originalImageData.width * (this.scale - this.nativeScale) / 2;
    var scaleOffsetY = this.originalImageData.height * (this.scale - this.nativeScale) / 2;

    this.drawingCanvasCursor.setCanvasScale(this.scale);
    this.drawingCanvasCursor.setCursorSize(this.state.drawingLineWidth);

  }

  beginZoomMode() {

    var canvasesContainer = document.getElementById("canvasesContainer");
    canvasesContainer.style.cursor = "zoom-in";

    var lastX = 0;
    var skipCounter = 0;
    var noMoving = true;

    var mouseMoveEventHandler = (e) => {

      if (skipCounter++ % 2 !== 0) return;

      noMoving = false;

      this.zoom({
        preventDefault: function() {},
        deltaY: e.offsetX > lastX ? -1 : 1,
        offsetX: e.offsetX,
        offsetY: e.offsetY
      });

      lastX = e.offsetX;

    }

    var mouseUpEventHandler = (e) => {
      canvasesContainer.removeEventListener("mousemove", mouseMoveEventHandler);
      canvasesContainer.removeEventListener("mouseup", mouseUpEventHandler);

      if (noMoving) {
        this.zoom({
          preventDefault: function() {},
          deltaY: -1,
          offsetX: e.offsetX,
          offsetY: e.offsetY
        });
      }

      noMoving = true;
    }

    var mouseDownEventHandler = (e) => {
      canvasesContainer.addEventListener("mousemove", mouseMoveEventHandler);
      canvasesContainer.addEventListener("mouseup", mouseUpEventHandler);
    }

    canvasesContainer.addEventListener("mousedown", mouseDownEventHandler);

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
      this.cursorCanvas = document.getElementById("cursorCanvas");

      this.softBrush = new SoftBrush(this.drawingCanvas, {
        size: this.defaultBrushSize,
        hardness: 0.1,
        cursorCanvas: document.getElementById("cursorCanvas")
      });

      this.imageInstanced = true;

      this.setState({
        imageInstanced: true
      });

    }

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

    var canvasWithNoFilters = document.createElement("canvas");
    canvasWithNoFilters.width = this.canvas.width;
    canvasWithNoFilters.height = this.canvas.height;
    canvasWithNoFilters.transform = this.canvas.transform;

    canvasWithNoFilters.getContext("2d").drawImage(this.canvas, 0, 0);

    this.canvasWithNoFilters = canvasWithNoFilters;

    this.originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    this.currentImageData = imageData;

    var app = new PIXI.Application({
        width: this.canvas.width,
        height: this.canvas.height
    });

    var container = new PIXI.Container();
    app.stage.addChild(container);

    var texture = PIXI.Texture.from(this.canvasWithNoFilters);
    var sprite = new PIXI.Sprite(texture);

    container.addChild(sprite);

    this.pixiApp = app;

    this.enableDrawingColorPicker();
    this.enableDrawing();

    this.focusCanvasContainer("canvasContainer");

  }

  addText(e) {

    this.focusCanvasContainer("overlayCanvasContainer")

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.getKonvaUndoRedo());

    var layer = this.layer;

    var scaleOffsetX = this.originalImageData.width * (this.scale - this.nativeScale) / this.scale / 2;
    var scaleOffsetY = this.originalImageData.height * (this.scale - this.nativeScale) / this.scale / 2;

    var zoomOffsetLeftOriginX = this.offsetLeftOriginX / this.scale * -1;
    var zoomOffsetLeftOriginY = this.offsetLeftOriginY / this.scale * -1;

    var zoomOffsetX = this.offsetX / this.scale * -1;
    var zoomOffsetY = this.offsetY / this.scale * -1;

    if (this.nativeScale > this.scale) {
      scaleOffsetX = scaleOffsetY = zoomOffsetLeftOriginX = zoomOffsetLeftOriginY = zoomOffsetX = zoomOffsetY = 0;
    }

    var textPositionX = this.layer.offsetX() + scaleOffsetX + zoomOffsetLeftOriginX + zoomOffsetX;
    var textPositionY = this.layer.offsetY() + scaleOffsetY + zoomOffsetLeftOriginY + zoomOffsetY;

    var text = new Konva.Text({
      x: e.evt.offsetX,
      y: e.evt.offsetY,
      text: 'Simple Text',
      fontSize: 70,
      fontFamily: this.selectedFont,
      fill: this.selectedTextColor.hexString,
      draggable: true
    });

    // text.x(text.x() < this.layer.offsetX() ? this.layer.offsetX() : text.x());
    // text.y(text.y() < this.layer.offsetY() ? this.layer.offsetY() : text.y());

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

    text.on('dblclick', () => {

      this.editingText = true;

      text.hide();
      transformer.hide();
      layer.draw();

      var textPosition = text.absolutePosition();

      var stageBox = this.stage.container().getBoundingClientRect();

      console.log(this.canvas.parentElement.offsetWidth, this.stage.width())

      var containerOffsetX = Math.max(0, (this.canvas.parentElement.offsetWidth - this.stage.width() * this.scale) / 2);
      var containerOffsetY = Math.max(0, (this.canvas.parentElement.offsetHeight - this.stage.height() * this.scale) / 2);

      var areaPosition = {
        x: this.offsetLeftOriginX + this.offsetX + containerOffsetX + stageBox.left + textPosition.x * this.scale,
        y: this.offsetLeftOriginY + this.offsetY + containerOffsetY + stageBox.top + textPosition.y * this.scale,
      };

      var textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      textarea.value = text.text();
      textarea.style.position = 'absolute';
      textarea.style.top = areaPosition.y + 'px';
      textarea.style.left = areaPosition.x + 'px';
      textarea.style.width = text.width() * text.getAbsoluteScale().x * this.scale - text.padding() * 2 + 'px';
      //textarea.style.height = text.height() - text.padding() * 2 + 5 + 'px';
      textarea.style.fontSize = text.fontSize() * text.getAbsoluteScale().x * this.scale + 'px';
      textarea.style.border = 'none';
      textarea.style.padding = '0px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'none';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.lineHeight = text.lineHeight();
      textarea.style.fontFamily = text.fontFamily();
      textarea.style.transformOrigin = 'left top';
      textarea.style.textAlign = text.align();
      textarea.style.color = text.fill();
      textarea.style.zIndex = "100000";

      var rotation = text.rotation();
      var transform = '';
      if (rotation) {
        transform += 'rotateZ(' + rotation + 'deg)';
      }

      var px = 0;

      var isFirefox =
        navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (isFirefox) {
        px += 2 + Math.round(text.fontSize() / 20);
      }

      transform += 'translateY(-' + px + 'px)';

      textarea.style.transform = transform;

      textarea.style.height = 'auto';

      textarea.style.height = textarea.scrollHeight + 3 + 'px';

      textarea.focus();

      function removeTextarea() {
        textarea.parentNode.removeChild(textarea);
        window.removeEventListener('click', handleOutsideClick);
        text.show();
        transformer.show();
        transformer.forceUpdate();
        layer.draw();
      }

      function setTextareaWidth(newWidth) {
        if (!newWidth) {

          newWidth = text.placeholder.length * text.fontSize();
        }

        var isSafari = /^((?!chrome|android).)*safari/i.test(
          navigator.userAgent
        );
        var isFirefox =
          navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (isSafari || isFirefox) {
          newWidth = Math.ceil(newWidth);
        }

        var isEdge =
          document.documentMode || /Edge/.test(navigator.userAgent);
        if (isEdge) {
          newWidth += 1;
        }
        textarea.style.width = newWidth + 'px';
      }

      textarea.addEventListener('keydown', function (e) {
        if (e.keyCode === 13 && !e.shiftKey) {
          text.text(textarea.value);
          removeTextarea();
        }

        if (e.keyCode === 27) {
          removeTextarea();
        }
      });

      textarea.addEventListener('keydown', function (e) {
        var scale = text.getAbsoluteScale().x;
        setTextareaWidth(text.width() * scale);
        textarea.style.height = 'auto';
        textarea.style.height =
          textarea.scrollHeight + text.fontSize() + 'px';
      });

      function handleOutsideClick(e) {
        if (e.target !== textarea) {
          text.text(textarea.value);
          removeTextarea();
          this.editingText = false;
        }
      }
      setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
      });
    });

    document.getElementById("overlayCanvasContainer").style.pointerEvents = "auto"

    this.activeTransformers.push(transformer);

    return text;
  }

  beginDragMode() {

    if (this.state.selectedTool !== "drag") return;

    var canvasesContainer = document.getElementById("canvasesContainer");

    canvasesContainer.style.cursor = "grabbing";

    this.dragModeEventHandler = (e) => {

      this.offsetX += e.movementX;
      this.offsetY += e.movementY;

      this.canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.cursorCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      if (this.konvaReady) this.konvaJsContent.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }

    canvasesContainer.addEventListener("mousemove", this.dragModeEventHandler)

    canvasesContainer.addEventListener("mouseup", () => {
      this.endDragMode();
      canvasesContainer.style.cursor = "grab";
    })

    canvasesContainer.addEventListener("mouseout", () => {
      this.endDragMode();
      canvasesContainer.style.cursor = "grab";
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

    document.getElementById("cursorCanvas").style.visibility = "hidden";
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

    document.getElementById("cursorCanvas").style.visibility = "visible";
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

        var croppedDrawingCursorCanvas = this.getCroppedCanvas(cropData, "cursorCanvas");

        document.getElementById("cursorCanvasContainer").firstElementChild.remove();
        document.getElementById("cursorCanvasContainer").appendChild(croppedDrawingCursorCanvas);

        document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `scale(${this.scale})`;
        document.getElementById("drawingCanvas").style.transform = `scale(${this.scale})`;
        document.getElementById("cursorCanvas").style.transform = `scale(${this.scale})`;

        document.getElementById("cursorCanvas").style.visibility = "visible";
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
      backgroundColor: [0,0,0,0],
      cursorElement: document.getElementById("drawingCanvasCursor")
    });

    cfd.setLineWidth(this.state.drawingLineWidth);
    console.log(this.state.drawingLineWidth, cfd.cursorElement)
    cfd.cursorElement.style.width = this.state.drawingLineWidth + "px";
    cfd.cursorElement.style.height = this.state.drawingLineWidth + "px";
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

    cfd.on({ event: 'mouseleave' }, () => {
      cfd.cursorElement.style.visibility = "hidden";
    });

    cfd.on({ event: 'mouseenter' }, () => {
      cfd.cursorElement.style.visibility = "visible";
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

    this.cfd.disableDrawingMode();

    this.softBrush.enableSoftBrush();

    var canvasCursor = new CanvasCursor(this.drawingCanvas, document.getElementById("drawingCanvasCursor"), {
      cursorSize: this.state.drawingLineWidth ? this.state.drawingLineWidth : this.defaultBrushSize
    })
    canvasCursor.setCanvasScale(this.scale)

    this.drawingCanvasCursor = canvasCursor;

  }

  disableDrawing() {

  }

  changeDrawingColor(color) {

    this.selectedDrawingColor = color;
    this.cfd.setStrokeColor([color.red, color.green, color.blue])

  }

  setDrawingLineWidth(value) {
    if (this.cfd) {
      this.cfd.setLineWidth(value);
      this.cfd.cursorElement.style.width = value * this.cfd.cssTransformScale + "px";
      this.cfd.cursorElement.style.height = value * this.cfd.cssTransformScale + "px";
    }
    this.drawingCanvasCursor.setCursorSize(value);
    this.setState({
      drawingLineWidth: value
    });
  }

  enableDrawingEraser() {
    if (this.softBrush) this.softBrush.enableEraseMode();
  }

  disableDrawingEraser() {
    if (this.softBrush) this.softBrush.disableEraseMode();
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
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'alpha'
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
      this.softBrush.setColor([color.red, color.green, color.blue, color.alpha]);

      if (color.red > 200 && color.green > 200 && color.blue > 200) {
        this.drawingCanvasCursor.setCursorColor([11, 11, 11]);
      } else {
        this.drawingCanvasCursor.setCursorColor([255, 255, 255]);
      }

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
          <div className="toolOptionsMenu">
            <div style={{height:"24px", position: "relative", display: this.state.selectedTool === "draw" ? "block" : "none"}}>
              <Tooltip title="Color">
                <button id="drawing-color-picker-button" className="colorPickerButton" onClick={() => {
                  this.showColorPicker("drawing-color-picker");
                }}></button>
              </Tooltip>
              <div id="drawing-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
            </div>
            {
              this.state.selectedTool === "draw" ?
                <>
                  <div className="toolOptionsSlider">
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={1} max={100} defaultValue={ this.state.drawingLineWidth } title="Size:" onChange={(value) => {
                      this.softBrush.setSize(value);
                      this.setDrawingLineWidth(value);
                    }}/>
                  </div>
                  <div className="toolOptionsSlider" style={{width: "140px"}}>
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={10} max={100} defaultValue={1} title="Hardness:" onChange={(value) => {
                      this.softBrush.setHardness(value / 100);
                    }}/>
                  </div>
                </>
              :
              null
            }
            {
              this.state.selectedTool === "erase" ?
                <>
                  <Button onClick={() => {
                    this.eraseAllDrawing();
                  }} type="dashed" size="small" style={{ fontSize: "12px" }}>Erase All</Button>
                  <div style={{height: "10px"}}></div>
                  <div className="toolOptionsSlider">
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={1} max={100} defaultValue={ this.state.drawingLineWidth } title="Size:" onChange={(value) => {
                      this.softBrush.setSize(value);
                      this.setDrawingLineWidth(value);
                    }}/>
                  </div>
                  <div className="toolOptionsSlider" style={{width: "140px"}}>
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={10} max={100} defaultValue={1} title="Hardness:" onChange={(value) => {
                      this.softBrush.setHardness(value / 100);
                    }}/>
                  </div>
                </>
              :
              null
            }
            <div style={{ position: "relative", display: this.state.selectedTool === "addText" ? "inline-block" : "none"}}>
              <Tooltip title="Color">
                <div id="text-color-picker-button" className="colorPickerButton" onClick={() => {
                  this.showColorPicker("text-color-picker");
                }}></div>
              </Tooltip>
              <div id="text-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
            </div>
            <div style={{display: this.state.selectedTool === "addText" ? "inline-block" : "none", marginLeft: "10px"}}>
              <Select size="small" defaultValue="Impact" onChange={(fontName) => {
                this.selectedFont = fontName;
              }}>
                <Select.Option value="Impact"><span style={{fontFamily: "Impact"}}>Impact</span></Select.Option>
                <Select.Option value="Calibri"><span style={{fontFamily: "Calibri"}}>Calibri</span></Select.Option>
                <Select.Option value="Arial"><span style={{fontFamily: "Arial"}}>Arial</span></Select.Option>
                <Select.Option value="Helvetica"><span style={{fontFamily: "Helvetica"}}>Helvetica</span></Select.Option>
                <Select.Option value="Comic Sans MS"><span style={{fontFamily: "Comic Sans MS"}}>Comic Sans MS</span></Select.Option>
              </Select>
            </div>
          </div>
          <Tooltip title="Redo">
            <img className="toolIcon undoRedoButton" src="redo.svg" height="18px" style={{position: "absolute", bottom: "10px", marginRight: "21px"}} onClick={() => {
              this.redo();
            }}></img>
          </Tooltip>
          <Tooltip title="Undo">
            <img className="toolIcon undoRedoButton" src="redo.svg" height="18px" style={{position: "absolute", bottom: "10px", marginRight: "45px", transform: "scaleX(-1)"}} onClick={() => {
              this.undo();
            }}></img>
          </Tooltip>
        </div>
        <div className="canvasTools">
          <div id="canvasesContainer" className="canvasesContainer">
            <div style={{position: "absolute", top: "190px", width:"100%"}}>
              {
                !this.state.imageInstanced ?
                  <Empty
                    image="image-outline.svg"
                    imageStyle={{
                      height: 80,
                      filter: "invert() brightness(0.25)"
                    }}
                    description={
                      <>
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
                      </>
                    }
                    >
                  </Empty>
                :
                null
              }
            </div>
            <Canvas id="canvas" containerId="canvasContainer"/>
            <Canvas id="cursorCanvas" containerId="cursorCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            <Canvas id="drawingCanvas" containerId="drawingCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}>
              <div id="drawingCanvasCursor" className="drawingCanvasCursor"></div>
            </Canvas>
            <Canvas id="overlayCanvas" containerId="overlayCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
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
          <div className="toolIcons">
            <Tooltip placement="right" title="Crop [C]">
              <div className={`toolIconContainer${this.state.selectedTool === "crop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
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
            <Tooltip placement="right" title="Add Text [T]">
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
            <Tooltip placement="right" title="Draw [D]">
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
            <Tooltip placement="right" title="Erase [E]">
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
            <Tooltip placement="right" title="Pick Color [P]">
              <div className={`toolIconContainer${this.state.selectedTool === "eyedrop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {

              }}>
                <img className="toolIcon" src="eyedrop-outline.svg" height="18px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Rotate [R]">
              <div className="toolIconContainer">
                <img className="toolIcon" src="refresh.svg" height="18px" style={{transform: "scaleX(-1)"}} onClick={() => {
                  if (!this.state.imageInstanced) return;
                  this.rotate();
                }}></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Move [V]">
              <div className={`toolIconContainer${this.state.selectedTool === "move" ? " toolIconContainerSelected" : ""}`}>
                <img className="toolIcon" src="move-outline.svg" height="18px" onClick={() => {
                  if (!this.state.imageInstanced) return;
                  this.setState({
                    selectedTool: "move"
                  });
                }}></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Drag [G]">
              <div className={`toolIconContainer${this.state.selectedTool === "drag" ? " toolIconContainerSelected" : ""}`}>
                <img className="toolIcon" src="hand-right-outline.svg" height="18px" onClick={() => {
                  if (!this.state.imageInstanced) return;
                  document.getElementById("canvasesContainer").style.cursor = "grab";
                  this.focusCanvasContainer("canvasContainer");
                  this.setState({
                    selectedTool: "drag"
                  });
                }}></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Effects & Filters">
              <div style={{visibility: "hidden"}} className={`toolIconContainer${this.state.selectedTool === "effects" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (this.state.selectedTool === "effects") return;
                if (this.state.selectedTool === "crop") callToolFunction("endCrop", [])
                if (this.state.selectedTool === "addText") callToolFunction("removeAllAnchors", [])
                this.setState({
                  selectedTool: "effects"
                });
              }}>
                <span style={{fontSize: "12px", fontWeight: "bold", margin: 0, fontStyle: "italic", cursor: "default"}}>fx</span>
              </div>
            </Tooltip>

          </div>
          <div id="tools" className="toolsMenuContainer">
            <Tabs type="card" tabBarStyle={{fontSize: "11px"}} tabBarGutter={0} size="small" defaultActiveKey="1">
              <Tabs.TabPane tab="Filters" key="1">
                <div style={{width: "96%", margin: "auto"}}>
                  <EffectSlider min={0} max={100} defaultValue={0} title="Blur" onChange={(value) => {
                    this.setImageFilter("blur", [value, 20]);
                  }}/>
                  <h5 style={{display: "flex", justifyContent:"space-between", alignItems: "center"}}>Image Filter</h5>
                  <div style={{display: "flex", justifyContent:"center", alignItems: "center", marginBottom: "10px"}}>
                    <DropdownMenu aStyle={{fontSize: "11px"}} items={this.selectableFilters} defaultSelectedKey={0} onSelect={(selectedItem) => {
                      this.setImageFilter(selectedItem);
                    }}/>
                  </div>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Adjustments" key="2">
                <div style={{width: "96%", margin: "auto"}}>
                  <EffectSlider min={-100} max={100} defaultValue={0} title="Contrast" onChange={(value) => {
                    this.setImageFilter("contrast", [value / 100 + 1]);
                    //callToolFunction("contrast", [value])
                  }}/>
                  <EffectSlider min={-100} max={100} defaultValue={0} title="Brightness" onChange={(value) => {
                    this.setImageFilter("brightness", [value / 100 + 1]);
                  }}/>
                  <EffectSlider min={-100} max={100} defaultValue={0} title="Gamma" onChange={(value) => {
                    this.setImageFilter("gamma", [value / 100 + 1]);
                    //callToolFunction("contrast", [value])
                  }}/>
                  <EffectSlider min={-100} max={100} defaultValue={0} title="Saturation" onChange={(value) => {
                    this.setImageFilter("saturation", [value / 100 + 1]);
                  }}/>
                </div>
              </Tabs.TabPane>
            </Tabs>
            <div style={{position: "absolute", bottom: "0px", width: "100%", display: "flex" }}>
              <div style={{marginLeft: "5px"}}>
                <Button>Cancel</Button>
              </div>
              <div style={{marginLeft: "5px"}}>
                <Button type="primary" id="saveImageButton">Save</Button>
              </div>
            </div>
            {
              this.state.selectedTool === "effects" ?
                <Tabs type="card" tabBarStyle={{fontSize: "11px"}} tabBarGutter={0} size="small" defaultActiveKey="1">
                  <Tabs.TabPane tab="Filters" key="1">
                    <div style={{width: "96%", margin: "auto"}}>
                      <EffectSlider min={0} max={20} defaultValue={0} title="Blur" onChange={(value) => {

                      }}/>
                      <h5 style={{display: "flex", justifyContent:"space-between", alignItems: "center"}}>Image Filters</h5>
                      <div style={{display: "flex", justifyContent:"center", alignItems: "center", marginBottom: "10px"}}>
                        <DropdownMenu aStyle={{fontSize: "11px"}} items={this.selectableFilters} defaultSelectedKey={0} onSelect={(selectedItem) => {
                          this.setImageFilter(selectedItem);
                        }}/>
                      </div>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Adjustments" key="2">
                  <div style={{width: "96%", margin: "auto"}}>
                    <EffectSlider min={-100} max={100} defaultValue={0} title="Contrast" onChange={(value) => {
                      callToolFunction("contrast", [value])
                    }}/>
                    <EffectSlider min={-100} max={100} defaultValue={0} title="Brightness" onChange={(value) => {
                      callToolFunction("brightness", [value])
                    }}/>
                    <EffectSlider min={-100} max={100} defaultValue={0} title="Saturation" onChange={(value) => {
                      callToolFunction("saturate", [value])
                    }}/>
                  </div>
                  </Tabs.TabPane>
                </Tabs>
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
