
import UndoRedoTypesLib from "./UndoRedoTypesLib.js";
import CanvasLib from "./CanvasLib.js";

class UndoRedo {

  constructor(parent) {
    this.parent = parent;

    this.undoCache = [];
    this.redoCache = [];

    this.typesLib = new UndoRedoTypesLib(parent);

  }

  replaceImageNodeInCaches(oldImage, newImage) {

    var replace = (undoRedoItem) => {
      if (!undoRedoItem.data.imageNode) return;
      if (undoRedoItem.data.imageNode === oldImage) undoRedoItem.data.imageNode = newImage;
    }

    this.redoCache.forEach(replace);
    this.undoCache.forEach(replace);

  }

  addKonvaImageUndoRedoEvents(konvaImage) {

    console.log("adding image undo events")

    var beforeDragUndoRedo;

    var onDragStart = () => {
      console.log("beginning undo drag")
      beforeDragUndoRedo = this.typesLib.getImageTransformUndoRedo(konvaImage);
    }

    var onDragEnd = () => {
      this.addToUndoCache(beforeDragUndoRedo);
    }

    konvaImage.on("dragstart", onDragStart);

    konvaImage.on("dragend", onDragEnd);

  }

  clearRedoCache() {
    this.redoCache = [];
  }

  clearUndoCache() {
    this.undoCache = [];
  }

  addToRedoCache(redoItem, redoType) {
    if (!redoType) {
      this.redoCache.push(redoItem);
    } else {
      this.redoCache.push({
        data: redoItem,
        type: redoType
      });
    }
  }

  addToUndoCache(undoItem, undoType, isRedo) {

    if (!isRedo) this.clearRedoCache();

    if (!undoType) {
      this.undoCache.push(undoItem);
    } else {
      this.undoCache.push({
        data: undoItem,
        type: undoType
      });
    }
  }

  getUndoCache() {
    return this.undoCache;
  }

