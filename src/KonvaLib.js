
import Konva from "konva";

class KonvaLib {

  constructor(options) {

    var fillPatternBase64Url = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAARUlEQVRYhe3VsQkAMAwDQSVkIO0/hTdShlAgzat/OHDhlSQqNjNNrl3VDwYAAAAAAAAAOO0/t131nAAAAAAAAAD4C5B0ARR5Ca7CHgmpAAAAAElFTkSuQmCC`

    var fillImage = new Image(fillPatternBase64Url, 32, 32);
    fillImage.src = fillPatternBase64Url;

    this.stage = new Konva.Stage({
      container: options.containerId,
      width: options.width,
      height: options.height
    });

    fillImage.onload = () => {

      var layer = new Konva.Layer();

      this.stage.add(layer);

      var image = new Konva.Image({
        fillPatternImage: fillImage,
        fillPatternX: 0,
        fillPatternY: 0,
        fillPatternRepeat: "repeat",
        width: options.width,
        height: options.height
      });

      layer.add(image);

      this.imagesLayer = new Konva.Layer();
      this.stage.add(this.imagesLayer);

      this.imagesLayer.zIndex(1);

      var mainLayer = new Konva.Layer();

      this.stage.add(mainLayer);
      this.mainLayer = mainLayer;

      this.mainLayer.zIndex(2);

      this.stage.draw();

      this.backgroundImage = image;

      // transformers won't update for some reason unless we update constantly
      this.stage.on("mousemove", (e) => {
        this.stage.batchDraw();
      });

    }

    this.topZIndex = 1;

  }

  addImage(imageObj, options) {

    /*
    var layer = new Konva.Layer();

    this.stage.add(layer); */

    if (!options) options = {};

    var image = new Konva.Image({
      image: imageObj,
      x: 0,
      y: 0,
      width: imageObj.width,
      height: imageObj.height,
      draggable: options && options.draggable === false ? options.draggable : true
    });

    if (options.addToMainLayer) {
      this.mainLayer.add(image);
    } else {
      this.imagesLayer.add(image);
    }

    var zIndex = options && typeof options.zIndex === "number" ? options.zIndex : this.topZIndex++;
    image.zIndex(1);

    if (!options || options.enableTransformer !== false) {
      var transformer = new Konva.Transformer({
        nodes: [image],
        rotateAnchorOffset: 60,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
      });
      this.mainLayer.add(transformer);
      transformer.forceUpdate();
    }

    this.bringTransformersToFront();

    this.stage.draw();

    return image;

  }

  bringToFront(konvaNode) {
    konvaNode.moveToTop();
    this.bringTransformersToFront();
    this.stage.draw();
  }

  bringTransformersToFront() {
    for (var i = 0; i < this.mainLayer.getChildren().length; i++) {
      var node = this.mainLayer.getChildren()[i];
      if (node instanceof Konva.Transformer) {
        node.moveToTop();
        node.zIndex(110)
        node.forceUpdate();
      }
    }
    this.stage.draw();
  }

  rearrangeImagesWithNodeLast(nodeToBeLast) {

    var images = [];

    for (var i = 0; i < this.mainLayer.getChildren().length; i++) {
      var node = this.mainLayer.getChildren()[i];
      if (node instanceof Konva.Image) {
        node.remove();

        if (node === nodeToBeLast) {
          continue;
        }
        images.unshift(node);
      }
    }

    images.push(nodeToBeLast);

    for (var i = 0; i < images.length; i++) {
      this.mainLayer.add(images[i]);
      images[i].zIndex(1);
    }

    nodeToBeLast.zIndex(100)

    this.stage.draw();
  }

  replaceImages(newImages, startIndex) {

    var images = this.imagesLayer.getChildren();

    for (var i = startIndex; i < images.length; i++) {
      var image = images[i];
      var transformer = this.mainLayer.getChildren()[2 + i];

      console.log(this.mainLayer.getChildren()[2 + i])

      var newImage = new Konva.Image({
        image: newImages[i],
        x: image.x(),
        y: image.y(),
        scale: image.scale(),
        width: image.width(),
        height: image.height(),
        rotation: image.rotation(),
        draggable: true,
      });

      transformer.nodes([newImage]);

      image.remove();

      this.imagesLayer.add(newImage);
      transformer.forceUpdate();

      this.stage.draw();
    }

  }

  deleteImage(image) {
    image.remove();
    this.stage.draw();
  }

  bringImageToFront(image) {
    image.zIndex(this.topZIndex++);
    this.stage.draw();
  }

  getBackgroundImage() {
    return this.backgroundImage;
  }

  initKonva(options) {

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

}

export default KonvaLib;
