
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
import * as imageConversion from 'image-conversion';
import { readAndCompressImage } from 'browser-image-resizer';

class PhotoEditorLib {

  constructor(options) {

    this.originalOptions = options;

    this.options = options;

    var { selectableFilters, adjustableFilters, adjustments, selectedTool, defaultBrushSize, defaultBrushHardness } = options;

    this.appliedPixiFilters = {};

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
    this.PixiLib = PixiLib;

    this.defaultBrushSize = defaultBrushSize ? defaultBrushSize : 20;
    this.defaultBrushHardness = defaultBrushHardness ? defaultBrushHardness : 0.5;

    this.selectedTool = selectedTool ? selectedTool : "";

    this.selectableFilters = selectableFilters ? selectableFilters : [];
    this.adjustableFilters = adjustableFilters ? adjustableFilters : [];
    this.adjustments = adjustments ? adjustments : [];

    this.filterPreviews = [];

    this.eventListeners= [];

    this.runningImageId = 1;

  }

  on(evtString, evtHandler) {
    this.eventListeners.unshift({
      type: evtString,
      handler: evtHandler
    });
  }

  dispatchEvent(evtString, args) {

    for (var i = this.eventListeners.length - 1; i >= 0; i--) {
      var event = this.eventListeners[i];
      if (event.type !== evtString) continue;
      event.handler.apply(null, args);
    }
  }

