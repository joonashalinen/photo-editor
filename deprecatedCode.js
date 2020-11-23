
/*
  clearRedoCache() {
    this.redoCache = [];
  }

  addToRedoCache(redoItem) {
    this.redoCache.push(redoItem)
  }

  getUndoCache() {
    return this.undoCache;
  }

  addToUndoCache(layerState, layerType) {

    if (!layerType) {
      this.undoCache.push(layerState);
    } else {
      this.undoCache.push({
        data: layerState,
        type: layerType
      });
    }
  }


  saveToRedoCache(type) {

    function cloneCanvas(canvas) {

      var cloneCanvas = document.createElement("canvas");
      cloneCanvas.width = canvas.width;
      cloneCanvas.height = canvas.height;

      cloneCanvas.getContext("2d").drawImage(canvas, 0, 0);

      return cloneCanvas;

    }

    if (type === "rotate") {

      let clonedCanvas = cloneCanvas(this.canvas);
      this.addToRedoCache({
        data: clonedCanvas,
        type: "rotate"
      });

    }

  }

  undoRedo(undoOrRedo) {

    var undoCanvas = (latestUndo, canvas, transformString) => {
      let ctx = canvas.getContext("2d");

      canvas.width = latestUndo.data.width;
      canvas.height = latestUndo.data.height;

      ctx.putImageData(latestUndo.data.getContext("2d").getImageData(0, 0, latestUndo.data.width, latestUndo.data.height), 0, 0);

      if (transformString) canvas.style.transform = transformString;

    }

    var handleUndoRedoCache = () => {
      if (undoOrRedo === "undo") {
        this.undoCache.pop();
      } else {
        this.redoCache.pop();
      }
    }

    console.log(this.undoCache)

    var latestUndo = undoOrRedo === "undo" ? this.undoCache[this.undoCache.length - 1] : this.redoCache[this.redoCache.length -  1];

    console.log(latestUndo)

    if (!latestUndo) return;

    if (undoOrRedo === "undo") this.saveToRedoCache(latestUndo.type);

    if (latestUndo.type === "drawingCanvas") {

      undoCanvas(latestUndo, this.drawingCanvas);

      handleUndoRedoCache();

    } else if (latestUndo.type === "konva") {

      this.layer.destroy();
      this.stage.add(latestUndo.data);

      this.layer = latestUndo.data;
      this.layer.draw();

      handleUndoRedoCache();

      this.texts = [];

      for (var i = 0; i < this.layer.children.length; i++) {
        var childNode = this.layer.children[i];
        if (childNode instanceof Konva.Text) {
          this.texts.push(childNode);
        }
      }

      this.setState({
        numberOfTextFields: this.texts.length
      })

    } else if (latestUndo.type === "rotate") {

      console.log("undoing rotate")

      undoCanvas(latestUndo.canvas, this.canvas, latestUndo.canvas.transformString);
      undoCanvas(latestUndo.drawingCanvas, this.drawingCanvas, latestUndo.drawingCanvas.transformString);

      if (latestUndo.konva) {
        this.stage.width(latestUndo.konva.data.width);
        this.stage.height(latestUndo.konva.data.height)
        this.konvaJsContent.style.transform = latestUndo.konva.transformString;
      }

      handleUndoRedoCache();

    }

  } */

  // deprecated
  changeImageFromFile(file) {

    setTimeout(() => {
      //this.addText();
    }, 5000)

    file.arrayBuffer().then((buffer) => {

      Jimp.read(buffer).then((image) => {

        var canvas = document.getElementById("canvas");

        canvas.height = image.bitmap.height;
        canvas.width = image.bitmap.width;

        var ctx = canvas.getContext("2d");

        var canvasContainer = canvas.parentElement;

        var imageRatio = image.bitmap.width / image.bitmap.height;
        var canvasRatio = canvasContainer.clientWidth / canvasContainer.clientHeight;

        var scale = imageRatio > canvasRatio ?
          (canvasContainer.clientWidth / image.bitmap.width) : canvasContainer.clientHeight / image.bitmap.height;

        this.scale = scale;

        /*var scale = image.bitmap.width >= canvasContainer.clientWidth ?
          (canvasContainer.clientWidth / image.bitmap.width) : canvasContainer.clientHeight / image.bitmap.height;*/

        canvas.style.transform = `scale(${scale})`;

        /* image.color([{apply: "spin", params: [180]}]) */
        var imageData = new ImageData(Uint8ClampedArray.from(image.bitmap.data), image.bitmap.width);
        ctx.putImageData(imageData, 0, 0);

        this.setState({
          image: image
        });

      }).catch(err => {
        console.log(err);
      });

    }).catch(err => {
      console.log(err)
    });

  }
