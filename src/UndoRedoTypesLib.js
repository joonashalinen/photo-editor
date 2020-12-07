
class UndoRedoTypesLib {

  constructor(parent) {
    this.parent = parent;
  }

  getKonvaUndoRedo() {

    var transformerPairs = [];

    for (var i = 0; i < this.parent.layer.children.length; i++) {
      var node = this.parent.layer.children[i];
      if (node instanceof this.parent.Konva.Text) {
        transformerPairs.push([node.clone(), this.parent.layer.children[i + 1].clone()]);
      }
    }

    var cloneLayer = this.parent.layer.clone();
    cloneLayer.destroyChildren();

    var undoRedoItem = {
      data: {
        layer: cloneLayer,
        transformerPairs: transformerPairs
      },
      type: "konva"
    }

    return undoRedoItem;
  }

  getCropUndoRedo() {

    return {
      data: {
        images: this.parent.konvaLib.cloneAllImages(),
        width: this.parent.konvaLib.stage.width(),
        height: this.parent.konvaLib.stage.height(),
        transform: this.parent.konvaImagesContainer.firstElementChild.style.transform,
        offsetX: this.parent.layer.offsetX(),
        offsetY: this.parent.layer.offsetY(),
        imagesOffsetX: this.parent.konvaLib.imagesLayer.offsetX(),
        imagesOffsetY: this.parent.konvaLib.imagesLayer.offsetY(),
        x: this.parent.konvaLib.imagesLayer.x(),
        y: this.parent.konvaLib.imagesLayer.y(),
        drawingImageData: this.parent.konvaDrawingCanvas.getContext("2d").getImageData(0, 0, this.parent.konvaDrawingCanvas.width, this.parent.konvaDrawingCanvas.height)
      },
      type: "crop"
    }

  }

  getRotateUndoRedo() {
    return {
      data: {
        scale: this.parent.scale,
        rotation: this.parent.konvaLib.imagesLayer.rotation(),
        width: this.parent.konvaLib.imagesLayer.width(),
        height: this.parent.konvaLib.imagesLayer.height(),
        transform: this.parent.konvaImagesContainer.firstElementChild.style.transform,
        offsetX: this.parent.konvaLib.imagesLayer.offsetX(),
        offsetY: this.parent.konvaLib.imagesLayer.offsetY(),
        x: this.parent.konvaLib.imagesLayer.x(),
        y: this.parent.konvaLib.imagesLayer.y(),
        drawingImageData: this.parent.konvaDrawingCanvas.getContext("2d").getImageData(0, 0, this.parent.konvaDrawingCanvas.width, this.parent.konvaDrawingCanvas.height)
      },
      type: "rotate"
    }
  }

  getKonvaNodeTransformUndoRedo(konvaNode) {
    return {
      data: {
        scale: konvaNode.scale(),
        rotation: konvaNode.rotation(),
        width: konvaNode.width(),
        height: konvaNode.height(),
        offsetX: konvaNode.offsetX(),
        offsetY: konvaNode.offsetY(),
        x: konvaNode.x(),
        y: konvaNode.y()
      }
    }
  }

  getImageTransformUndoRedo(imageNode) {
    var undoRedoItem = this.getKonvaNodeTransformUndoRedo(imageNode);
    undoRedoItem.data.imageNode = imageNode;
    undoRedoItem.type = "image-transform";
    return undoRedoItem;
  }

  getImageAddUndoRedo(imageNode, imageTransformer) {
    var undoRedoItem = this.getImageTransformUndoRedo(imageNode);
    undoRedoItem.data.zIndex = imageNode.zIndex();
    undoRedoItem.data.transformer = imageTransformer ? imageTransformer : this.parent.konvaLib.getImageTransformer(imageNode);
    undoRedoItem.type = "image-add";
    return undoRedoItem;
  }

  getImageDeleteUndoRedo(imageNode) {
    var undoRedoItem = this.getImageTransformUndoRedo(imageNode);
    undoRedoItem.type = "image-delete";
    undoRedoItem.data.zIndex = imageNode.zIndex();
    undoRedoItem.data.transformer = this.parent.konvaLib.getImageTransformer(imageNode);
    return undoRedoItem;
  }

  getTextTransformUndoRedo(textNode) {
    var undoRedoItem = this.getKonvaNodeTransformUndoRedo(textNode);
    undoRedoItem.type = "text-transform";
    undoRedoItem.data.textNode = textNode;
    undoRedoItem.data.text = textNode.text();
    console.log(undoRedoItem.data.text)
    return undoRedoItem;
  }

  getTextAddUndoRedo(textNode, transformer) {
    var undoRedoItem = this.getTextTransformUndoRedo(textNode);
    undoRedoItem.data.zIndex = textNode.zIndex();
    undoRedoItem.data.transformer = transformer ? transformer : this.parent.konvaLib.getImageTransformer(textNode);
    undoRedoItem.type = "text-add";
    return undoRedoItem;
  }

  getTextDeleteUndoRedo(textNode, transformer) {
    var undoRedoItem = this.getTextTransformUndoRedo(textNode);
    undoRedoItem.data.zIndex = textNode.zIndex();
    undoRedoItem.data.transformer = transformer ? transformer : this.parent.konvaLib.getImageTransformer(textNode);
    undoRedoItem.type = "text-delete";
    return undoRedoItem;
  }

  getFilterUndoRedo(imageNode, filterName, values) {
    return {
      data: {
        imageNode: imageNode,
        filterName: filterName,
        values: values
      },
      type: "filter"
    }
  }

  getFilterRemoveUndoRedo(imageNode, filterName) {
    return {
      data: {
        imageNode: imageNode,
        filterName: filterName,
        remove: true
      },
      type: "filter"
    }
  }

  getDrawingUndoRedo() {
    return {
      data: {
        imageData: this.parent.drawingCanvas.getContext("2d").getImageData(0, 0, this.parent.drawingCanvas.width, this.parent.drawingCanvas.height)
      },
      type: "drawing"
    }
  }

}

export default UndoRedoTypesLib;
