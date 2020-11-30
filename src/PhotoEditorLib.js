
import Jimp from "jimp/es";
import Cropper from "cropperjs";
import Konva from "konva";
import Colors from "./Colors.js";
import iro from '@jaames/iro';
import UndoRedo from "./UndoRedo.js";
import SoftBrush from "./SoftBrush.js";
import CanvasCursor from "./CanvasCursor.js";
import CanvasLib from "./CanvasLib.js";
import ImageLib from "./ImageLib.js";
import PixiLib from "./PixiLib.js";
import KonvaLib from "./KonvaLib.js";

class PhotoEditorLib {

  constructor({ selectableFilters, selectedTool, defaultBrushSize, defaultBrushHardness }) {

    this.imageFilters = {
      contrast: 0,
      brightness: 0,
      saturation: 0
    }

    this.appliedPixiFilters = [];

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
    this.imageLib = new ImageLib();

    this.Konva = Konva;

    this.defaultBrushSize = defaultBrushSize ? defaultBrushSize : 20;
    this.defaultBrushHardness = defaultBrushHardness ? defaultBrushHardness : 0.5;

    this.selectedTool = selectedTool ? selectedTool : "";

  }

  initKonva() {
    var stage = new Konva.Stage({
      container: 'overlayCanvasContainer',
      width: document.getElementById("canvas").clientWidth,
      height: document.getElementById("canvas").clientHeight
    });

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

  async setImageFilter(filterName, values) {

    this.appliedPixiFilters.push([filterName, values]);

    var imagesWithFilters = [];

    for (var i = 0; i < this.imagesWithNoFilters.length; i++) {
      var image = this.imagesWithNoFilters[i];
      var app = this.pixiApps[i];

      PixiLib.setImageFilter(app, filterName, values);

      var canvas = PixiLib.canvasFromApp(app);

      var imageObj = await this.imageLib.canvasToImage(canvas);

      imagesWithFilters.push(imageObj);
    }

    this.konvaLib.replaceImages(imagesWithFilters);

  }

  zoom = (e) => {

    e.preventDefault();

    var factor = e.deltaY < 0 ? 1 : -1
    var zoomConstant = 0.05 * factor;

    var canvas = document.getElementById("canvas");
    var drawingCanvas = document.getElementById("drawingCanvas");
    var konvaCanvas = document.getElementById("overlayCanvasContainer").firstElementChild;

    if (this.scale + zoomConstant <= 0) return;

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

    canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    konvaCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.cursorCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    var scaleOffsetX = this.originalImageData.width * (this.scale - this.nativeScale) / 2;
    var scaleOffsetY = this.originalImageData.height * (this.scale - this.nativeScale) / 2;

    this.drawingCanvasCursor.setCanvasScale(this.scale);
    this.drawingCanvasCursor.setCursorSize(this.softBrush.getSize() * this.scale);

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
      this.konvaImagesContainer = document.getElementById("konvaImagesContainer");
      this.canvasesContainer = document.getElementById("canvasesContainer");

      this.softBrush = new SoftBrush(this.drawingCanvas, {
        size: this.defaultBrushSize / this.scale,
        hardness: this.defaultBrushHardness,
        cursorCanvas: document.getElementById("cursorCanvas"),
        color: [255, 255, 255, 1]
      });

    }

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

    var canvasWithNoFilters = CanvasLib.cloneCanvas(this.canvas);
    this.canvasWithNoFilters = canvasWithNoFilters;

    this.originalImageData = CanvasLib.cloneImageData(imageData);
    this.currentImageData = imageData;

    this.enableDrawingColorPicker();
    this.enableDrawing();

    if (!this.imageInstanced) {

      this.konvaLib = new KonvaLib({
        containerId: "konvaImagesContainer",
        width: this.canvas.width,
        height: this.canvas.height
      });

      this.konvaLib.stage.scale({
        x: this.scale,
        y: this.scale
      });

      this.canvas.style.display = "none";
      document.getElementById("konvaImagesContainer").style.pointerEvents = "auto";

      this.konvaLib.stage.on("mousemove", (e) => {
        this.konvaTarget = e.target;
      });

      this.initKonva();

      CanvasLib.copyCanvasProperties(this.canvas, this.drawingCanvas);
      CanvasLib.copyCanvasProperties(this.canvas, this.cursorCanvas);

      this.konvaImagesContainer.style.width = this.canvas.width * this.scale + "px";
      this.konvaImagesContainer.style.height = this.canvas.height * this.scale + "px";
      this.konvaImagesContainer.style.left = ((this.canvasesContainer.offsetWidth - this.canvas.width * this.scale) / 2 * this.scale) + "px";
      this.konvaImagesContainer.style.top = ((this.canvasesContainer.offsetHeight - this.canvas.height * this.scale) / 2 * this.scale) + "px";
      this.konvaImagesContainer.style.overflow = "hidden";

      var tempCanvas = CanvasLib.canvasFromImageData(imageData);
      var imageObj = await this.imageLib.canvasToImage(tempCanvas);
      this.konvaLib.addImage(imageObj, tempCanvas.width, tempCanvas.height);

      this.imagesWithNoFilters = [imageObj];

      this.pixiApps = [PixiLib.appFromImage(tempCanvas.toDataURL())];

      this.imageInstanced = true;
    }

    this.focusCanvasContainer("konvaImagesContainer");

  }