  initKonva(image) {
    var stage = new Konva.Stage({
      container: 'overlayCanvasContainer',
      width: image.width,
      height: image.height
    });

    var layer = new Konva.Layer();

    stage.add(layer);

    this.layer = layer;
    this.stage = stage;

    document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    document.getElementById("overlayCanvasContainer").firstElementChild.style.position = `absolute`;

    this.konvaReady = true;

    this.konvaJsContent = document.getElementById("overlayCanvasContainer").firstElementChild;

    this.konvaTextTarget = false;

    var target = (text) => {

      if (this.konvaTextTarget === text) {
        untarget(text);
        return;
      }

      if (this.konvaTextTarget) untarget(this.konvaTextTarget);

      var transformer = this.konvaLib.getNodeTransformer(text, this.layer);
      transformer.show();

      text.draggable(true);

      this.konvaTextTarget = text;

      this.stage.batchDraw();
    }

    var untarget = (text) => {

      if (!text) return;

      var transformer = this.konvaLib.getNodeTransformer(text, this.layer);
      if (transformer) transformer.hide();

      text.draggable(false);

      this.konvaTextTarget = false;

      this.stage.batchDraw();

    }

    this.targetKonvaText = target;
    this.untargetKonvaText = untarget;

    this.stage.on("click", (e) => {
      if (this.editingText) return;
      if (e.evt.button === 2) return;
      if (e.target instanceof Konva.Text) {
        target(e.target);
        return;
      };
      target(this.addText(e));
    });

    var timeout;
    this.stage.on("mousemove", (e) => {

      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }

      timeout = window.requestAnimationFrame(() => {

        if (e.target instanceof Konva.Stage) {
          this.konvaTarget = false;
          this.konvaJsContent.style.cursor = "text";
          return;
        }

        if (e.target instanceof Konva.Text) {
          this.konvaTarget = e.target;
          this.konvaJsContent.style.cursor = "auto";
          return;
        }
      });

    });

  }

  undo() {
    this.undoRedoLib.undoRedo("undo");
  }

  redo() {
    this.undoRedoLib.undoRedo("redo")
  }

  getSelectedTargetImageSettings() {
    var settings = {};

    if (!this.konvaLib.selectedTargetImage) {
      return {
        selectedTarget: false,
        contrast: 1,
        brightness: 1,
        gamma: 1,
        saturation: 1,
        filter: "none",
        blur: 0,
        "bulge/pinch": {
          radius: 0,
          center: [0, 0],
          strength: 0
        },
        "tilt/shift": [0, 0]
      }
    }

    var appliedFilters = this.appliedPixiFilters[this.konvaLib.selectedTargetImage.photoEditorId];

    for (var i = 0; i < this.selectableFilters.length; i++) {
      if (!appliedFilters) {
        settings.filter = "None";
        break;
      }
      var appliedFilter = false;
      for (let j = 0; j < appliedFilters.length; j++) {
        if (appliedFilters[j][0] === this.selectableFilters[i]) {
          appliedFilter = appliedFilters[j][0];
          break;
        }
      }
      if (!appliedFilter) {
        settings.filter = "None";
        continue;
      }

      settings.filter = appliedFilter;
      break;
    }

    for (var i = 0; i < this.adjustableFilters.length; i++) {
      if (!appliedFilters) {
        settings[this.adjustableFilters[i]] = 0;
        continue;
      }
      var appliedFilter = false;
      for (let j = 0; j < appliedFilters.length; j++) {
        if (appliedFilters[j][0] === this.adjustableFilters[i]) {
          settings[this.adjustableFilters[i]] = appliedFilters[j][1][0];
          appliedFilter = true;
          break;
        }
      }
      if (!appliedFilter) {
        settings[this.adjustableFilters[i]] = 0;
      }

    }

    for (var i = 0; i < this.adjustments.length; i++) {
      if (!appliedFilters) {
        settings[this.adjustments[i]] = 1;
        continue;
      }
      var appliedFilter = false;
      for (let j = 0; j < appliedFilters.length; j++) {
        if (appliedFilters[j][0] === this.adjustments[i]) {
          settings[this.adjustments[i]] = appliedFilters[j][1][0];
          appliedFilter = true;
          break;
        }
      }
      if (!appliedFilter) {
        settings[this.adjustments[i]] = 1;
      }

    }

    settings.selectedTarget = true;

    if (!settings["bulge/pinch"]) {
      settings["bulge/pinch"] = {
        radius: 0,
        center: [0, 0],
        strength: 0
      }
    }

    if (!settings["tilt/shift"]) {
      settings["tilt/shift"] = [0, 0]
    }

    return settings;
  }

  addAppliedFilter(filterName, values, imageId) {

    var appliedFilters = this.removeAppliedFilter(filterName, imageId);

    appliedFilters.push([filterName, values])

    return appliedFilters;
  }

  removeAppliedFilter(filterName, imageId) {
    var appliedFilters = this.appliedPixiFilters[imageId] ? this.appliedPixiFilters[imageId] : [];

    for (var i = 0; i < appliedFilters.length; i++) {
      var filter = appliedFilters[i];
      if (filter[0] === filterName || (this.selectableFilters.includes(filter[0]) &&  this.selectableFilters.includes(filterName))) {
        appliedFilters.splice(i, 1);
        break;
      }
    }

    this.appliedPixiFilters[imageId] = appliedFilters;

    return appliedFilters;
  }

  getMatchingFilter(filterName, imageId) {

    var appliedFilters = this.appliedPixiFilters[imageId] ? this.appliedPixiFilters[imageId] : [];

    var appliedFilter;

    for (var i = 0; i < appliedFilters.length; i++) {
      var filter = appliedFilters[i];
      if (filter[0] === filterName || (this.selectableFilters.includes(filter[0]) &&  this.selectableFilters.includes(filterName))) {
        appliedFilter = filter;
        break;
      }
    }

    return appliedFilter;

  }

  getSelectedImageWithNoFilters() {

    var image;

    for (var i = 0; i < this.imagesWithNoFilters.length; i++) {

      var imageWithNoFilters = this.imagesWithNoFilters[i];

      if (imageWithNoFilters.id === this.konvaLib.selectedTargetImage.photoEditorId) {
        image = imageWithNoFilters;
        break;
      }

    }

    return image;

  }

  getImageWithFilters(image) {

    var appliedFilters = this.appliedPixiFilters[image.id] ? this.appliedPixiFilters[image.id] : [];

    PixiLib.reuseAppWithImage(this.pixiApp, image);
    PixiLib.resetImageFilters(this.pixiApp.stage.children[0]);
    PixiLib.setImageFilters(this.pixiApp, appliedFilters);

    var imageObj = PixiLib.imageFromApp(this.pixiApp);

    imageObj.id = image.id;

    return imageObj;
  }

  replaceImagesWithNoFilters(newImages) {

    this.imagesWithNoFilters = newImages;

  }

  reapplyImageFilters() {

    for (var i = 0; i < this.imagesWithNoFilters.length; i++) {
      var imageWithNoFilters = this.imagesWithNoFilters[i];

      var imageObj = this.getImageWithFilters(imageWithNoFilters);

      var [newImageNode, oldImageNode] = this.konvaLib.replaceImageWithSameId(imageObj);

    }

  }

  setSelectedImageFilter(filterName, values) {

    if (!this.konvaLib.selectedTargetImage) return;

    var image = this.getSelectedImageWithNoFilters();

    if (!image) return;

    var matchingFilter = this.getMatchingFilter(filterName, image.id);
    if (!matchingFilter) {
      var undoRedoItem = this.undoRedoLib.typesLib.getFilterRemoveUndoRedo(this.konvaLib.selectedTargetImage, filterName);
    } else {
      var undoRedoItem = this.undoRedoLib.typesLib.getFilterUndoRedo(this.konvaLib.selectedTargetImage, matchingFilter[0], matchingFilter[1]);
    }

    this.undoRedoLib.addToUndoCache(undoRedoItem);

    this.addAppliedFilter(filterName, values, image.id);

    var imageObj = this.getImageWithFilters(image);

    var [newImageNode, oldImageNode] = this.konvaLib.replaceImageWithSameId(imageObj);

    this.undoRedoLib.replaceImageNodeInCaches(oldImageNode, newImageNode);
    this.undoRedoLib.addKonvaImageUndoRedoEvents(newImageNode);

    this.konvaLib.stage.batchDraw();

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

    var offsetLeftOriginX = this.konvaLib.stage.width() * zoomConstant / 2;
    var offsetLeftOriginY = this.konvaLib.stage.height() * zoomConstant / 2;

    this.offsetLeftOriginX += offsetLeftOriginX;
    this.offsetLeftOriginY += offsetLeftOriginY;

    var x = e.offsetX;
    var y = e.offsetY;


    var newX = 1.05 * x;
    var newY = 1.05 * y;

    this.offsetX += (newX - x) * -1 * factor;
    this.offsetY += (newY - y) * -1 * factor;


    if (this.konvaLib.stage.width() * this.scale < canvas.parentElement.parentElement.offsetWidth ||
        this.konvaLib.stage.height() * this.scale < canvas.parentElement.parentElement.offsetHeight) {
      this.offsetLeftOriginX = this.offsetLeftOriginY = this.offsetX = this.offsetY = 0;
    }

    canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    konvaCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.cursorCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.colorPickerCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.konvaImagesContainer.firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.konvaTransformersContainer.firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    var scaleOffsetX = this.originalImage.width * (this.scale - this.nativeScale) / 2;
    var scaleOffsetY = this.originalImage.height * (this.scale - this.nativeScale) / 2;

    //this.drawingCanvasCursor.setCanvasScale(this.scale);
    //this.drawingCanvasCursor.setCursorSize(this.softBrush.getSize() * this.scale);

  }

  beginZoomMode() {

    return;

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

  async loadImage(file) {

    if (this.imageInstanced) return;

    this.dispatchEvent("loadingImage", [file]);

    document.getElementById("canvasesContainer").addEventListener("wheel", this.zoom);

    document.getElementById("canvasesContainer").addEventListener("mousedown", () => {
      this.beginDragMode();
    });

    this.drawingCanvas = document.getElementById("drawingCanvas");
    this.cursorCanvas = document.getElementById("cursorCanvas");
    this.konvaImagesContainer = document.getElementById("konvaImagesContainer");
    this.konvaTransformersContainer = document.getElementById("konvaTransformersContainer");
    this.colorPickerCanvas = document.getElementById("colorPickerCanvas");
    this.canvasesContainer = document.getElementById("canvasesContainer");

    var image;

    if (file instanceof HTMLImageElement) {
      image = file;
      file = await imageConversion.imagetoCanvas(file);
      file = await imageConversion.canvastoFile(file);

    } else if (file instanceof File) {

      var url = await imageConversion.filetoDataURL(file);
      image = await imageConversion.dataURLtoImage(url);
    }

    if (this.options.downscaleImage) {
      if (image.width > this.options.maxImageSize || image.height > this.options.maxImageSize) {
        console.log(this.options.maxImageSize / Math.max(image.width, image.height))

        file = await readAndCompressImage(file, {
          quality: 1,
          maxWidth: this.options.maxImageSize,
          maxHeight: this.options.maxImageSize
        });

        let url = await imageConversion.filetoDataURL(file);
        image = await imageConversion.dataURLtoImage(url);
      }
    }

    if (!image) return;

    this.colorPickerCanvas.height = image.height;
    this.colorPickerCanvas.width = image.width;

    var imageRatio = image.width / image.height;
    var canvasRatio = this.canvasesContainer.clientWidth / this.canvasesContainer.clientHeight;

    var scale = imageRatio > canvasRatio ?
      (this.canvasesContainer.clientWidth / image.width) : this.canvasesContainer.clientHeight / image.height;

    if (this.canvasesContainer.clientWidth >= image.width && this.canvasesContainer.clientHeight >= image.height) {
      scale = 1;
    }

    this.scale = scale;
    this.nativeScale = scale;

    this.originalImage = image;

    image.id = this.runningImageId++;

    var initKonvaLib = new Promise((resolve) => {

      this.konvaLib = new KonvaLib({
        containerId: "konvaImagesContainer",
        transformersContainerId: "konvaTransformersContainer",
        width: image.width,
        height: image.height,
        initialScale: this.nativeScale
      }, () => {
        resolve();
      });

    });

    await initKonvaLib;

    var konvaImage = this.konvaLib.addImage(image, {
      targetable: true
    });

    this.rotateOriginOffsetX = konvaImage.width() / 2;
    this.rotateOriginOffsetY = konvaImage.height() / 2;

    this.undoRedoLib.addKonvaImageUndoRedoEvents(konvaImage, this.konvaLib);

    document.getElementById("konvaImagesContainer").style.pointerEvents = "auto";

    var first = true;
    var timeout;

    this.konvaLib.stage.on("mousemove", (e) => {

      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }

      timeout = window.requestAnimationFrame(() => {

        this.konvaTarget = e.target;
        if (this.konvaTarget instanceof Konva.Image) {
          this.konvaLib.previewTargetImage(e.target);
        }
      });

    });

    this.konvaLib.stage.on("click", (e) => {
      if (e.evt.button === 2) return;
      if (e.target instanceof Konva.Image) {
        console.log("targeting")
        var targeted = this.konvaLib.targetImage(e.target);
        if (targeted) this.dispatchEvent("imageTargetChange", [e.target]);
      }
    });

    this.initKonva(image);

    this.drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.drawingCanvas.width = image.width;
    this.drawingCanvas.height = image.height;

    CanvasLib.copyCanvasProperties(this.drawingCanvas, this.cursorCanvas);
    CanvasLib.copyCanvasProperties(this.drawingCanvas, this.colorPickerCanvas);

    this.konvaImagesContainer.firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.konvaImagesContainer.firstElementChild.style.position = `absolute`;
    this.konvaImagesContainer.style.overflow = "hidden";

    this.konvaTransformersContainer.firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.konvaTransformersContainer.firstElementChild.style.position = `absolute`;
    this.konvaTransformersContainer.style.overflow = "hidden";

    this.imagesWithNoFilters = [image];

    var imageAsCanvas = await imageConversion.imagetoCanvas(image);

    this.pixiApp = PixiLib.appFromImage(imageAsCanvas.toDataURL());

    var konvaDrawingCanvas = CanvasLib.cloneCanvas(this.drawingCanvas);
    var konvaCursorCanvas = CanvasLib.cloneCanvas(this.drawingCanvas);

    let options = {
      draggable: false,
      enableTransformer: false,
      zIndex: 10,
      addToMainLayer: true,
      preventTarget: true
    }

    this.konvaDrawingCanvas = konvaDrawingCanvas;
    this.konvaDrawingCanvasNode = this.konvaLib.addImage(konvaDrawingCanvas, options);
    this.konvaCursorCanvas = konvaCursorCanvas;
    this.konvaCursorCanvasNode = this.konvaLib.addImage(konvaCursorCanvas, options);

    this.softBrush = new SoftBrush(this.drawingCanvas, {
      size: this.defaultBrushSize / this.scale,
      hardness: this.defaultBrushHardness,
      cursorCanvas: this.cursorCanvas,
      color: [255, 255, 255, 1],
      brushPreviewEnabled: true,
      canvasScale: this.scale,
      enabled: false
    });

    var redrawCounter = 0;

    this.softBrush.on("draw", () => {

      if (redrawCounter++ >= 100) {
        console.log("draw")
        redrawCounter = 0;
        this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getDrawingUndoRedo());
      }

    });

    this.softBrush.on("drawbegin", () => {
      console.log("drawbegin")
      this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getDrawingUndoRedo());
    });

    this.imageInstanced = true;

    this.enableDrawingColorPicker();
    this.enableBackgroundColorPicker();
    this.enableDrawing();

    this.konvaDrawingCanvasNode.listening(false);
    this.konvaCursorCanvasNode.listening(false);

    var thumbnailImageFile = await readAndCompressImage(file, {
      quality: 1,
      maxWidth: 150,
      maxHeight: 150
    });

    var thumbnailImageURL = await imageConversion.filetoDataURL(thumbnailImageFile);

    var thumbnailImage = await imageConversion.urltoImage(thumbnailImageURL);

    this.filterPreviews.push([
      konvaImage,
      this.generateFilterPreviewImages(thumbnailImage)
    ]);

    setTimeout(() => {
      document.getElementById("move-tool-icon").click();
    }, 50)

    this.dispatchEvent("loadImage", [{
      konvaImage: konvaImage,
      imageObj: image
    }]);

    this.dispatchEvent("imageTargetChange", [konvaImage]);

  }

  async importImage(file) {

    var buffer = await file.arrayBuffer();

    var imageObj = await this.imageLib.bufferToImage(buffer);

    if (this.options.downscaleImage) {
      if (imageObj.width > this.options.maxImageSize || imageObj.height > this.options.maxImageSize) {
        console.log(this.options.maxImageSize / Math.max(imageObj.width, imageObj.height))

        file = await readAndCompressImage(file, {
          quality: 1,
          maxWidth: this.options.maxImageSize,
          maxHeight: this.options.maxImageSize
        });

        let url = await imageConversion.filetoDataURL(file);
        imageObj = await imageConversion.dataURLtoImage(url);
      }
    }

    imageObj.id = this.runningImageId++;

    var konvaImage = this.konvaLib.addImage(imageObj, {
      targetable: true
    });

    this.undoRedoLib.addKonvaImageUndoRedoEvents(konvaImage, this.konvaLib);

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getImageAddUndoRedo(konvaImage));

    // this.konvaLib.rearrangeImagesWithNodeLast(this.konvaDrawingCanvasNode);

    // this.konvaLib.bringTransformersToFront();

    this.imagesWithNoFilters.push(imageObj);

    var thumbnailImageFile = await readAndCompressImage(file, {
      quality: 1,
      maxWidth: 150,
      maxHeight: 150
    });

    var thumbnailImageURL = await imageConversion.filetoDataURL(thumbnailImageFile);

    var thumbnailImage = await imageConversion.urltoImage(thumbnailImageURL);

    this.filterPreviews.push([
      konvaImage,
      this.generateFilterPreviewImages(thumbnailImage)
    ]);

    this.dispatchEvent("importImage", [{
      konvaImage: konvaImage,
      imageObj: imageObj
    }]);

    this.dispatchEvent("imageTargetChange", [konvaImage]);

  }

  deleteSelectedImage() {
    if (!this.konvaTarget instanceof this.Konva.Image) return;
    this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getImageDeleteUndoRedo(this.konvaTarget));
    this.konvaLib.deleteImage(this.konvaTarget);
  }

  bringSelectedImageToFront() {
    if (!this.konvaTarget instanceof this.Konva.Image) return;
    this.konvaLib.bringImageToFront(this.konvaTarget);
  }

  getFilterPreviewImages(konvaImage) {

    var filterPreview = [];

    this.filterPreviews.forEach((preview) => {
      if (preview[0].photoEditorId === konvaImage.photoEditorId) filterPreview = preview[1];
    });

    return filterPreview;
  }

  generateFilterPreviewImages(image) {

    var filterPreviewImages = [];

    this.selectableFilters.forEach((filterName) => {

      var pixiApp = PixiLib.reuseAppWithImage(this.pixiApp, image);
      PixiLib.setImageFilter(pixiApp, filterName);
      var appImage = PixiLib.imageFromApp(pixiApp);

      filterPreviewImages.push(appImage);

    });

    return filterPreviewImages;

  }

  setSelectedFont(fontName) {
    this.selectedFont = fontName;
    if (this.konvaTextTarget) {
      this.konvaTextTarget.fontFamily(fontName);
      var transformer = this.konvaLib.getNodeTransformer(this.konvaTextTarget, this.layer);
      if (transformer) transformer.forceUpdate();
      this.stage.batchDraw();
    }

  }

  addText(e) {

    this.focusCanvasContainer("overlayCanvasContainer")

    var layer = this.layer;

    var scaleOffsetX = this.originalImage.width * (this.scale - this.nativeScale) / this.scale / 2;
    var scaleOffsetY = this.originalImage.height * (this.scale - this.nativeScale) / this.scale / 2;

    var zoomOffsetLeftOriginX = this.offsetLeftOriginX / this.scale * -1;
    var zoomOffsetLeftOriginY = this.offsetLeftOriginY / this.scale * -1;

    var zoomOffsetX = this.offsetX / this.scale * -1;
    var zoomOffsetY = this.offsetY / this.scale * -1;

    if (this.nativeScale > this.scale) {
      scaleOffsetX = scaleOffsetY = zoomOffsetLeftOriginX = zoomOffsetLeftOriginY = zoomOffsetX = zoomOffsetY = 0;
    }

    var textPositionX = this.layer.offsetX() + scaleOffsetX + zoomOffsetLeftOriginX + zoomOffsetX;
    var textPositionY = this.layer.offsetY() + scaleOffsetY + zoomOffsetLeftOriginY + zoomOffsetY;

    console.log(this.layer.offsetX(), e.evt.offsetX)

    var text = new Konva.Text({
      x: this.layer.offsetX() + e.evt.offsetX,
      y: this.layer.offsetY() + e.evt.offsetY,
      text: 'Simple Text',
      fontSize: 70 / this.scale,
      fontFamily: this.selectedFont,
      fill: this.selectedTextColor.rgbaString,
      draggable: false
    });

    // text.x(text.x() < this.layer.offsetX() ? this.layer.offsetX() : text.x());
    // text.y(text.y() < this.layer.offsetY() ? this.layer.offsetY() : text.y());

    text.on("mousedown", (e) => {
      e.evt.cancelBubble = true
    })

    text.on("dragstart", (e) => {
      this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getTextTransformUndoRedo(text));
    });

    layer.add(text);

    var transformer = new Konva.Transformer({
      nodes: [text],
      rotateAnchorOffset: 60,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      anchorSize: Math.max(5, this.nativeScale ? 15 / this.nativeScale : 15),
      rotationSnaps: [0, 90, 180, 270],
      borderStroke: "rgb(0 149 255)",
      anchorStroke: "rgb(0 149 255)",
      anchorCornerRadius: this.nativeScale ? 30 / this.nativeScale : 30,
      anchorStrokeWidth: this.nativeScale ? 1 / this.nativeScale : 1,
      anchorFill: "rgba(255, 255, 255, 0.5)"
    })

    transformer.on("mousedown", (e) => {
      e.evt.cancelBubble = true
      this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getTextTransformUndoRedo(text));
    })

    layer.add(transformer);

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getTextAddUndoRedo(text, transformer));

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

      this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getTextTransformUndoRedo(text));

      this.editingText = true;

      text.hide();
      transformer.hide();
      layer.draw();

      var textPosition = text.absolutePosition();

      var stageBox = this.stage.container().getBoundingClientRect();

      var containerOffsetX = Math.max(0, (this.konvaImagesContainer.offsetWidth - this.stage.width() * this.scale) / 2);
      var containerOffsetY = Math.max(0, (this.konvaImagesContainer.offsetHeight - this.stage.height() * this.scale) / 2);

      var scaleZoomOffsetX = (this.canvasesContainer.clientWidth - this.konvaImagesContainer.firstElementChild.offsetWidth * this.scale) / 2;
      var scaleZoomOffsetY = (this.canvasesContainer.clientHeight - this.konvaImagesContainer.firstElementChild.offsetHeight * this.scale) / 2;

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

      // added (text.fontSize() * text.getAbsoluteScale().x * this.scale * 0.5) to fix jumping to another line for some reason. adds 0.5 * fontsize to width to fix this
      textarea.style.width = text.width() * text.getAbsoluteScale().x * this.scale - text.padding() * 2 + (text.fontSize() * text.getAbsoluteScale().x * this.scale * 0.5) + 'px';

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

    this.konvaImagesContainer.style.cursor = "grabbing";

    this.dragModeEventHandler = (e) => {

      this.offsetX += e.movementX;
      this.offsetY += e.movementY;
      //this.canvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.konvaImagesContainer.firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.konvaTransformersContainer.firstElementChild.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.drawingCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.cursorCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      this.colorPickerCanvas.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
      if (this.konvaReady) this.konvaJsContent.style.transform = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }

    this.dragModeMouseupEventHandler = (e) => {
      this.endDragMode();
    }

    this.dragModeMouseoutEventHandler = (e) => {
      this.endDragMode();
    }

    this.canvasesContainer.addEventListener("mousemove", this.dragModeEventHandler);
    this.canvasesContainer.addEventListener("mouseup", this.dragModeMouseupEventHandler);
    this.canvasesContainer.addEventListener("mouseout", this.dragModeMouseoutEventHandler);
  }

  endDragMode() {
    this.canvasesContainer.removeEventListener("mousemove", this.dragModeEventHandler);
    this.canvasesContainer.removeEventListener("mouseup", this.dragModeMouseupEventHandler);
    this.canvasesContainer.removeEventListener("mouseout", this.dragModeMouseoutEventHandler);
  }

  enableColorPickerMode() {

    var initColorPickerMode = () => {

      var timeout;

      this.colorPickerMoveEventHandler = (e) => {

        console.log("moving")

        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        timeout = window.requestAnimationFrame(() => {

          if (this.colorPickerModeDisabled) return;

          //var pos = this.konvaLib.stage.getPointerPosition();

          var pos = {x: e.offsetX, y: e.offsetY};

          var x = pos.x * this.scale;
          var y = pos.y * this.scale;

          var offsetX = (this.canvasesContainer.clientWidth - this.konvaImagesContainer.firstElementChild.clientWidth * this.scale) / 2;
          var offsetY = (this.canvasesContainer.clientHeight - this.konvaImagesContainer.firstElementChild.clientHeight * this.scale) / 2;

          /*
          cursorImage.style.left = this.offsetLeftOriginX + this.offsetX + offsetX + x * this.scale + -1 +"px";
          cursorImage.style.top = this.offsetLeftOriginY + this.offsetY + offsetY + y *this.scale - 15 +"px";

          colorPreview.style.left = this.offsetLeftOriginX + this.offsetX + offsetX + e.offsetX * this.scale + 8 + "px";
          colorPreview.style.top = this.offsetLeftOriginY + this.offsetY + offsetY + e.offsetY * this.scale + -4 + "px"; */

          this.colorPickerCursorImage.style.left = this.offsetLeftOriginX + this.offsetX + x + offsetX - 1 + "px";
          this.colorPickerCursorImage.style.top = this.offsetLeftOriginY + this.offsetY + y + offsetY - 16 + "px";

          this.colorPickerColorPreview.style.left = this.offsetLeftOriginX + this.offsetX + x + offsetX + 8 + "px";
          this.colorPickerColorPreview.style.top = this.offsetLeftOriginY + this.offsetY + y + offsetY - 4 + "px";

          var konvaAsCanvas = this.stage.toCanvas();
          var konvaImagesAsCanvas = this.konvaLib.stage.toCanvas();

          var textCanvasColor = konvaAsCanvas.getContext("2d").getImageData(pos.x, pos.y, 1, 1).data;
          var konvaImagesColor = konvaImagesAsCanvas.getContext("2d").getImageData(pos.x, pos.y, 1, 1).data;
          var drawingCanvasColor = this.drawingCanvas.getContext("2d").getImageData(pos.x, pos.y, 1, 1).data;

          if (konvaImagesColor[3] > 0) {
            var color = konvaImagesColor;
          }

          if (drawingCanvasColor[3] > 0) {
            var color = drawingCanvasColor;
          }

          if (textCanvasColor[3] > 0) {
            var color = textCanvasColor;
          }

          this.colorPickerColorPreview.style.backgroundColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;

        });

      }

      this.colorPickerClickEventHandler = (e) => {

        if (this.colorPickerModeDisabled) return;

        //var pos = this.konvaLib.stage.getPointerPosition();

        var pos = {x: e.offsetX, y: e.offsetY};

        var x = pos.x;
        var y = pos.y;

        var konvaAsCanvas = this.stage.toCanvas();
        var konvaImagesAsCanvas = this.konvaLib.stage.toCanvas();

        var textCanvasColor = konvaAsCanvas.getContext("2d").getImageData(pos.x, pos.y, 1, 1).data;
        var konvaImagesColor = konvaImagesAsCanvas.getContext("2d").getImageData(pos.x, pos.y, 1, 1).data;
        var drawingCanvasColor = this.drawingCanvas.getContext("2d").getImageData(pos.x, pos.y, 1, 1).data;

        if (konvaImagesColor[3] > 0) {
          var color = konvaImagesColor;
        }

        if (drawingCanvasColor[3] > 0) {
          var color = drawingCanvasColor;
        }

        if (textCanvasColor[3] > 0) {
          var color = textCanvasColor;
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

        if (this.colorPickerModeDisabled) return;

        this.colorPickerCursorImage.style.visibility = "hidden";
        this.colorPickerColorPreview.style.visibility = "hidden";

      }

      this.colorPickerMouseinEventHandler = (e) => {

        if (this.colorPickerModeDisabled) return;

        this.colorPickerCursorImage.style.visibility = "visible";
        this.colorPickerColorPreview.style.visibility = "visible";

      }

      this.colorPickerCanvas.addEventListener("mousemove", this.colorPickerMoveEventHandler);
      /* this.stage.on("mousemove", (e) => {
        var textCanvasColor = this.konvaJsContent.firstElementChild.getContext("2d").getImageData(e.evt.clientX / this.scale, e.clientY / this.scale, 1, 1).data;
      }) */
      this.colorPickerCanvas.addEventListener("mouseover", this.colorPickerMouseinEventHandler);
      this.colorPickerCanvas.addEventListener("mouseout", this.colorPickerMouseoutEventHandler);
      this.colorPickerCanvas.addEventListener("click", this.colorPickerClickEventHandler);

      this.colorPickerModeInitialized = true;
    }

    this.colorPickerModeDisabled = false;

    this.focusCanvasContainer("colorPickerCanvasContainer");

    this.colorPickerCanvas.style.cursor = "none";

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

    if (!this.colorPickerModeInitialized) initColorPickerMode();

  }

  disableColorPickerMode() {

    if (!this.colorPickerCursorImage) return;

    this.canvasesContainer.removeChild(this.colorPickerCursorImage);
    this.canvasesContainer.removeChild(this.colorPickerColorPreview);

    this.colorPickerModeDisabled = true;

  }

  async rotate(preventUndoCache) {

    if (!preventUndoCache) this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getRotateUndoRedo());

    /*
    var degToRad = Math.PI / 180

    var rotatePoint = ({x, y}, deg) => {
        var rcos = Math.cos(deg * degToRad), rsin = Math.sin(deg * degToRad)
        return {x: x*rcos - y*rsin, y: y*rcos + x*rsin}
    }

    //current rotation origin (0, 0) relative to desired origin - center (node.width()/2, node.height()/2)
    var topLeft = {x:-this.konvaLib.imagesLayer.width()/2, y:-this.konvaLib.imagesLayer.height()/2}
    var current = rotatePoint(topLeft, this.konvaLib.imagesLayer.rotation())
    var rotated = rotatePoint(topLeft, 90)
    var dx = rotated.x - current.x, dy = rotated.y - current.y

    console.log(this.konvaLib.imagesLayer.x(), this.konvaLib.imagesLayer.y(), this.konvaLib.imagesLayer.offsetX(), this.konvaLib.imagesLayer.offsetY())
    console.log(dx, dy)

    this.konvaLib.imagesLayer.rotation(90)
    this.konvaLib.imagesLayer.x(this.konvaLib.imagesLayer.x() + dx)
    this.konvaLib.imagesLayer.y(this.konvaLib.imagesLayer.y() + dy) */

    /*
    var x = this.rotateOriginOffsetX;
    var y = this.rotateOriginOffsetY; */


    /*
    var x = this.konvaLib.imagesLayer.x() - this.cropOffsetX;
    var y = this.konvaLib.imagesLayer.y() - this.cropOffsetY; */


    /*
    var x = this.konvaLib.imagesLayer.x();
    var y = this.konvaLib.imagesLayer.y(); */

    var rotatePoint = ({ x, y }, rad) => {
      var rcos = Math.cos(rad);
      var rsin = Math.sin(rad);
      return { x: x * rcos - y * rsin, y: y * rcos + x * rsin };
    };

    // will work for shapes with top-left origin, like rectangle
    function rotateAroundCenter(node, rotation) {
      //current rotation origin (0, 0) relative to desired origin - center (node.width()/2, node.height()/2)
      var topLeft = { x: -node.width() / 2, y: -node.height() / 2 };
      var current = rotatePoint(topLeft, Konva.getAngle(node.rotation()));
      var rotated = rotatePoint(topLeft, Konva.getAngle(rotation));
      var dx = rotated.x - current.x,
        dy = rotated.y - current.y;

      node.rotation(rotation);
      node.x(node.x() + dx);
      node.y(node.y() + dy);
    }

    // then use it
    //rotateAroundCenter(this.konvaLib.imagesLayer, 90);

    var width = this.konvaLib.imagesLayer.width();
    var height = this.konvaLib.imagesLayer.height();

    /*
    var x = this.konvaLib.imagesLayer.width() / 2;
    var y = this.konvaLib.imagesLayer.height() / 2;



    this.konvaLib.imagesLayer.x(y);
    this.konvaLib.imagesLayer.y(x);


    this.konvaLib.imagesLayer.rotate(90); */

    this.konvaLib.rotateLayerContents(this.konvaLib.imagesLayer);

    this.konvaLib.stage.size({
      width: this.konvaLib.stage.height(),
      height: this.konvaLib.stage.width(),
    })

    //if (this.konvaLib.count === 2) return;

    /*
    this.konvaLib.imagesLayer.add(new Konva.Rect({
      width: this.konvaLib.imagesLayer.width(),
      height: this.konvaLib.imagesLayer.height(),
      x: 0,
      y: 0,
      fill: "grey",
      draggable: true
    })) */

    //this.konvaLib.imagesLayer.rotate(90);

    /*
    this.konvaLib.imagesLayer.x(0)
    this.konvaLib.imagesLayer.y(0)

    this.konvaLib.stage.draw() */

    /*
    var offsetX = this.konvaLib.stage.offsetX();
    var offsetY = this.konvaLib.stage.offsetY();

    this.konvaLib.stage.x(offsetY);
    this.konvaLib.stage.y(offsetX); */

    this.konvaLib.backgroundImage.size({
      width: this.konvaLib.backgroundImage.height(),
      height: this.konvaLib.backgroundImage.width(),
    });

    this.konvaLib.colorBackgroundImage.size({
      width: this.konvaLib.colorBackgroundImage.height(),
      height: this.konvaLib.colorBackgroundImage.width(),
    });

    /*
    var ctx = this.konvaDrawingCanvas.getContext("2d");
    var drawingImageData = ctx.getImageData(0, 0, this.konvaDrawingCanvas.width, this.konvaDrawingCanvas.height);

    console.log(this.konvaDrawingCanvasNode.width()) */

    /*
    this.konvaDrawingCanvas.width = this.konvaDrawingCanvasNode.height();
    this.konvaDrawingCanvas.height = this.konvaDrawingCanvasNode.width(); */

    /*
    this.konvaDrawingCanvasNode.size({
      width: this.konvaDrawingCanvasNode.height(),
      height: this.konvaDrawingCanvasNode.width(),
    });

    this.konvaCursorCanvas.width = this.konvaCursorCanvasNode.height();
    this.konvaCursorCanvas.height = this.konvaCursorCanvasNode.width();

    this.konvaCursorCanvasNode.size({
      width: this.konvaCursorCanvasNode.height(),
      height: this.konvaCursorCanvasNode.width(),
    }); */

    //ctx.putImageData(drawingImageData, 0, 0);

    this.konvaLib.mainLayer.size({
      width: this.konvaLib.stage.width(),
      height: this.konvaLib.stage.height(),
    });

    this.konvaLib.transformersStage.size({
      width: this.konvaLib.stage.width(),
      height: this.konvaLib.stage.height(),
    });

    this.konvaLib.transformersStageMainLayer.size({
      width: this.konvaLib.stage.width(),
      height: this.konvaLib.stage.height(),
    });

    this.konvaLib.updateTransformers(this.konvaLib.transformersStageMainLayer);
    //this.konvaLib.recreateTransformersStageTransformers();

    this.konvaLib.stage.draw();
    this.konvaLib.transformersStage.draw();

    CanvasLib.rotateCanvas(this.drawingCanvas);
    CanvasLib.rotateCanvasSize(this.cursorCanvas);
    CanvasLib.rotateCanvas(this.colorPickerCanvas);


    this.stage.width(this.konvaLib.stage.width());
    this.stage.height(this.konvaLib.stage.height());

    var canvasContainer = this.canvasesContainer;

    var imageRatio = this.konvaLib.stage.width() / this.konvaLib.stage.height();
    var canvasRatio = canvasContainer.clientWidth / canvasContainer.clientHeight;

    var scale = imageRatio > canvasRatio ?
      (canvasContainer.clientWidth / this.konvaLib.stage.width()) : canvasContainer.clientHeight / this.konvaLib.stage.height();

    if (canvasContainer.clientWidth >= this.konvaLib.stage.width() && canvasContainer.clientHeight >= this.konvaLib.stage.height()) {
      scale = 1;
    }

    this.scale = scale;

    var transformString = `translate(${this.offsetLeftOriginX}px, ${this.offsetLeftOriginY}px) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;

    this.konvaImagesContainer.firstElementChild.style.transform = transformString;
    this.konvaTransformersContainer.firstElementChild.style.transform = transformString;
    this.drawingCanvas.style.transform = transformString;
    this.cursorCanvas.style.transform = transformString;
    this.colorPickerCanvas.style.transform = transformString;
    document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = transformString

  }

  deleteSelectedText() {
    if (!(this.konvaTarget instanceof Konva.Text)) return;
    this.deleteText(this.konvaTarget);
  }

  deleteText(text) {

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getTextDeleteUndoRedo(text));

    var transformer = this.konvaLib.getNodeTransformer(text, this.layer);

    transformer.detach();

    text.remove();
    this.layer.draw();

    return [text, transformer];
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

  beginCrop() {

    this.focusCanvasContainer("cropDummyCanvasContainer");

    document.getElementById("overlayCanvasContainer").style.visibility = "hidden";

    var cropDummyCanvas = document.getElementById("cropDummyCanvas");

    cropDummyCanvas.parentElement.style.visibility = "visible";
    cropDummyCanvas.parentElement.style.pointerEvents = "auto";

    var konvaImagesCanvas = this.konvaLib.stage.toCanvas();

    cropDummyCanvas.width = konvaImagesCanvas.width;
    cropDummyCanvas.height = konvaImagesCanvas.height;

    cropDummyCanvas.style.transform = this.konvaImagesContainer.firstElementChild.style.transform;

    var ctx = cropDummyCanvas.getContext("2d");

    ctx.drawImage(konvaImagesCanvas, 0, 0);
    ctx.drawImage(this.stage.toCanvas(), 0, 0);
    ctx.drawImage(this.drawingCanvas, 0, 0);

    var cropper = new Cropper(cropDummyCanvas, {
      crop(event) {
      },
    });

    this.cropper = cropper;
  }

  endCrop() {

    document.getElementById("overlayCanvasContainer").style.visibility = "visible";

    var cropDummyCanvas = document.getElementById("cropDummyCanvas");

    cropDummyCanvas.parentElement.style.visibility = "hidden";
    cropDummyCanvas.parentElement.style.pointerEvents = "none";

    this.cropper.destroy();

    document.getElementById("move-tool-icon").click();
  }

  async acceptCrop() {

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getCropUndoRedo());

    document.getElementById("overlayCanvasContainer").style.visibility = "visible";

    var cropDummyCanvas = document.getElementById("cropDummyCanvas");

    cropDummyCanvas.parentElement.style.visibility = "hidden";
    cropDummyCanvas.parentElement.style.pointerEvents = "none";

    var cropData = this.cropper.getData();

    cropData.x = Math.floor(cropData.x);
    cropData.y = Math.floor(cropData.y);
    cropData.width = Math.floor(cropData.width);
    cropData.height = Math.floor(cropData.height)

    this.layer.offsetX(Math.floor(this.layer.offsetX() + cropData.x));
    this.layer.offsetY(Math.floor(this.layer.offsetY() + cropData.y));

    this.stage.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    })

    this.layer.draw();

    this.konvaLib.replaceImages(this.imagesWithNoFilters, 0);

    this.konvaLib.cropImages(cropData);

    this.replaceImagesWithNoFilters(await this.konvaLib.getImageObjects(this.konvaLib.imagesLayer));

    this.reapplyImageFilters();

    /*
    this.konvaLib.transformersStageMainLayer.x(this.konvaLib.transformersStageMainLayer.x() + cropData.x * -1);
    this.konvaLib.transformersStageMainLayer.y(this.konvaLib.transformersStageMainLayer.y() + cropData.y * -1); */

    /*
    this.konvaLib.transformersStage.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    }); */
    /*
    this.konvaLib.transformersStageMainLayer.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    }); */
    /*
    var x = this.konvaLib.imagesLayer.x() - this.cropOffsetX;
    var y = this.konvaLib.imagesLayer.y() - this.cropOffsetY;

    this.cropOffsetX += cropData.x * -1;
    this.cropOffsetY += cropData.y * -1; */

    /*
    this.konvaLib.imagesLayer.x(x + this.cropOffsetX);
    this.konvaLib.imagesLayer.y(y + this.cropOffsetY); */
    /*
    this.konvaLib.stage.x(this.konvaLib.stage.x() + cropData.x * -1);
    this.konvaLib.stage.y(this.konvaLib.stage.y() + cropData.y * -1); */

    this.konvaLib.stage.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    });

    this.konvaLib.imagesLayer.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    });

    var diffX = Math.floor(cropData.width) / 2 - this.konvaLib.imagesLayer.offsetX();
    var diffY =  Math.floor(cropData.height) / 2 - this.konvaLib.imagesLayer.offsetY();

    this.konvaLib.imagesLayer.offsetX(Math.floor(cropData.width) / 2);
    this.konvaLib.imagesLayer.offsetY(Math.floor(cropData.height) / 2);

    this.konvaLib.imagesLayer.x(this.konvaLib.imagesLayer.x() + diffX);
    this.konvaLib.imagesLayer.y(this.konvaLib.imagesLayer.y() + diffY);

    this.konvaLib.fixLayerContentsPositioning(this.konvaLib.imagesLayer);

    if (this.konvaLib.imagesLayerRotation === 90 || this.konvaLib.imagesLayerRotation === 270) {
      this.konvaLib.imagesLayer.offsetX(cropData.height / 2);
      this.konvaLib.imagesLayer.offsetY(cropData.width / 2);

      this.konvaLib.imagesLayer.x(cropData.height / 2);
      this.konvaLib.imagesLayer.y(cropData.width / 2);
    } else {
      this.konvaLib.imagesLayer.offsetX(cropData.width / 2);
      this.konvaLib.imagesLayer.offsetY(cropData.height / 2);

      this.konvaLib.imagesLayer.x(cropData.width / 2);
      this.konvaLib.imagesLayer.y(cropData.height / 2);
    }

/*    this.konvaLib.imagesCroppingLayer.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    }); */

    /*
    this.konvaLib.mainLayer.size({
      width: Math.floor(cropData.width),
      height: Math.floor(cropData.height)
    }); */

    //this.konvaLib.transformersStage.batchDraw();
    this.konvaLib.stage.batchDraw();

    var ctx = this.drawingCanvas.getContext("2d");
    var drawingImageData = ctx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

    this.drawingCanvas.width = Math.floor(cropData.width);
    this.drawingCanvas.height = Math.floor(cropData.height);

    console.log(cropData.x, cropData.y)

    ctx.putImageData(drawingImageData, cropData.x * -1, cropData.y * -1);

    this.cursorCanvas.width = Math.floor(cropData.width);
    this.cursorCanvas.height = Math.floor(cropData.height);

    this.colorPickerCanvas.width = Math.floor(cropData.width);
    this.colorPickerCanvas.height = Math.floor(cropData.height);

    this.cropper.destroy();

    document.getElementById("move-tool-icon").click();

    /*
    this.konvaLib.imagesLayer.add(new Konva.Rect({
      width: this.konvaLib.imagesLayer.width(),
      height: this.konvaLib.imagesLayer.height(),
      x: 0,
      y: 0,
      fill: "gray",
      draggable: true
    })); */

  }

  enableDrawing() {

    var checkIfAnyUndo = () => {

      var undoCache = this.undoRedoLib.typesLib.getUndoCache();

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

    var canvasCursor = new CanvasCursor(this.konvaImagesContainer.firstElementChild, document.getElementById("drawingCanvasCursor"), {
      canvasScale: 1,
      cursorSize: this.softBrush.getSize() * this.scale,
      cursorParent: this.canvasesContainer
    });

    canvasCursor.setCursorColor([0, 0, 0, 1])

    this.drawingCanvasCursor = canvasCursor;

    this.drawingEnabled = true;

  }

  disableDrawingCanvas() {
    //this.konvaDrawingCanvasNode.listening(false);
    //this.konvaCursorCanvasNode.listening(false);
    this.softBrush.enabled = false;
    //this.konvaLib.stage.draw();
  }

  enableDrawingCanvas() {
    //this.konvaDrawingCanvasNode.listening(true);
    //this.konvaCursorCanvasNode.listening(true);
    this.softBrush.enabled = true;
    //this.konvaLib.stage.draw();
  }

  changeDrawingColor(color) {

    this.selectedDrawingColor = color;

  }

  setBrushSize(value) {
    console.log(value, this.scale)
    this.softBrush.setSize(value / this.scale);
  }

  enableDrawingEraser() {
    if (this.softBrush) this.softBrush.enableEraseMode();
  }

  disableDrawingEraser() {
    if (this.softBrush) this.softBrush.disableEraseMode();
  }

  eraseAllDrawing() {

    this.undoRedoLib.addToUndoCache(this.undoRedoLib.typesLib.getDrawingUndoRedo());
    this.softBrush.canvas.getContext("2d").clearRect(0, 0, this.konvaLib.stage.width(), this.konvaLib.stage.height());
    this.konvaLib.stage.batchDraw();

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
      if (this.konvaTextTarget) this.konvaTextTarget.fill(color.rgbaString);
      document.getElementById("text-color-picker-button").style.backgroundColor = color.rgbaString;
      this.stage.batchDraw();
    });
    this.selectedTextColor = this.textColorPicker.color;
  }

  enableBackgroundColorPicker() {
    if (this.backgroundColorPicker) return;
    this.backgroundColorPicker = this.getDefaultColorPicker("#background-color-picker");
    this.backgroundColorPicker.on("color:change", (color) => {
      this.selectedBackgroundColor = color;
      document.getElementById("background-color-picker-button").style.backgroundColor = color.rgbaString;
      this.konvaLib.setBackgroundColor(color.rgbaString);
    });
    this.selectedBackgroundColor = this.backgroundColorPicker.color;
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
    document.getElementById("konvaTransformersContainer").style.pointerEvents = id === "konvaTransformersContainer" ? "auto" : "none";
    document.getElementById("cropDummyCanvasContainer").style.pointerEvents = id === "konvaImagesContainer" ? "auto" : "none";
    document.getElementById("colorPickerCanvasContainer").style.pointerEvents = id === "colorPickerCanvasContainer" ? "auto" : "none";
  }

  exportImage() {

    if (this.selectedTool === "addText") this.removeAllAnchors();

    var downloadCanvas = document.createElement("canvas");
    downloadCanvas.width = this.konvaLib.stage.width();
    downloadCanvas.height = this.konvaLib.stage.height();

    var downloadCtx = downloadCanvas.getContext("2d");

    var selectedImage = this.konvaLib.selectedTargetImage;
    this.konvaLib.unTargetImage(selectedImage);

    var previewedImage = this.konvaLib.previewedTargetImage;
    this.konvaLib.unPreviewTargetImage(previewedImage);

    if (this.konvaLib.backgroundImageColor === "transparent") this.konvaLib.hideImage(this.konvaLib.backgroundImage);

    downloadCtx.drawImage(this.konvaLib.stage.toCanvas(), 0, 0);
    downloadCtx.drawImage(this.stage.toCanvas(), 0, 0);

    if (this.selectedTool === "addText") this.readdAllAnchors();

    download(downloadCanvas, "image.png");

    this.konvaLib.targetImage(selectedImage);
    this.konvaLib.previewTargetImage(previewedImage);
    if (this.konvaLib.backgroundImageColor === "transparent") this.konvaLib.showImage(this.konvaLib.backgroundImage);

    this.dispatchEvent("imageExport", [downloadCanvas])

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

    //var canvas = document.getElementById("canvas");
    var drawingCanvas = document.getElementById("drawingCanvas");

    //var ctx = canvas.getContext("2d");
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    var ctx = drawingCanvas.getContext("2d");
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

    if (this.konvaReady) {

      this.stage.destroyChildren();
      this.konvaLib.stage.listening(false);
      this.stage.remove();

      this.stage = false;
      this.layer = false;
      this.konvaReady = false;

      document.getElementById("overlayCanvasContainer").firstElementChild.remove();

    }

    this.konvaLib.stage.destroyChildren();
    this.konvaLib.stage.listening(false);
    this.konvaLib.stage.remove();
    document.getElementById("konvaImagesContainer").firstElementChild.remove();
    document.getElementById("konvaTransformersContainer").firstElementChild.remove();
    this.konvaLib = false;

    this.softBrush.removeInstance();
    this.softBrush = false;
    this.drawingEnabled = false;

    this.appliedPixiFilters = {};

    this.runningImageId = 1;

    this.texts = [];

    this.offsetX = 0;
    this.offsetY = 0;

    this.filterPreviews = [];

    this.offsetLeftOriginX = 0;
    this.offsetLeftOriginY = 0;

    this.activeTransformers = [];
    this.reattachTextAnchorList = [];
    this.imageInstanced = false;

    this.inCropMode = false;

    this.selectedTool = "";

    this.defaultBrushSize = this.originalOptions.defaultBrushSize ? this.originalOptions.defaultBrushSize : 20;
    this.defaultBrushHardness = this.originalOptions.defaultBrushHardness ? this.originalOptions.defaultBrushHardness : 0.5;

    this.undoRedoLib.clearRedoCache();
    this.undoRedoLib.clearUndoCache();

    this.dispatchEvent("removeImageInstance", []);

  }

}

export default PhotoEditorLib;
