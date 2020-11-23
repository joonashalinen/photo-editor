

class UndoRedo {

  constructor(parent) {
    this.parent = parent;

    this.undoCache = [];
    this.redoCache = [];

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

  prepareFullClone(type, undoOrRedo) {

    var canvasClone = document.createElement("canvas");
    canvasClone.width = this.parent.canvas.width;
    canvasClone.height = this.parent.canvas.height;

    var drawingCanvasClone = document.createElement("canvas");
    drawingCanvasClone.width = this.parent.drawingCanvas.width;
    drawingCanvasClone.height = this.parent.drawingCanvas.height;

    var ctx = canvasClone.getContext("2d");
    ctx.drawImage(this.parent.canvas, 0, 0);

    ctx = drawingCanvasClone.getContext("2d");
    ctx.drawImage(this.parent.drawingCanvas, 0, 0);


    var undoItem = {
      type: type,
      canvas: {
        data: canvasClone,
        transformString: this.parent.canvas.style.transform
      },
      drawingCanvas: {
        data: drawingCanvasClone,
        transformString: this.parent.drawingCanvas.style.transform
      }
    }

    if (this.parent.konvaReady) {
      undoItem.konva = {
        data: {
          width: this.parent.stage.width(),
          height: this.parent.stage.height()
        },
        transformString: this.parent.konvaJsContent.style.transform
      }
    }

    if (undoOrRedo === "redo") {
      this.addToRedoCache(undoItem);
    } else {
      this.addToUndoCache(undoItem);
    }
  }

  undoRedoFullClone(undoRedo) {

    this.undoRedoCanvas(undoRedo.canvas, this.parent.canvas, undoRedo.canvas.transformString);
    this.undoRedoCanvas(undoRedo.drawingCanvas, this.parent.drawingCanvas, undoRedo.drawingCanvas.transformString);

    if (undoRedo.konva) {
      this.parent.stage.width(undoRedo.konva.data.width);
      this.parent.stage.height(undoRedo.konva.data.height)
      this.parent.konvaJsContent.style.transform = undoRedo.konva.transformString;
    }

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

  undoRedoCanvas(undoRedo, canvas, transformString) {
    var ctx = canvas.getContext("2d");

    canvas.width = undoRedo.data.width;
    canvas.height = undoRedo.data.height;

    ctx.putImageData(undoRedo.data.getContext("2d").getImageData(0, 0, undoRedo.data.width, undoRedo.data.height), 0, 0);

    if (transformString) canvas.style.transform = transformString;

  }

  undoRedo(undoOrRedo) {

    var handleUndoRedoCache = (undoRedoItem, undoOrRedo) => {
      if (undoOrRedo === "undo") {
        this.addToRedoCache(undoRedoItem);
        this.undoCache.pop();
        console.log(this.undoCache.length, this.redoCache.length)
      } else {
        this.addToUndoCache(undoRedoItem, null, true);
        this.redoCache.pop();
        console.log(this.undoCache.length, this.redoCache.length)
      }
    }

    console.log(this.undoCache)

    var latestUndoRedo = undoOrRedo === "undo" ? this.undoCache[this.undoCache.length - 1] : this.redoCache[this.redoCache.length -  1];

    console.log(latestUndoRedo)

    if (!latestUndoRedo) return;

    if (latestUndoRedo.type === "drawingCanvas") {

      handleUndoRedoCache({
        data: this.cloneCanvas(this.parent.drawingCanvas),
        type: "drawingCanvas"
      }, undoOrRedo);
      //if (undoOrRedo === "undo") this.addToRedoCache(this.cloneCanvas(this.parent.drawingCanvas), "drawingCanvas");

      this.undoRedoCanvas(latestUndoRedo, this.parent.drawingCanvas);

    } else if (latestUndoRedo.type === "konva") {

      console.log("undoing konva")

      handleUndoRedoCache(this.getKonvaUndoRedo(), undoOrRedo);

      this.parent.layer.destroy();
      this.parent.stage.add(latestUndoRedo.data.layer);

      this.parent.layer = latestUndoRedo.data.layer;

      /* for (var i = 0; i < latestUndoRedo.data.transformerPairs.length; i++) {
        var pair = latestUndoRedo.data.transformerPairs[i];
        console.log(pair)
        pair[1].detach();
        pair[1].nodes([pair[0]]);
        pair[1].enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
        pair[1].resizeEnabled(true);
        this.parent.layer.add(pair[0]);
        this.parent.layer.add(pair[1]);
        pair[1].forceUpdate();
      } */

      this.parent.texts = [];

      console.log(latestUndoRedo.data.transformerPairs)

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
          this.addToUndoCache(this.getKonvaUndoRedo());
        })

        this.parent.layer.add(pair[0]);
        this.parent.layer.add(transformer);

      }

      this.parent.layer.draw();

      this.parent.setState({
        numberOfTextFields: this.parent.texts.length
      })

    } else if (latestUndoRedo.type === "rotate" || latestUndoRedo.type === "crop") {

      console.log("undo/redoing full clone " + latestUndoRedo.type)

      if (undoOrRedo === "undo") {
        this.undoCache.pop();
      } else {
        this.redoCache.pop();
      }

      this.prepareFullClone(latestUndoRedo.type, undoOrRedo === "undo" ? "redo" : "undo");

      this.undoRedoFullClone(latestUndoRedo);

    }

    if (this.parent.state.selectedTool === "erase") this.parent.enableDrawingEraser();

  }

  cloneCanvas(canvas) {

    var cloneCanvas = document.createElement("canvas");
    cloneCanvas.width = canvas.width;
    cloneCanvas.height = canvas.height;

    cloneCanvas.getContext("2d").drawImage(canvas, 0, 0);

    return cloneCanvas;

  }

}

export default UndoRedo;