  async importImage(buffer) {

    var imageObj = await this.imageLib.bufferToImage(buffer);

    this.konvaLib.addImage(imageObj, imageObj.width, imageObj.height);

    this.imagesWithNoFilters.push(imageObj);
    this.pixiApps.push(PixiLib.appFromImage(imageObj.src));

  }

  deleteSelectedImageLayer() {
    if (!this.konvaTarget instanceof this.Konva.Image) return;
    this.konvaLib.deleteImageLayer(this.konvaTarget);
  }

  bringSelectedImageLayerToFront() {
    if (!this.konvaTarget instanceof this.Konva.Image) return;
    this.konvaLib.bringImageToFront(this.konvaTarget);
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
      x: this.layer.offsetX() + e.evt.offsetX,
      y: this.layer.offsetY() + e.evt.offsetY,
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

      var removeTextarea = () => {

        textarea.parentNode.removeChild(textarea);
        window.removeEventListener('click', handleOutsideClick);
        text.show();
        transformer.show();
        transformer.forceUpdate();
        layer.draw();

      }

      var handleOutsideClick = (e) => {
        if (e.target !== textarea) {
          text.text(textarea.value);
          removeTextarea();
          this.editingText = false;
        }
      }

      this.editingText = true;

      text.hide();
      transformer.hide();
      layer.draw();

      var textPosition = text.absolutePosition();

      var stageBox = this.stage.container().getBoundingClientRect();

      var containerOffsetX = Math.max(0, (this.canvas.parentElement.offsetWidth - this.stage.width() * this.scale) / 2);
      var containerOffsetY = Math.max(0, (this.canvas.parentElement.offsetHeight - this.stage.height() * this.scale) / 2);

      var scaleZoomOffsetX = (this.canvasesContainer.clientWidth - this.canvas.width * this.scale) / 2;
      var scaleZoomOffsetY = (this.canvasesContainer.clientHeight - this.canvas.height * this.scale) / 2;

      if (scaleZoomOffsetX > 0) scaleZoomOffsetX = 0;
      if (scaleZoomOffsetY > 0) scaleZoomOffsetY = 0;

      var zoomOffsetX = this.offsetLeftOriginX + this.offsetX;
      var zoomOffsetY = this.offsetLeftOriginY + this.offsetY;

      var areaPosition = {
        x: scaleZoomOffsetX + zoomOffsetX + containerOffsetX + textPosition.x * this.scale,
        y: scaleZoomOffsetY + zoomOffsetY + containerOffsetY + textPosition.y * this.scale,
      };

      var textarea = document.createElement('textarea');
      this.canvasesContainer.appendChild(textarea);

      textarea.value = text.text();
      textarea.style.position = 'absolute';
      textarea.style.top = areaPosition.y + 'px';
      textarea.style.left = areaPosition.x + 'px';
      textarea.style.width = text.width() * text.getAbsoluteScale().x * this.scale - text.padding() * 2 + 'px';
      textarea.style.height = text.height() - text.padding() * 2 + 5 + 'px';
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

      transform += 'translateY(-' + px + 'px)';
      textarea.style.transform = transform;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 3 + 'px';

      textarea.focus();

      var textareaWidth = textarea.offsetWidth;

      textarea.addEventListener('keydown', (e) => {

        // +1 as lazy fix, doesn't matter if we remove characters but momentarily add 1 font-size too much width
        textarea.style.width = (textarea.value.length + 1) * text.fontSize() * text.getAbsoluteScale().x * this.scale + "px";

        if (e.keyCode === 13 && !e.shiftKey) {
          text.text(textarea.value);
          removeTextarea();
        }

        if (e.keyCode === 27) {
          removeTextarea();
        }

        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + text.fontSize() * this.scale + 'px';

      });

      setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
      });

    });

    document.getElementById("overlayCanvasContainer").style.pointerEvents = "auto"

    this.activeTransformers.push(transformer);

    return text;
  }

  getKonvaTarget() {
    return this.konvaTarget;
  }

  beginDragMode() {

    if (this.selectedTool !== "drag") return;

    this.canvas.style.cursor = "grabbing";

    this.dragModeEventHandler = (e) => {

      this.offsetX += e.movementX;
      this.offsetY += e.movementY;
      this.canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.cursorCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      if (this.konvaReady) this.konvaJsContent.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }

    this.dragModeMouseupEventHandler = (e) => {
      this.endDragMode();
    }

    this.dragModeMouseoutEventHandler = (e) => {
      this.endDragMode();
    }

    this.canvas.addEventListener("mousemove", this.dragModeEventHandler);
    this.canvas.addEventListener("mouseup", this.dragModeMouseupEventHandler);
    this.canvas.addEventListener("mouseout", this.dragModeMouseoutEventHandler);
  }

  endDragMode() {
    this.canvas.removeEventListener("mousemove", this.dragModeEventHandler);
    this.canvas.removeEventListener("mouseup", this.dragModeMouseupEventHandler);
    this.canvas.removeEventListener("mouseout", this.dragModeMouseoutEventHandler);
  }

  enableColorPickerMode() {

    this.focusCanvasContainer("canvasContainer");

    this.canvas.style.cursor = "none";

    var cursorImage = document.createElement("img");
    var colorPreview = document.createElement("div");

    this.colorPickerCursorImage = cursorImage;
    this.colorPickerColorPreview = colorPreview;

    cursorImage.src = "eyedrop.svg";
    cursorImage.width = "18";
    cursorImage.height = "18";

    cursorImage.style.pointerEvents = "none";
    cursorImage.style.position = "absolute";

    colorPreview.style.width = "18px";
    colorPreview.style.height = "18px";
    colorPreview.style.border = "2px solid white";
    colorPreview.style.borderRadius = "18px";

    colorPreview.style.pointerEvents = "none";
    colorPreview.style.position = "absolute";

    this.canvasesContainer.appendChild(cursorImage);
    this.canvasesContainer.appendChild(colorPreview);

    this.colorPickerMoveEventHandler = (e) => {

      var offsetX = (this.canvasesContainer.offsetWidth - this.canvas.offsetWidth * this.scale) / 2;
      var offsetY = (this.canvasesContainer.offsetHeight - this.canvas.offsetHeight * this.scale) / 2;

      cursorImage.style.left = this.offsetLeftOriginX + this.offsetX + offsetX + e.offsetX * this.scale + -1 +"px";
      cursorImage.style.top = this.offsetLeftOriginY + this.offsetY + offsetY + e.offsetY *this.scale - 15 +"px";

      colorPreview.style.left = this.offsetLeftOriginX + this.offsetX + offsetX + e.offsetX * this.scale + 8 + "px";
      colorPreview.style.top = this.offsetLeftOriginY + this.offsetY + offsetY + e.offsetY * this.scale + -4 + "px";

      var ctx = this.canvas.getContext("2d");

      var konvaAsCanvas = this.stage.toCanvas();

      var color = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      var textCanvasColor = konvaAsCanvas.getContext("2d").getImageData(e.offsetX, e.offsetY, 1, 1).data;
      var drawingCanvasColor = this.drawingCanvas.getContext("2d").getImageData(e.offsetX, e.offsetY, 1, 1).data

      if (drawingCanvasColor[3] > 0) {
        color = drawingCanvasColor;
      }

      if (textCanvasColor[3] > 0) {
        color = textCanvasColor;
      }

      colorPreview.style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;

    }

    this.colorPickerClickEventHandler = (e) => {

      var ctx = this.canvas.getContext("2d");

      var konvaAsCanvas = this.stage.toCanvas();

      var color = ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
      var textCanvasColor = konvaAsCanvas.getContext("2d").getImageData(e.offsetX, e.offsetY, 1, 1).data;
      var drawingCanvasColor = this.drawingCanvas.getContext("2d").getImageData(e.offsetX, e.offsetY, 1, 1).data

      if (drawingCanvasColor[3] > 0) {
        color = drawingCanvasColor;
      }

      if (textCanvasColor[3] > 0) {
        color = textCanvasColor;
      }

      var iroColor = new iro.Color({r: color[0], g: color[1], b: color[2], a: color[3]});

      if (this.textColorPicker) {
        this.textColorPicker.setColors([iroColor]);
        this.textColorPicker.setActiveColor(0);
      }

      if (this.drawingColorPicker) {
        this.drawingColorPicker.setColors([iroColor]);
        this.drawingColorPicker.setActiveColor(0);
      }

      this.selectedTextColor = iroColor;
      this.selectedDrawingColor = iroColor;

      this.softBrush.setColor([iroColor.red, iroColor.green, iroColor.blue, iroColor.alpha]);

      document.getElementById("text-color-picker-button").style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
      document.getElementById("drawing-color-picker-button").style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
      document.getElementById("eyedrop-color-picker-button").style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;

    }

    this.colorPickerMouseoutEventHandler = (e) => {

      cursorImage.style.visibility = "hidden";
      colorPreview.style.visibility = "hidden";

    }

    this.colorPickerMouseinEventHandler = (e) => {

      cursorImage.style.visibility = "visible";
      colorPreview.style.visibility = "visible";

    }

    this.canvas.addEventListener("mousemove", this.colorPickerMoveEventHandler);
    /* this.stage.on("mousemove", (e) => {
      var textCanvasColor = this.konvaJsContent.firstElementChild.getContext("2d").getImageData(e.evt.clientX / this.scale, e.clientY / this.scale, 1, 1).data;
    }) */
    this.canvas.addEventListener("mouseover", this.colorPickerMouseinEventHandler);
    this.canvas.addEventListener("mouseout", this.colorPickerMouseoutEventHandler);
    this.canvas.addEventListener("click", this.colorPickerClickEventHandler);

  }

  disableColorPickerMode() {

    if (!this.colorPickerCursorImage) return;

    this.canvas.removeEventListener("mousemove", this.colorPickerMoveEventHandler);
    this.canvas.removeEventListener("mouseover", this.colorPickerMouseinEventHandler);
    this.canvas.removeEventListener("mouseout", this.colorPickerMouseoutEventHandler);
    this.canvas.removeEventListener("click", this.colorPickerClickEventHandler);

    this.canvasesContainer.removeChild(this.colorPickerCursorImage);
    this.canvasesContainer.removeChild(this.colorPickerColorPreview);

  }

  async rotate() {

    this.undoRedoLib.prepareFullClone("rotate", "undo");

    CanvasLib.rotateCanvas(this.canvas);
    CanvasLib.rotateCanvasSize(this.drawingCanvas);
    CanvasLib.rotateCanvasSize(this.cursorCanvas);

    if (this.selectedTool === "erase") this.enableDrawingEraser();

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
    this.cursorCanvas.style.transform = transformString;
    if (this.konvaReady) this.konvaJsContent.style.transform = transformString;

    this.pixiApp = PixiLib.appFromImage(this.canvas);
    PixiLib.setImageFilters(this.pixiApp, this.appliedPixiFilters);

    this.drawingCanvasCursor.setCanvasScale(this.scale);

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

    if (!this.layer || !this.stage) return;

    for (var i = 0; i < this.activeTransformers.length; i++) {
      this.reattachTextAnchorList.push([this.activeTransformers[i], this.activeTransformers[i].nodes()])
      this.activeTransformers[i].detach();
    }

    this.activeTransformers = [];

    this.layer.draw();

  }

  readdAllAnchors() {

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

    var layer = new Konva.Layer();

    stage.add(layer);

    var textNodes = this.layer.getChildren();

    textNodes.each((textNode, n) => {
      layer.add(textNode);
    });

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

        var croppedDrawingCanvas = CanvasLib.getCroppedCanvas(cropData, this.drawingCanvas);

        document.getElementById("drawingCanvasContainer").firstElementChild.remove();
        document.getElementById("drawingCanvasContainer").appendChild(croppedDrawingCanvas);

        var croppedDrawingCursorCanvas = CanvasLib.getCroppedCanvas(cropData, this.cursorCanvas);

        document.getElementById("cursorCanvasContainer").firstElementChild.remove();
        document.getElementById("cursorCanvasContainer").appendChild(croppedDrawingCursorCanvas);

        document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `scale(${this.scale})`;
        document.getElementById("drawingCanvas").style.transform = `scale(${this.scale})`;
        document.getElementById("cursorCanvas").style.transform = `scale(${this.scale})`;

        document.getElementById("cursorCanvas").style.visibility = "visible";
        document.getElementById("drawingCanvasContainer").style.visibility = "visible";
        document.getElementById("overlayCanvasContainer").style.visibility = "visible";

        this.drawingCanvasCursor.setCanvasScale(this.scale);
        this.drawingCanvasCursor.setCursorSize(this.drawingLineWidth);

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

    if (this.drawingEnabled) return;

    this.focusCanvasContainer("drawingCanvasContainer");

    document.getElementById("drawingCanvas").style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    this.softBrush.enableSoftBrush();

    var canvasCursor = new CanvasCursor(this.drawingCanvas, document.getElementById("drawingCanvasCursor"), {
      canvasScale: this.scale,
      cursorSize: this.softBrush.getSize() * this.scale
    });

    canvasCursor.setCursorColor([0, 0, 0, 1])

    this.drawingCanvasCursor = canvasCursor;

    this.drawingEnabled = true;

  }

  disableDrawing() {

  }

  changeDrawingColor(color) {

    this.selectedDrawingColor = color;

  }

  setBrushSize(value) {
    this.softBrush.setSize(value / this.scale);
  }

  setDrawingLineWidth(value) {
    this.drawingCanvasCursor.setCursorSize(value);
    this.drawingLineWidth = value;
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

  getDefaultColorPicker(id, color) {
    return new iro.ColorPicker(id, {
      width: 75,
      color: color ? color : "#fff",
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
    this.textColorPicker = this.getDefaultColorPicker("#text-color-picker", this.selectedTextColor);
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
    document.getElementById("konvaImagesContainer").style.pointerEvents = id === "konvaImagesContainer" ? "auto" : "none";
  }

  exportImage() {

    if (this.selectedTool === "addText") this.removeAllAnchors();

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

    if (this.selectedTool === "addText") this.readdAllAnchors();

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

    this.texts = [];

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

}

export default PhotoEditorLib;