  undoRedo(undoOrRedo) {

    var handleUndoRedoCache = (undoRedoItem, undoOrRedo) => {
      if (undoOrRedo === "undo") {
        this.addToRedoCache(undoRedoItem);
        this.undoCache.pop();
        console.log(this.undoCache, this.redoCache)
      } else {
        this.addToUndoCache(undoRedoItem, null, true);
        this.redoCache.pop();
        console.log(this.undoCache, this.redoCache)
      }
    }

    var latestUndoRedo = undoOrRedo === "undo" ? this.undoCache[this.undoCache.length - 1] : this.redoCache[this.redoCache.length -  1];

    if (!latestUndoRedo) return;

    switch (latestUndoRedo.type) {

      case "konva": {

        handleUndoRedoCache(this.typesLib.getKonvaUndoRedo(), undoOrRedo);

        this.parent.layer.destroy();
        this.parent.stage.add(latestUndoRedo.data.layer);

        this.parent.layer = latestUndoRedo.data.layer;

        this.parent.texts = [];

        for (var i = 0; i < latestUndoRedo.data.transformerPairs.length; i++) {
          var pair = latestUndoRedo.data.transformerPairs[i];
          this.parent.texts.push(pair[0]);

          var transformer = new this.parent.Konva.Transformer({
            nodes: [pair[0]],
            rotateAnchorOffset: 60,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
          })

          transformer.on("mousedown", (e) => {
            e.evt.cancelBubble = true
            this.addToUndoCache(this.typesLib.getKonvaUndoRedo());
          })

          this.parent.layer.add(pair[0]);
          this.parent.layer.add(transformer);

        }

        this.parent.layer.batchDraw();

        break;
      }

      case "canvas-resize": {

        handleUndoRedoCache(this.typesLib.getCanvasResizeUndoRedo(), undoOrRedo);

        this.parent.konvaLib.stage.width(latestUndoRedo.data.width);
        this.parent.konvaLib.stage.height(latestUndoRedo.data.height);

        this.parent.konvaLib.backgroundImage.width(latestUndoRedo.data.width);
        this.parent.konvaLib.backgroundImage.height(latestUndoRedo.data.height);

        this.parent.konvaLib.colorBackgroundImage.width(latestUndoRedo.data.width);
        this.parent.konvaLib.colorBackgroundImage.height(latestUndoRedo.data.height);

        this.parent.konvaLib.transformersStage.width(latestUndoRedo.data.width);
        this.parent.konvaLib.transformersStage.height(latestUndoRedo.data.height);

        this.parent.stage.width(latestUndoRedo.data.width);
        this.parent.stage.height(latestUndoRedo.data.height);

        this.parent.konvaLib.stage.batchDraw();
        this.parent.konvaLib.transformersStage.batchDraw();
        this.parent.stage.batchDraw();

        this.parent.dispatchEvent("canvasResize", [latestUndoRedo.data.width, latestUndoRedo.data.height]);

        break;
      }

      case "crop": {

        handleUndoRedoCache(this.typesLib.getCropUndoRedo(), undoOrRedo);

        console.log(latestUndoRedo.data.images)

        console.log(this.undoCache, this.redoCache)

        var replacedImages = this.parent.konvaLib.replaceImages(latestUndoRedo.data.images, 0);

        /*
        for (var i = 0; i < latestUndoRedo.data.images.length; i++) {
          let image = latestUndoRedo.data.images[i];
          this.addKonvaImageUndoRedoEvents(image);
          this.replaceImageNodeInCaches(replacedImages[i], image);

          this.parent.konvaLib.targetImage(image)

        } */

        this.parent.layer.offsetX(latestUndoRedo.data.offsetX);
        this.parent.layer.offsetY(latestUndoRedo.data.offsetY);

        this.parent.stage.size({
          width: Math.floor(latestUndoRedo.data.width),
          height: Math.floor(latestUndoRedo.data.height)
        })

        this.parent.konvaLib.colorBackgroundImage.size({
          width: Math.floor(latestUndoRedo.data.width),
          height: Math.floor(latestUndoRedo.data.height)
        });

        this.parent.konvaLib.backgroundImage.size({
          width: Math.floor(latestUndoRedo.data.width),
          height: Math.floor(latestUndoRedo.data.height)
        });

        this.parent.konvaLib.imagesLayer.x(latestUndoRedo.data.x);
        this.parent.konvaLib.imagesLayer.y(latestUndoRedo.data.y);

        this.parent.konvaLib.transformersStageMainLayer.x(latestUndoRedo.data.x);
        this.parent.konvaLib.transformersStageMainLayer.y(latestUndoRedo.data.y);

        this.parent.konvaLib.imagesLayer.offsetX(latestUndoRedo.data.imagesOffsetX);
        this.parent.konvaLib.imagesLayer.offsetY(latestUndoRedo.data.imagesOffsetY);

        this.parent.konvaLib.transformersStageMainLayer.offsetX(latestUndoRedo.data.imagesOffsetX);
        this.parent.konvaLib.transformersStageMainLayer.offsetY(latestUndoRedo.data.imagesOffsetY);

        this.parent.drawingCanvas.width = Math.floor(latestUndoRedo.data.width);
        this.parent.drawingCanvas.height = Math.floor(latestUndoRedo.data.height);

        this.parent.cursorCanvas.width = Math.floor(latestUndoRedo.data.width);
        this.parent.cursorCanvas.height = Math.floor(latestUndoRedo.data.height);

        this.parent.drawingCanvas.getContext("2d").putImageData(latestUndoRedo.data.drawingImageData, 0, 0);

        this.parent.colorPickerCanvas.width = Math.floor(latestUndoRedo.data.width);
        this.parent.colorPickerCanvas.height = Math.floor(latestUndoRedo.data.height);

        this.parent.konvaLib.transformersStage.size({
          width: Math.floor(latestUndoRedo.data.width),
          height: Math.floor(latestUndoRedo.data.height)
        });

        this.parent.konvaLib.stage.size({
          width: Math.floor(latestUndoRedo.data.width),
          height: Math.floor(latestUndoRedo.data.height)
        });

        this.parent.drawingCanvas.style.transform = latestUndoRedo.data.transform;
        this.parent.cursorCanvas.style.transform = latestUndoRedo.data.transform;
        this.parent.konvaImagesContainer.firstElementChild.style.transform = latestUndoRedo.data.transform;
        this.parent.konvaTransformersContainer.firstElementChild.style.transform = latestUndoRedo.data.transform;

        this.parent.replaceImagesWithNoFilters(latestUndoRedo.data.imagesWithNoFilters);
        //this.parent.reapplyImageFilters();

        this.parent.konvaLib.transformersStage.batchDraw();
        this.parent.konvaLib.stage.batchDraw();

        this.parent.dispatchEvent("cropped", [{
          width: latestUndoRedo.data.width,
          height: latestUndoRedo.data.height,
          x: latestUndoRedo.data.x,
          y: latestUndoRedo.data.y,
        }]);

        break;
      }

      case "rotate": {

        if (undoOrRedo === "undo") {
          this.parent.rotate(true);
          this.parent.rotate(true);
          this.parent.rotate(true);
        } else {
          this.parent.rotate(true);
        }

        this.parent.konvaLib.stage.batchDraw();

        handleUndoRedoCache(latestUndoRedo, undoOrRedo);

        break;
      }

      case "image-transform": {

        var image = this.parent.konvaLib.getImageWithId(latestUndoRedo.data.imageNode.photoEditorId);

        handleUndoRedoCache(this.typesLib.getImageTransformUndoRedo(image), undoOrRedo);

        image.scale(latestUndoRedo.data.scale)
        image.rotation(latestUndoRedo.data.rotation);
        image.offsetX(latestUndoRedo.data.offsetX);
        image.offsetY(latestUndoRedo.data.offsetY);
        image.x(latestUndoRedo.data.x);
        image.y(latestUndoRedo.data.y);
        image.size({
          width: latestUndoRedo.data.width,
          height: latestUndoRedo.data.height
        });

        /*
        var overlayTransformer = this.parent.konvaLib.getImageTransformer(latestUndoRedo.data.imageNode, this.parent.konvaLib.transformersStageMainLayer);
        if (overlayTransformer) overlayTransformer.forceUpdate(); */

        this.parent.konvaLib.stage.batchDraw();
        this.parent.konvaLib.transformersStage.batchDraw();

        break;

      }

      case "image-add": {

        handleUndoRedoCache(this.typesLib.getImageAddUndoRedo(latestUndoRedo.data.imageNode, latestUndoRedo.data.transformer, latestUndoRedo.data.overlayTransformer), undoOrRedo);

        console.log(latestUndoRedo.data.imageNode)
        console.log(this.undoCache, this.redoCache)

        if (undoOrRedo === "undo") {
          this.parent.konvaLib.deleteImageWithId(latestUndoRedo.data.imageNode.photoEditorId);
          latestUndoRedo.data.imageNode.zIndex(latestUndoRedo.data.zIndex);
        } else {
          this.parent.konvaLib.imagesLayer.add(latestUndoRedo.data.imageNode);

          if (latestUndoRedo.data.transformer) {
            latestUndoRedo.data.transformer.nodes([latestUndoRedo.data.imageNode]);
            this.parent.konvaLib.mainLayer.add(latestUndoRedo.data.transformer);
          }

          if (latestUndoRedo.data.overlayTransformer) {
            latestUndoRedo.data.overlayTransformer.nodes([latestUndoRedo.data.imageNode]);
            this.parent.konvaLib.transformersStageMainLayer.add(latestUndoRedo.data.overlayTransformer);
          }
          latestUndoRedo.data.imageNode.zIndex(latestUndoRedo.data.zIndex);
        }

        this.parent.konvaLib.stage.batchDraw();
        this.parent.konvaLib.transformersStage.batchDraw();

        break;

      }

      case "image-delete": {

        handleUndoRedoCache(this.typesLib.getImageDeleteUndoRedo(latestUndoRedo.data.imageNode), undoOrRedo);

        if (undoOrRedo === "undo") {
          this.parent.konvaLib.imagesLayer.add(latestUndoRedo.data.imageNode);
          if (latestUndoRedo.data.transformer) this.parent.konvaLib.mainLayer.add(latestUndoRedo.data.transformer);
          if (latestUndoRedo.data.overlayTransformer) this.parent.konvaLib.transformersStageMainLayer.add(latestUndoRedo.data.overlayTransformer);
          latestUndoRedo.data.imageNode.zIndex(latestUndoRedo.data.zIndex);
        } else {
          this.parent.konvaLib.deleteImageWithId(latestUndoRedo.data.imageNode.photoEditorId);
          latestUndoRedo.data.imageNode.zIndex(latestUndoRedo.data.zIndex);
        }

        this.parent.konvaLib.stage.batchDraw();
        this.parent.konvaLib.transformersStage.batchDraw();

        break;

      }

      case "text-transform": {

        handleUndoRedoCache(this.typesLib.getTextTransformUndoRedo(latestUndoRedo.data.textNode), undoOrRedo);

        var text = latestUndoRedo.data.textNode;

        text.scale(latestUndoRedo.data.scale)
        text.rotation(latestUndoRedo.data.rotation);
        text.offsetX(latestUndoRedo.data.offsetX);
        text.offsetY(latestUndoRedo.data.offsetY);
        text.x(latestUndoRedo.data.x);
        text.y(latestUndoRedo.data.y);
        text.text(latestUndoRedo.data.text);
        text.fill(latestUndoRedo.data.fill);
        text.fontFamily(latestUndoRedo.data.fontFamily);
        text.stroke(latestUndoRedo.data.stroke);

        this.parent.stage.batchDraw();

        break;

      }

      case "text-add": {

        handleUndoRedoCache(this.typesLib.getTextAddUndoRedo(latestUndoRedo.data.textNode, latestUndoRedo.data.transformer), undoOrRedo);

        if (undoOrRedo === "undo") {
          latestUndoRedo.data.textNode.remove();
          if (latestUndoRedo.data.transformer) latestUndoRedo.data.transformer.remove();
          latestUndoRedo.data.textNode.zIndex(latestUndoRedo.data.zIndex);
        } else {
          this.parent.layer.add(latestUndoRedo.data.textNode);
          if (latestUndoRedo.data.transformer) this.parent.layer.add(latestUndoRedo.data.transformer);
          latestUndoRedo.data.textNode.zIndex(latestUndoRedo.data.zIndex);
        }

        this.parent.stage.batchDraw();

        break;

      }

      case "text-delete": {

        handleUndoRedoCache(this.typesLib.getTextDeleteUndoRedo(latestUndoRedo.data.textNode, latestUndoRedo.data.transformer), undoOrRedo);

        if (undoOrRedo === "undo") {
          this.parent.layer.add(latestUndoRedo.data.textNode);
          if (latestUndoRedo.data.transformer) this.parent.layer.add(latestUndoRedo.data.transformer);
          latestUndoRedo.data.textNode.zIndex(latestUndoRedo.data.zIndex);
        } else {
          latestUndoRedo.data.textNode.remove();
          if (latestUndoRedo.data.transformer) latestUndoRedo.data.transformer.remove();
          latestUndoRedo.data.textNode.zIndex(latestUndoRedo.data.zIndex);
        }

        this.parent.stage.batchDraw();

        break;

      }

      case "filter": {

        console.log(latestUndoRedo)

        if (latestUndoRedo.data.remove) {

          var matchingFilter = this.parent.getMatchingFilter(latestUndoRedo.data.filterName, latestUndoRedo.data.imageNode.photoEditorId);

          var undoRedoItem = this.typesLib.getFilterUndoRedo(latestUndoRedo.data.imageNode, matchingFilter[0], matchingFilter[1]);

          handleUndoRedoCache(undoRedoItem, undoOrRedo);

        } else {

          var matchingFilter = this.parent.getMatchingFilter(latestUndoRedo.data.filterName, latestUndoRedo.data.imageNode.photoEditorId);

          if (!matchingFilter) {
            handleUndoRedoCache(this.typesLib.getFilterRemoveUndoRedo(latestUndoRedo.data.imageNode, latestUndoRedo.data.filterName), undoOrRedo);
          } else {
            handleUndoRedoCache(this.typesLib.getFilterUndoRedo(latestUndoRedo.data.imageNode, matchingFilter[0], matchingFilter[1]), undoOrRedo);
          }

        }

        var isAlreadyTargeted = (this.parent.konvaLib.selectedTargetImage === latestUndoRedo.data.imageNode);

        if (!isAlreadyTargeted) {
          this.parent.konvaLib.targetImage(latestUndoRedo.data.imageNode);
        }

        if (latestUndoRedo.data.remove) {
          this.parent.removeAppliedFilter(latestUndoRedo.data.filterName, latestUndoRedo.data.imageNode.photoEditorId);
        } else {
          this.parent.addAppliedFilter(latestUndoRedo.data.filterName, latestUndoRedo.data.values, latestUndoRedo.data.imageNode.photoEditorId);
        }

        var image = this.parent.getSelectedImageWithNoFilters();

        var imageObj = this.parent.getImageWithFilters(image);

        var [newImageNode, oldImageNode] = this.parent.konvaLib.replaceImageWithSameId(imageObj);

        //this.replaceImageNodeInCaches(oldImageNode, newImageNode);
        this.addKonvaImageUndoRedoEvents(newImageNode);

        this.parent.konvaLib.stage.batchDraw();

        if (isAlreadyTargeted) {
          this.parent.dispatchEvent("selectedImageFilterChange", [newImageNode]);
        } else {
          this.parent.dispatchEvent("imageTargetChange", [newImageNode]);
        }


        break;

      }

      case "drawing": {

        handleUndoRedoCache(this.typesLib.getDrawingUndoRedo(), undoOrRedo);

        this.parent.drawingCanvas.getContext("2d").putImageData(latestUndoRedo.data.imageData, 0, 0);

        break;
      }

    }

  }

}

export default UndoRedo;
