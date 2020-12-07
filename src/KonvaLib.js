
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

    this.transformersStage = new Konva.Stage({
      container: options.transformersContainerId,
      width: options.width,
      height: options.height
    });

    fillImage.onload = () => {

      var backgroundLayer = new Konva.Layer();
      this.backgroundLayer = backgroundLayer;

      this.stage.add(backgroundLayer);

      var backgroundTileImage = new Konva.Image({
        fillPatternImage: fillImage,
        fillPatternX: 0,
        fillPatternY: 0,
        fillPatternRepeat: "repeat",
        width: options.width,
        height: options.height
      });

      var colorBackgroundImage = new Konva.Image({
        fillColor: "rgba(0,0,0,0)",
        width: options.width,
        height: options.height
      });

      backgroundLayer.add(backgroundTileImage);
      backgroundLayer.add(colorBackgroundImage);

      //this.imagesCroppingLayer = new Konva.Layer();

      this.imagesLayer = new Konva.Layer();
      //this.imagesCroppingLayer.add(this.imagesLayer);
      this.stage.add(this.imagesLayer);

      this.imagesLayer.zIndex(1);

      this.imagesLayer.offsetX(options.width / 2);
      this.imagesLayer.offsetY(options.height / 2);

      this.imagesLayer.x(options.width / 2);
      this.imagesLayer.y(options.height / 2);

      var mainLayer = new Konva.Layer();

      this.stage.add(mainLayer);
      this.mainLayer = mainLayer;

      mainLayer = new Konva.Layer();

      this.transformersStage.add(mainLayer);
      this.transformersStageMainLayer = mainLayer;

      this.mainLayer.zIndex(2);

      this.transformersStageMainLayer.offsetX(options.width / 2);
      this.transformersStageMainLayer.offsetY(options.height / 2);

      this.transformersStageMainLayer.x(options.width / 2);
      this.transformersStageMainLayer.y(options.height / 2);

      this.stage.draw();
      this.transformersStage.draw();

      this.backgroundImage = backgroundTileImage;
      this.colorBackgroundImage = colorBackgroundImage;
      this.backgroundImageColor = "transparent";

      // transformers won't update for some reason unless we update constantly
      var timeout;
      this.stage.on("mousemove", (e) => {

        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        timeout = window.requestAnimationFrame(() => {
          this.stage.batchDraw();
          this.transformersStage.batchDraw();
        });
      });

      var timeout2;
      this.transformersStage.on("mousemove", (e) => {
        if (timeout2) {
          window.cancelAnimationFrame(timeout2);
        }

        timeout2 = window.requestAnimationFrame(() => {
          this.stage.batchDraw();
          this.transformersStage.batchDraw();
        })
      });

    }

    this.topZIndex = 1;

  }

  setBackgroundColor(rgbaString) {
    this.colorBackgroundImage.fill(rgbaString);
    this.stage.batchDraw();
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
      draggable: options.draggable ? options.draggable : false
    });

    image.photoEditorId = imageObj.id;
    image.targetable = options.targetable ? options.targetable : false;

    if (options.addToMainLayer) {
      this.mainLayer.add(image);
    } else {
      this.imagesLayer.add(image);
    }

    var zIndex = options && typeof options.zIndex === "number" ? options.zIndex : this.topZIndex++;
    image.zIndex(1);

    if (!options || options.enableTransformer !== false) {
      /*
      var transformer = new Konva.Transformer({
        nodes: [image],
        rotateAnchorOffset: 60,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        borderStroke: "rgb(0 149 255)",
        anchorStroke: "rgb(0 149 255)",
        rotationSnaps: [0, 90, 180, 270]
      });
      this.transformersStageMainLayer.add(transformer);
      transformer.forceUpdate(); */
      var transformer = new Konva.Transformer({
        nodes: [image],
        rotateAnchorOffset: 60,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        borderStroke: "rgb(0 149 255)",
        anchorStroke: "rgb(0 149 255)",
        rotationSnaps: [0, 90, 180, 270]
      });
      this.mainLayer.add(transformer);
      transformer.forceUpdate();
    }

    this.bringTransformersToFront();

    if (!options.preventTarget) this.targetImage(image);

    this.stage.draw();

    return image;

  }

  cropImages(boundaryBox) {

    var images = this.imagesLayer.getChildren();

    for (var i = 0; i < images.length; i++) {
      var image = images[i];

      var x = image.x() + image.offsetX();
      var y = image.y() + image.offsetY();

      if (x > boundaryBox.x + boundaryBox.width ||
          y > boundaryBox.y + boundaryBox.height) {
        continue;
      }

      var newX = x;
      var newY = y;

      if (boundaryBox.x > x) {
        newX = boundaryBox.x;
      }

      if (boundaryBox.y > y) {
        newY = boundaryBox.y;
      }

      var width = image.width() * image.getScale().x;
      var height = image.height() * image.getScale().y;

      var newWidth = width;
      var newHeight = height;

      if (boundaryBox.x > x) {
        if (boundaryBox.x + boundaryBox.width <= x + width) {
          console.log("image width cuts from middle")
          newWidth = boundaryBox.width;
        }
        if (boundaryBox.x + boundaryBox.width >= x + width) {
          console.log("image width cuts from left")
          newWidth = x + width - boundaryBox.x;
        }
      }

      if (boundaryBox.x < x) {
        if (boundaryBox.x + boundaryBox.width > x) {
          if (boundaryBox.x + boundaryBox.width < x + width) {
            console.log("image width cuts from right")
            newWidth = boundaryBox.x + boundaryBox.width - x;
          }
        }
      }

      if (boundaryBox.y > y) {
        if (boundaryBox.y + boundaryBox.height <= y + height) {
          console.log("image height cuts from middle")
          newHeight = boundaryBox.height;
        }
        if (boundaryBox.y + boundaryBox.height >= y + height) {
          console.log("image height cuts from top")
          newHeight = y + height - boundaryBox.y;
        }
      }

      if (boundaryBox.y < y) {
        if (boundaryBox.y + boundaryBox.height > y) {
          if (boundaryBox.y + boundaryBox.height < y + height) {
            console.log("image height cuts from bottom")
            newHeight = boundaryBox.y + boundaryBox.height - y;
          }
        }
      }

      console.log(newX - x, newY - y, newWidth, newHeight)

      var scale = image.scale();

      var existingCrop = image.crop();

      image.crop({
        x: existingCrop.x + (newX - x) / image.getScale().x,
        y: existingCrop.y + (newY - y) / image.getScale().y,
        width: newWidth / image.getScale().x,
        height: newHeight / image.getScale().y
      });

      var relativeX = Math.abs(boundaryBox.x - newX);
      var relativeY = Math.abs(boundaryBox.y - newY);

      image.x(relativeX);
      image.y(relativeY);

      image.size({
        width: newWidth / image.getScale().x,
        height: newHeight / image.getScale().y
      })

    }

  }

  cloneAllImages() {

    var cloneImages = [];
    var images = this.imagesLayer.getChildren();

    for (var i = 0; i < images.length; i++) {
      var image = images[i];

      var cloneImage = image.clone();
      cloneImage.photoEditorId = image.photoEditorId;

      cloneImages.push(cloneImage);

    }

    return cloneImages;

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

  targetImage(image) {

    var setSelectedTargetStyles = (target) => {

      target.shadowEnabled(true);
      target.shadowColor("black");
      target.shadowOffsetY(20);
      target.shadowOffsetX(0);
      target.shadowOpacity(0.8);
      target.shadowBlur(30);

      target.strokeEnabled(true);
      target.stroke("rgb(0 149 255)");
      target.strokeWidth(5);
      target.strokeScaleEnabled(false);

      this.stage.batchDraw();

    }

    if (this.selectedTargetImage === image) {
      this.unTargetImage(image);
      return true;
    }

    if (!image.targetable) return false;

    if (!this.selectedTargetImage) {
      setSelectedTargetStyles(image);
      this.showImageTransformer(image);
      image.draggable(true);
      this.selectedTargetImage = image;
      return true;
    }

    this.unTargetImage(this.selectedTargetImage);
    this.showImageTransformer(image);

    setSelectedTargetStyles(image);

    image.draggable(true);

    this.selectedTargetImage = image;

    return true;

  }

  previewTargetImage(image) {

    var setPreviewTargetStyles = (target) => {

      target.shadowEnabled(true);
      target.shadowColor("black");
      target.shadowOffsetY(20);
      target.shadowOffsetX(0);
      target.shadowOpacity(0.8);
      target.shadowBlur(30);

      target.strokeEnabled(true);
      target.stroke("rgb(0 149 255)");
      target.strokeWidth(5);
      target.strokeScaleEnabled(false);

      this.stage.batchDraw();

    }

    if (this.previewedTargetImage === image) return false;

    this.unPreviewTargetImage(this.previewedTargetImage);

    if (!image.targetable) return false;

    setPreviewTargetStyles(image);
    this.showImageTransformer(image);

    this.previewedTargetImage = image;

    return true;

  }

  unTargetImage(image) {
    if (!image) return;
    if (this.selectedTargetImage !== image) return;
    image.shadowEnabled(false);
    image.strokeEnabled(false);
    image.draggable(false);
    this.hideImageTransformer(image);
    this.selectedTargetImage = false;
  }

  unPreviewTargetImage(image) {
    if (!image) return;
    if (this.previewedTargetImage !== image) return;
    if (this.selectedTargetImage === image) return;
    image.shadowEnabled(false);
    image.strokeEnabled(false);
    this.hideImageTransformer(image);
    this.previewedTargetImage = false;
  }

  hideImageTransformer(image) {
    this.mainLayer.getChildren().forEach((node) => {
      if (!(node instanceof Konva.Transformer)) return;
      if (!node.nodes().includes(image)) return;
      node.hide();
    });
  }

  showImageTransformer(image) {
    this.mainLayer.getChildren().forEach((node) => {
      if (!(node instanceof Konva.Transformer)) return;
      if (!node.nodes().includes(image)) return;
      node.show();
    });
  }

  getImageTransformer(image, layer) {
    return this.getNodeTransformer(image, layer);
  }

  getNodeTransformer(node, layer) {
    var transformer;
    layer = layer ? layer : this.mainLayer;
    layer.getChildren().forEach((nodeTransformer) => {
      if (!(nodeTransformer instanceof Konva.Transformer)) return;
      if (!nodeTransformer.nodes().includes(node)) return;
      transformer = nodeTransformer;
    });
    return transformer;
  }

  hideImage(image) {
    image.visible(false);
    this.stage.draw();
  }

  showImage(image) {
    image.show();
    this.stage.draw();
  }

  replaceImages(newImages, startIndex) {

    var images = this.imagesLayer.getChildren();

    for (var i = startIndex; i < images.length; i++) {
      var image = images[i];
      var transformer = this.getImageTransformer(image);

      if (image.photoEditorId !== newImages[i].photoEditorId) return;

      var newImage = newImages[i] instanceof Konva.Image ? newImages[i] : new Konva.Image({
        image: newImages[i],
        x: image.x(),
        y: image.y(),
        scale: image.scale(),
        width: image.width(),
        height: image.height(),
        rotation: image.rotation(),
        draggable: image.draggable()
      });

      newImage.targetable = image.targetable;
      newImage.photoEditorId = image.photoEditorId;
      newImage.zIndex(image.zIndex());

      transformer.nodes([newImage]);

      image.remove();

      this.imagesLayer.add(newImage);
      transformer.forceUpdate();

    }

    this.stage.batchDraw();

    return images;

  }

  replaceImage(oldImage, newImageObj) {

    var transformer = this.getImageTransformer(oldImage);

    var newImage = newImageObj instanceof Konva.Image ? newImageObj : new Konva.Image({
      image: newImageObj,
      x: oldImage.x(),
      y: oldImage.y(),
      scale: oldImage.scale(),
      width: oldImage.width(),
      height: oldImage.height(),
      rotation: oldImage.rotation(),
      draggable: oldImage.draggable()
    });

    newImage.targetable = oldImage.targetable;
    newImage.photoEditorId = oldImage.photoEditorId;
    newImage.zIndex(oldImage.zIndex());

    console.log(oldImage.photoEditorId)

    transformer.nodes([newImage]);

    oldImage.remove();

    this.imagesLayer.add(newImage);
    transformer.forceUpdate();

    if (this.selectedTargetImage === oldImage) this.targetImage(newImage);

    this.stage.draw();

    console.log(newImage, oldImage)

    return [newImage, oldImage];

  }

  replaceImageWithSameId(imageObj) {

    var id = imageObj instanceof Konva.Image ? imageObj.photoEditorId : imageObj.id;

    for (var i = 0; i < this.imagesLayer.getChildren().length; i++) {
      var image = this.imagesLayer.getChildren()[i];
      if (id=== image.photoEditorId) {
        return this.replaceImage(image, imageObj);
      }
    }

  }

  deleteImage(image) {
    image.remove();
    this.stage.draw();
  }

  deleteImageWithId(id) {
    var image = this.getImageWithId(id);
    if (image) image.remove();
    this.stage.draw();
    return image;
  }

  getImageWithId(id) {
    for (var i = 0; i < this.imagesLayer.getChildren().length; i++) {
      var image = this.imagesLayer.getChildren()[i];
      if (id === image.photoEditorId) {
        return image;
      }
    }
  }

  bringImageToFront(image) {
    image.zIndex(this.imagesLayer.getChildren().length - 1);
    this.stage.draw();
  }

  getBackgroundImage() {
    return this.backgroundImage;
  }

}

export default KonvaLib;
