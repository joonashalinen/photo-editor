
import React from "react";
import Canvas from "./Canvas.js";
import ToolsMenu from "./ToolsMenu.js";
import Upload from "./Upload.js" ;
import Jimp from "jimp/es";
import Cropper from "cropperjs";
import Konva from "konva";
import CanvasFreeDrawing from "canvas-free-drawing";
import Colors from "./Colors.js";
import EffectSlider from "./EffectSlider.js";
import TextField from "./TextField.js";
import { Input, Button, Tooltip } from "antd";
import "./PhotoEditor.css";

class PhotoEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      image: props.image ? props.image : "",
      numberOfTextFields: 0,
      showAcceptCancelMenu: false,
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

    document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `scale(${this.scale})`;
    document.getElementById("overlayCanvasContainer").firstElementChild.style.position = `absolute`;

    this.konvaReady = true;

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

    /*
    var canvas = document.getElementById("canvas");

    var ctx = canvas.getContext("2d");

    var imageData = this.currentImageData;

    var currentValue = this.filterValues.saturation;

    value = 1 + value / 100;

    var ratio = value / currentValue;

    console.log(currentValue, value, ratio)

    this.colors.saturate(imageData, ratio);

    ctx.putImageData(imageData, 0, 0);

    this.filterValues.saturation = currentValue + (value - currentValue); */

  }

  brightness(value) {
    this.imageFilters.brightness = value / 100;
    this.applyEffects();
  }

  async changeImage(buffer) {

    if (!this.imageInstanced) {
      document.getElementById("saveImageButton").addEventListener("click", () => {
        this.exportImage();
      });
    }

    this.imageInstanced = true;

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

    canvas.style.transform = `scale(${scale})`;

    var imageData = new ImageData(Uint8ClampedArray.from(image.bitmap.data), image.bitmap.width);
    ctx.putImageData(imageData, 0, 0);

    this.image = image.clone();
    this.originalImage = image;

    this.originalImageData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    this.currentImageData = imageData;

  }

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

  addText() {

    this.focusCanvasContainer("overlayCanvasContainer")

    var layer = this.layer;

    var text = new Konva.Text({
      x: this.layer.offsetX(),
      y: this.layer.offsetY(),
      text: 'Simple Text',
      fontSize: 30,
      fontFamily: 'Impact',
      fill: '#111',
      draggable: true
    });

    layer.add(text);

    var transformer = new Konva.Transformer({
      nodes: [text],
      rotateAnchorOffset: 60,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
    })

    layer.add(transformer);

    text.text("Add text")

    layer.draw();

    document.getElementById("overlayCanvasContainer").style.pointerEvents = "auto"

    this.activeTransformers.push(transformer);

    return text;
  }

  getTexts() {
    return this.layer.nodes();
  }

  updateText(text, value) {
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

    /*
    var canvas = document.getElementById("overlayCanvasContainer").firstElementChild.firstElementChild;

    var ctx = canvas.getContext("2d");

    var imageData = ctx.getImageData(0, 0, this.stage.width(), this.stage.height());

    var imageDataCopy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    var canvasElement = document.createElement("canvas");

    canvasElement.height = imageData.height;
    canvasElement.width = imageData.width;

    ctx = canvasElement.getContext("2d");

    ctx.putImageData(imageDataCopy, 0, 0);

    return canvasElement; */

  }

  beginCrop() {

    this.focusCanvasContainer("canvasContainer");

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

    var cropData = this.cropper.getData();
    // var croppedCanvas = this.cropper.getCroppedCanvas();

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

        document.getElementById("overlayCanvasContainer").firstElementChild.style.transform = `scale(${this.scale})`;
        document.getElementById("drawingCanvas").style.transform = `scale(${this.scale})`;

        document.getElementById("drawingCanvasContainer").style.visibility = "visible";
        document.getElementById("overlayCanvasContainer").style.visibility = "visible";

        this.cropper.destroy();

      })
    });



    /*
    document.getElementById("drawingCanvas").toBlob((blob) => {

      blob.arrayBuffer().then(async (buffer) => {

        Jimp.read(buffer).then(image => {

          image.crop(Math.round(cropData.x), Math.round(cropData.y), Math.round(cropData.width), Math.round(cropData.height))

          var drawingCanvas = document.getElementById("drawingCanvas");

          var imageData = new ImageData(Uint8ClampedArray.from(image.bitmap.data), image.bitmap.width);

          drawingCanvas.width = image.bitmap.width;
          drawingCanvas.height = image.bitmap.height;

          var ctx = drawingCanvas.getContext("2d");

          ctx.putImageData(imageData, 0, 0);
        });
      });
    }); */
  }

  enableDrawing() {

    this.focusCanvasContainer("drawingCanvasContainer");

    if (this.cfd) {
      return;
    }

    const cfd = new CanvasFreeDrawing({
      elementId: 'drawingCanvas',
      width: document.getElementById("canvas").clientWidth,
      height: document.getElementById("canvas").clientHeight,
      backgroundColor: [0,0,0,0]
    });

    cfd.setLineWidth(3);
    cfd.setStrokeColor([11, 11, 11]);

    cfd.on({ event: 'redraw' }, () => {

    });

    this.cfd = cfd;

    document.getElementById("drawingCanvas").style.transform = `scale(${this.scale})`;

  }

  disableDrawing() {

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
    var konvaCanvas = document.getElementById("overlayCanvasContainer").firstElementChild.firstElementChild;

    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx = drawingCanvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx = konvaCanvas.getContext("2d");
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
      <div className="mainContainer">
        <div className="upperRow">
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
        </div>
        <div className="canvasTools">
          <Canvas id="canvas" containerId="canvasContainer"/>
          <Canvas id="drawingCanvas" containerId="drawingCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
          <Canvas id="overlayCanvas" containerId="overlayCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
          <div id="tools" className="toolsMenuContainer">
            <EffectSlider min={-100} max={100} defaultValue={0} title="Contrast" onChange={(value) => {
              callToolFunction("contrast", [value])
            }}/>
            <EffectSlider min={-100} max={100} defaultValue={0} title="Brightness" onChange={(value) => {
              callToolFunction("brightness", [value])
            }}/>
            <EffectSlider min={-100} max={100} defaultValue={0} title="Saturation" onChange={(value) => {
              callToolFunction("saturate", [value])
            }}/>
            <div className="toolIcons">
              <Tooltip title="Crop">
                <div className={`toolIconContainer${this.state.selectedTool === "crop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
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
              <Tooltip title="Add Text">
                <div className={`toolIconContainer${this.state.selectedTool === "addText" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                  if (this.state.selectedTool === "addText") return;
                  if (this.state.selectedTool === "crop") callToolFunction("endCrop", [])
                  callToolFunction("readdAllAnchors", [])
                  callToolFunction("focusTool", ["addText"])
                  this.setState({
                    selectedTool: "addText"
                  })
                }}>
                  <img className="toolIcon" src="text.svg" width="24px"></img>
                </div>
              </Tooltip>
              <Tooltip title="Draw">
                <div className={`toolIconContainer${this.state.selectedTool === "draw" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                  if (this.state.selectedTool === "draw") return;
                  if (this.state.selectedTool === "crop") callToolFunction("endCrop", [])
                  if (this.state.selectedTool === "addText") callToolFunction("removeAllAnchors", [])
                  callToolFunction("focusTool", ["draw"])
                  this.setState({
                    selectedTool: "draw"
                  })
                  callToolFunction("enableDrawing");
                }}>
                  <img className="toolIcon" src="pen.svg" height="18px"></img>
                </div>
              </Tooltip>
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
            {
              this.state.selectedTool === "addText" ?
                <>
                <Button onClick={() => {
                  var text = callToolFunction("addText", [])
                  this.texts.push(text);
                  this.setState({
                    numberOfTexts: this.texts.length
                  });
                }} type="dashed" size="small" style={{fontSize: "12px", marginTop: "10px"}}>+ New Text Field</Button>
                <div style={{height: "87px", overflow: "auto", marginTop: "5px"}}>
                  {
                    this.state.numberOfTexts > 0 ?
                      this.texts.map((text, index) =>
                        <TextField defaultValue="Add Text" key={text._id} onDelete={() => {
                          callToolFunction("deleteText", [text]);
                          this.texts.splice(this.texts.indexOf(text), 1);
                          this.setState({
                            numberOfTexts: this.state.numberOfTexts - 1
                          });
                          this.forceUpdate();
                        }} onInput={(e) => {
                          callToolFunction("updateText", [text, e.target.value])
                        }}/>
                      )
                      :
                      null
                  }
                </div>
                </>
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
