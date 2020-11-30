
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

      this.stage.draw();

      this.backgroundImage = image;

    }

    this.topZIndex = 1;

  }

  addImage(imageObj) {

    var layer = new Konva.Layer();

    this.stage.add(layer);

    var image = new Konva.Image({
      image: imageObj,
      x: 0,
      y: 0,
      width: imageObj.width,
      height: imageObj.height,
      draggable: true
    });

    var transformer = new Konva.Transformer({
      nodes: [image],
      rotateAnchorOffset: 60,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    })

    layer.add(image);
    layer.add(transformer);

    layer.zIndex(this.topZIndex++);

    transformer.forceUpdate();
    this.stage.draw();

  }

  replaceImages(newImages) {

    var layers = this.stage.getChildren();

    // start from 1, skip over the background layer
    for (var i = 1; i < layers.length; i++) {
      var layer = layers[i];
      var image = layer.getChildren()[0];
      var transformer = layer.getChildren()[1];

      var newImage = new Konva.Image({
        image: newImages[i - 1],
        x: image.x(),
        y: image.y(),
        scale: image.scale(),
        width: image.width(),
        height: image.height(),
        draggable: true,
      });

      transformer.nodes([newImage]);

      image.remove();
      transformer.remove();

      layer.add(newImage);
      layer.add(transformer);
      transformer.forceUpdate();

      layer.draw();
    }

  }

  deleteImageLayer(image) {
    image.getParent().remove();
  }

  bringImageToFront(image) {
    image.getParent().zIndex(this.topZIndex++);
    console.log(image.getParent().zIndex())
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
