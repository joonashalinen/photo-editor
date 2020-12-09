
import React from "react";
import Canvas from "./Canvas.js";
import Upload from "./Upload.js" ;
import EffectSlider from "./EffectSlider.js";
import TextField from "./TextField.js";
import { Input, InputNumber, Button, Tooltip, Empty, Select, Collapse, Spin } from "antd";
import { RotateRightOutlined, UploadOutlined, DownloadOutlined, CloudUploadOutlined } from "@ant-design/icons"
import '@simonwep/pickr/dist/themes/nano.min.css';
import "./PhotoEditor.css";
import CustomModal from "./CustomModal.js";
import DropdownMenu from "./DropdownMenu.js";
import ContextMenu from "./ContextMenu.js";
import ImageGridMenu from "./ImageGridMenu.js";
import ConfirmPopupButton from "./ConfirmPopupButton.js";
import { Tabs } from 'antd';
import PhotoEditorLib from "./PhotoEditorLib";

class PhotoEditor extends React.Component {

  constructor(props) {
    super(props);

    var selectedTool = "";

    this.defaultState = {
      image: props.image ? props.image : "",
      selectedTargetImage: false,
      numberOfTextFields: 0,
      showAcceptCancelMenu: false,
      drawingLineWidth: 10,
      imageInstanced: false,
      selectedTool: selectedTool,
      brushSize: 10,
      brushHardness: 50,
      drawingLineWidth: 10,
      filterPreviewImages: [],
      blur: 0,
      bulgePinchRadius: 0,
      bulgePinchStrength: 0,
      bulgePinchCenterX: 0,
      bulgePinchCenterY: 0,
      tiltShiftBlur: 0,
      tiltShiftGradient: 0,
      contrast: 0,
      brightness: 0,
      gamma: 0,
      saturation: 0,
      filter: "None",
      canvasesContainerLoading: false,
      imageFilterPreviewsLoading: false
    }

    this.state = this.defaultState;

    this.selectableFilters = [
      "None",
      "Black & White",
      "Greyscale",
      "Browni",
      "Kodachrome",
      "Technicolor",
      "Negative",
      "Polaroid",
      "Sepia",
      "Vintage"
    ];

    this.adjustableFilters = [
      "blur",
      "tilt/shift",
      "bulge/pinch"
    ];

    this.adjustments = [
      "contrast",
      "brightness",
      "gamma",
      "saturation"
    ];

    this.acceptedImageTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg",
      "x-icon/svg",
      "image/tiff",
      "image/bmp",
      "image/gif"
    ];

    this.photoEditorLib = new PhotoEditorLib({
      selectableFilters: this.selectableFilters,
      adjustableFilters: this.adjustableFilters,
      adjustments: this.adjustments,
      selectedTool: selectedTool,
      defaultBrushSize: this.state.drawingLineWidth,
      defaultBrushHardness: this.state.brushHardness / 100,
      downscaleImage: true,
      maxImageSize: 2000
    });

    window.photoEditorLib = this.photoEditorLib;

    /*
    this.photoEditorLib.on("load", () => {
      var filterPreviewImages = this.photoEditorLib.getFilterPreviewImages();
      this.setState({
        filterPreviewImages: filterPreviewImages
      });
    }); */

    var setFiltersState = (imageSettings, filterPreviewImages) => {
      this.setState({
        selectedTargetImage: imageSettings.selectedTarget,
        filterPreviewImages: filterPreviewImages,
        blur: imageSettings.blur,
        bulgePinchRadius: imageSettings["bulge/pinch"].radius,
        bulgePinchStrength: imageSettings["bulge/pinch"].strength * 100,
        bulgePinchCenterX: imageSettings["bulge/pinch"].center[0] * 100,
        bulgePinchCenterY: imageSettings["bulge/pinch"].center[1] * 100,
        tiltShift: imageSettings["tilt/shift"][0],
        contrast: Math.floor((imageSettings.contrast - 1) * 100),
        brightness: Math.floor((imageSettings.brightness - 1) * 100),
        gamma: Math.floor((imageSettings.gamma - 1) * 100),
        saturation: Math.floor((imageSettings.saturation - 1) * 100),
        filter: imageSettings.filter,
        imageFilterPreviewsLoading: false
      });
    }

    this.photoEditorLib.on("imageTargetChange", (newTarget) => {
      var filterPreviewImages = this.photoEditorLib.getFilterPreviewImages(newTarget);
      var imageSettings = this.photoEditorLib.getSelectedTargetImageSettings();
      setFiltersState(imageSettings, filterPreviewImages);
    });

    this.photoEditorLib.on("selectedImageFilterChange", (imageNode) => {
      var filterPreviewImages = this.photoEditorLib.getFilterPreviewImages(imageNode);
      var imageSettings = this.photoEditorLib.getSelectedTargetImageSettings();
      setFiltersState(imageSettings, filterPreviewImages);
    });

    this.photoEditorLib.on("removeImageInstance", () => {
      this.setState(this.defaultState);
    });

    this.photoEditorLib.on("loadingImage", () => {
      this.setState({
        canvasesContainerLoading: true,
        imageFilterPreviewsLoading: true
      });
    });

    this.photoEditorLib.on("loadImage", () => {
      this.setState({
        uploadFileList: [],
        canvasesContainerLoading: false,
        imageFilterPreviewsLoading: false,
        imageInstanced: true
      });
    });

  }

  render() {

    var arrInLowerCase = (arr) => {
      var array = [];
      for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] === "string") {
          array.push(arr[i].toLowerCase());
        } else {
          array.push(arr[i]);
        }
      }
      return array;
    }

    var updateState = (...args) => {
      if (args.length === 1) {
        this.setState(args[0]);
      } else {
        var name = args[0];
        var value = args[1];
        var state = {};
        state[name] = value;
        this.setState(state);
      }
    }


    return (
      <div id="mainContainer" className="mainContainer">
        <div className="upperRow" style={{position: "relative"}}>
          <div className="toolOptionsMenu">
            <div style={{position: "relative", width: "24px", height: "24px", display: this.state.selectedTool === "draw" ? "block" : "none"}}>
              <Tooltip title="Color">
                <div style={{position: "relative"}}>
                  <div className="colorPickerButton" style={{pointerEvents: "none", zIndex: 1, position: "absolute", top: "0px", left: "0px", backgroundImage: "url(background_tile_pattern.png)", backgroundSize: "cover"}}></div>
                  <button style={{zIndex: 2, position: "absolute", top: "0px", left: "0px"}} id="drawing-color-picker-button" className="colorPickerButton" onClick={() => {
                    this.photoEditorLib.showColorPicker("drawing-color-picker");
                  }}></button>
                </div>
              </Tooltip>
              <div id="drawing-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
            </div>
            {
              this.state.selectedTool === "draw" ?
                <>
                  <div className="toolOptionsSlider">
                    <EffectSlider name="brushSize" sliderWidth="80" updateState={updateState} positioning="horizontal" min={1} max={100} value={this.state.brushSize} defaultValue={ this.state.brushSize } title="Size:" onAfterChange={(value) => {
                      this.photoEditorLib.setBrushSize(value);
                    }}/>
                  </div>
                  <div className="toolOptionsSlider" style={{width: "140px"}}>
                    <EffectSlider name="brushHardness" sliderWidth="80" updateState={updateState} positioning="horizontal" min={10} max={100} value={this.state.brushHardness} defaultValue={this.state.brushHardness} title="Hardness:" onAfterChange={(value) => {
                      this.photoEditorLib.softBrush.setHardness(value / 100);
                    }}/>
                  </div>
                </>
              :
              null
            }
            {
              this.state.selectedTool === "erase" ?
                <>
                  <Button onClick={() => {
                    this.photoEditorLib.eraseAllDrawing();
                  }} type="dashed" size="small" style={{ fontSize: "12px" }}>Erase All</Button>
                  <div style={{height: "10px"}}></div>
                  <div className="toolOptionsSlider">
                    <EffectSlider name="brushSize" sliderWidth="80" updateState={updateState} positioning="horizontal" min={1} max={100} value={this.state.brushSize} defaultValue={ this.state.brushSize } title="Size:" onAfterChange={(value) => {
                      this.photoEditorLib.setBrushSize(value);
                    }}/>
                  </div>
                  <div className="toolOptionsSlider" style={{width: "140px"}}>
                    <EffectSlider name="brushHardness" sliderWidth="80" updateState={updateState} positioning="horizontal" min={10} max={100} value={this.state.brushHardness} defaultValue={this.state.brushHardness} title="Hardness:" onAfterChange={(value) => {
                      this.photoEditorLib.softBrush.setHardness(value / 100);
                    }}/>
                  </div>
                </>
              :
              null
            }
            <div style={{position: "relative", width: "24px", height: "24px", display: this.state.selectedTool === "addText" ? "block" : "none"}}>
              <Tooltip title="Color">
                <div style={{position: "relative"}}>
                  <div className="colorPickerButton" style={{pointerEvents: "none", zIndex: 1, position: "absolute", top: "0px", left: "0px", backgroundImage: "url(background_tile_pattern.png)", backgroundSize: "cover"}}></div>
                  <button style={{zIndex: 2, position: "absolute", top: "0px", left: "0px"}} id="text-color-picker-button" className="colorPickerButton" onClick={() => {
                    this.photoEditorLib.showColorPicker("text-color-picker");
                  }}></button>
                </div>
              </Tooltip>
              <div id="text-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
            </div>
            <div style={{display: this.state.selectedTool === "addText" ? "inline-block" : "none", marginLeft: "10px"}}>
              <Select size="small" defaultValue="Impact" onChange={(fontName) => {
                this.photoEditorLib.setSelectedFont(fontName);
              }}>
                <Select.Option value="Impact"><span style={{fontFamily: "Impact"}}>Impact</span></Select.Option>
                <Select.Option value="Calibri"><span style={{fontFamily: "Calibri"}}>Calibri</span></Select.Option>
                <Select.Option value="Arial"><span style={{fontFamily: "Arial"}}>Arial</span></Select.Option>
                <Select.Option value="Helvetica"><span style={{fontFamily: "Helvetica"}}>Helvetica</span></Select.Option>
                <Select.Option value="Comic Sans MS"><span style={{fontFamily: "Comic Sans MS"}}>Comic Sans MS</span></Select.Option>
              </Select>
            </div>
            <div style={{height:"24px", position: "relative", display: this.state.selectedTool === "eyedrop" ? "block" : "none"}}>
              <Tooltip title="Color">
                <button id="eyedrop-color-picker-button" className="colorPickerButton" onClick={() => {
                }}></button>
              </Tooltip>
            </div>
          </div>
          {
            this.state.imageInstanced ?
              <Tooltip title="Delete Canvas">
                <div className="clearCanvasButton">
                  <ConfirmPopupButton onOk={() => {
                    this.photoEditorLib.removeImageInstance();
                  }} content={
                    <img className="toolIcon undoRedoButton" src="times-circle_antd-colors.svg" height="18px" style={{filter: "brightness(1)"}} onClick={() => {

                    }}></img>
                  } />
                </div>
              </Tooltip>
            :
            null
          }
          <Tooltip title="Redo">
            <img className="toolIcon redoButton undoRedoButton" src="redo.svg" height="18px" onClick={() => {
              this.photoEditorLib.redo();
            }}></img>
          </Tooltip>
          <Tooltip title="Undo">
            <img className="toolIcon undoButton undoRedoButton" src="redo.svg" height="18px" onClick={() => {
              this.photoEditorLib.undo();
            }}></img>
          </Tooltip>
        </div>
        <div className="canvasTools">
          <div id="canvasesContainer" className="canvasesContainer">
            <div className="emptyCanvasImage">
              {
                !this.state.imageInstanced && !this.state.canvasesContainerLoading ?
                  <Empty
                    image="image-outline.svg"
                    imageStyle={{
                      height: 80,
                      filter: "invert() brightness(0.25)"
                    }}
                    description={
                      <>
                        <p style={{color: "rgba(255, 255, 255, 0.25)"}}>Import image to start editing.</p>
                      </>
                    }
                    >
                  </Empty>
                :
                null
              }
            </div>
            <Canvas id="canvas" containerId="canvasContainer"/>
            <ContextMenu onVisibleChange={(visible, setOptions) => {
              var target = this.photoEditorLib.getKonvaTarget();

              if (target === this.photoEditorLib.konvaLib.getBackgroundImage() || !target) {
                setOptions([]);
                return;
              }

              if (target instanceof this.photoEditorLib.Konva.Image) {
                setOptions(["Bring To Front", "Delete Image Layer"]);
                return;
              }

              if (target instanceof this.photoEditorLib.Konva.Text) {
                setOptions(["Delete Text"]);
                return;
              }

            }} onClick={(target) => {
              if (target.key === "Delete Image Layer") {
                this.photoEditorLib.deleteSelectedImage();
                return;
              }
              if (target.key === "Bring To Front") {
                this.photoEditorLib.bringSelectedImageToFront();
                return;
              }
              if (target.key === "Edit Text") {

                return;
              }
              if (target.key === "Delete Text") {
                this.photoEditorLib.deleteSelectedText();
                return;
              }
            }}>
              <div>
                <div id="konvaImagesContainer" className="canvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
                <Canvas id="drawingCanvas" containerId="drawingCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent" }}/>
                <div id="konvaTransformersContainer" className="canvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
                <Canvas id="overlayCanvas" containerId="overlayCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
              </div>
            </ContextMenu>
            <Canvas id="cropDummyCanvas" containerId="cropDummyCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none", visibility: "hidden" }}/>
            <Canvas id="colorPickerCanvas" containerId="colorPickerCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none"}}/>
            <Canvas id="cursorCanvas" containerId="cursorCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            <div id="drawingCanvasCursor" className="drawingCanvasCursor" style={{display: "none"}}></div>
            {
              this.state.selectedTool === "crop" ?
                ( <>
                    <Button onClick={(e) => {
                      this.photoEditorLib.acceptCrop();
                      this.setState({
                        showAcceptCancelMenu: false
                      });
                      this.photoEditorLib.inCropMode = false;
                    }} type="primary" className="cropAccept"><img className="whiteCheckmark" src="check.svg" height="18px"></img></Button>
                    <Button onClick={() => {
                      this.photoEditorLib.endCrop();
                      this.setState({
                        showAcceptCancelMenu: false
                      });
                      this.photoEditorLib.inCropMode = false;
                    }} className="cropCancel">Cancel</Button>
                  </>
                )
              :
              null
            }
            {
              this.state.canvasesContainerLoading ?
                <div style={{position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
                  <Spin spinning={this.state.canvasesContainerLoading}>
                  </Spin>
                </div>
              :
              null
            }
          </div>
          <div className="toolIcons">
            <Tooltip placement="right" title="Crop [C]">
              <div className={`toolIconContainer${this.state.selectedTool === "crop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "crop") return;
                if (this.state.selectedTool === "drag") this.photoEditorLib.konvaLib.stage.listening(true);
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.untargetKonvaText(this.photoEditorLib.konvaTextTarget);
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.setState({
                  showAcceptCancelMenu: true,
                  selectedTool: "crop",
                  inCropMode: true
                });
                this.photoEditorLib.selectedTool = "crop";
                this.photoEditorLib.beginCrop();
              }}>
                <img className="cropToolIcon toolIcon" src="crop-alt.svg" width="24px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Add Text [T]">
              <div className={`toolIconContainer${this.state.selectedTool === "addText" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "addText") return;
                if (this.state.selectedTool === "drag") this.photoEditorLib.konvaLib.stage.listening(true);
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.readdAllAnchors();
                this.photoEditorLib.focusCanvasContainer("overlayCanvasContainer");
                this.setState({
                  selectedTool: "addText"
                });
                this.photoEditorLib.selectedTool = "addText";
                this.photoEditorLib.enableTextColorPicker();
              }}>
                <img className="addTextToolIcon toolIcon" src="text.svg" width="24px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Paint [B]">
              <div className={`toolIconContainer${this.state.selectedTool === "draw" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "draw") return;
                if (this.state.selectedTool === "drag") this.photoEditorLib.konvaLib.stage.listening(true);
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "addText") this.photoEditorLib.untargetKonvaText(this.photoEditorLib.konvaTextTarget);
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.focusCanvasContainer("drawingCanvasContainer");
                this.setState({
                  selectedTool: "draw"
                });
                this.photoEditorLib.selectedTool = "draw";
                this.photoEditorLib.disableDrawingEraser();
                this.photoEditorLib.enableDrawingCanvas();
                this.photoEditorLib.konvaImagesContainer.style.cursor = "none";
                this.photoEditorLib.drawToolWasJustSelected = true;
              }}>
                <img className="toolIcon" src="brush.svg" height="18px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Erase [E]">
              <div className={`toolIconContainer${this.state.selectedTool === "erase" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "erase") return;
                if (this.state.selectedTool === "drag") this.photoEditorLib.konvaLib.stage.listening(true);
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.untargetKonvaText(this.photoEditorLib.konvaTextTarget);
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.focusCanvasContainer("drawingCanvasContainer");
                this.setState({
                  selectedTool: "erase"
                });
                this.photoEditorLib.selectedTool = "erase";
                this.photoEditorLib.enableDrawingCanvas();
                this.photoEditorLib.enableDrawingEraser();
                this.photoEditorLib.konvaImagesContainer.style.cursor = "none";
              }}>
                <img className="toolIcon" src="eraser-filled.svg" height="18px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Pick Color [P]">
              <div className={`toolIconContainer${this.state.selectedTool === "eyedrop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "eyedrop") return;
                if (this.state.selectedTool === "drag") this.photoEditorLib.konvaLib.stage.listening(true);
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.untargetKonvaText(this.photoEditorLib.konvaTextTarget);
                this.photoEditorLib.enableColorPickerMode();
                this.setState({
                  selectedTool: "eyedrop"
                });
                this.photoEditorLib.selectedTool = "eyedrop";
              }}>
                <img className="toolIcon" src="eyedrop.svg" height="18px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Rotate [R]">
              <div className="toolIconContainer">
                <img className="toolIcon" src="refresh.svg" height="18px" style={{transform: "scaleX(-1)"}} onClick={() => {
                  if (!this.state.imageInstanced) return;
                  this.photoEditorLib.rotate();
                }}></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Manage Image Layers [M]">
              <div id="move-tool-icon" className={`toolIconContainer${this.state.selectedTool === "move" ? " toolIconContainerSelected" : ""}`} onClick={() => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "move") return;
                if (this.state.selectedTool === "drag") this.photoEditorLib.konvaLib.stage.listening(true);
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.untargetKonvaText(this.photoEditorLib.konvaTextTarget);
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.konvaImagesContainer.style.cursor = "move";
                this.photoEditorLib.focusCanvasContainer("konvaImagesContainer");
                this.setState({
                  selectedTool: "move"
                });
                this.photoEditorLib.selectedTool = "move";
              }}>
                <div style={{position: "relative"}}>
                  <img className="toolIcon" src="images.svg" height="18px"></img>
                  <img style={{position: "absolute", top: "8px", left: "2px", filter: "invert()"}} className="toolIcon" src="mouse.svg" height="12px"></img>
                </div>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Drag [G]">
              <div className={`toolIconContainer${this.state.selectedTool === "drag" ? " toolIconContainerSelected" : ""}`}>
                <img className="toolIcon" src="hand-right.svg" height="18px" onClick={() => {
                  if (!this.state.imageInstanced) return;
                  if (this.state.selectedTool === "drag") return;
                  if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                  if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                  if (this.state.selectedTool === "addText") this.photoEditorLib.untargetKonvaText(this.photoEditorLib.konvaTextTarget);
                  if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                  this.photoEditorLib.konvaImagesContainer.style.cursor = "grab";
                  this.photoEditorLib.focusCanvasContainer("konvaImagesContainer");
                  this.photoEditorLib.konvaLib.stage.listening(false);
                  this.photoEditorLib.beginDragMode();
                  this.setState({
                    selectedTool: "drag"
                  });
                  this.photoEditorLib.selectedTool = "drag";
                }}></img>
              </div>
            </Tooltip>
          </div>
          <div id="tools" className="toolsMenuContainer">
            <Tabs type="card" tabBarStyle={{fontSize: "11px"}} tabBarGutter={0} size="small" defaultActiveKey="1" onChange={(activeKey) => {
              this.setState({
                selectedTab: activeKey
              });
            }}>
              <Tabs.TabPane tab="Filters" key="1">
                <div className="filtersTabContainer">
                  <Collapse ghost={true} className="site-collapse-custom-collapse">
                    <Collapse.Panel header="Blur" key="1" className="site-collapse-custom-panel">
                      <EffectSlider name="blur" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={0} max={100} updateState={updateState} value={this.state.blur} defaultValue={this.state.blur} title="Blur" onAfterChange={(value) => {
                        this.photoEditorLib.setSelectedImageFilter("blur", [value, 20]);
                      }}/>
                    </Collapse.Panel>
                  </Collapse>
                  <Collapse ghost={true} className="site-collapse-custom-collapse">
                    <Collapse.Panel header="Bulge/Pinch" key="1" className="site-collapse-custom-panel">
                      <EffectSlider name="bulgePinchRadius" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={0} max={1000} updateState={updateState} value={this.state.bulgePinchRadius} defaultValue={this.state.bulgePinchRadius} title="Bulge/Pinch Radius" onAfterChange={(value) => {
                        this.photoEditorLib.setSelectedImageFilter("bulge/pinch", [{
                          center: [this.state.bulgePinchCenterX / 100, this.state.bulgePinchCenterY / 100],
                          radius: value,
                          strength: this.state.bulgePinchStrength / 100
                        }]);
                      }}/>
                      <EffectSlider name="bulgePinchStrength" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={-100} max={100} updateState={updateState} value={this.state.bulgePinchStrength} defaultValue={this.state.bulgePinchStrength} title="Bulge/Pinch Strength" onAfterChange={(value) => {
                        this.photoEditorLib.setSelectedImageFilter("bulge/pinch", [{
                          center: [this.state.bulgePinchCenterX / 100, this.state.bulgePinchCenterY / 100],
                          radius: this.state.bulgePinchRadius,
                          strength: value / 100
                        }]);
                      }}/>
                      <EffectSlider name="bulgePinchCenterX" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={0} max={100} updateState={updateState} value={this.state.bulgePinchCenterX} defaultValue={this.state.bulgePinchCenterX} title="Bulge/Pinch Center X" onAfterChange={(value) => {



                        setTimeout(() => {
                          this.photoEditorLib.setSelectedImageFilter("bulge/pinch", [{
                            center: [value / 100, this.state.bulgePinchCenterY / 100],
                            radius: this.state.bulgePinchRadius,
                            strength: this.state.bulgePinchStrength / 100
                          }]);
                          this.setState({
                            canvasesContainerLoading: false
                          })
                        }, 50)


                      }}/>
                      <EffectSlider name="bulgePinchCenterY" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={0} max={100} updateState={updateState} value={this.state.bulgePinchCenterY} defaultValue={this.state.bulgePinchCenterY} title="Bulge/Pinch Center Y" onAfterChange={(value) => {
                        this.photoEditorLib.setSelectedImageFilter("bulge/pinch", [{
                          center: [this.state.bulgePinchCenterX / 100, value / 100],
                          radius: this.state.bulgePinchRadius,
                          strength: this.state.bulgePinchStrength / 100
                        }]);
                      }}/>
                    </Collapse.Panel>
                  </Collapse>
                  <Collapse ghost={true} className="site-collapse-custom-collapse">
                    <Collapse.Panel header="Tilt/Shift" key="1" className="site-collapse-custom-panel">
                      <EffectSlider name="tiltShiftBlur" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={0} max={200} updateState={updateState} value={this.state.tiltShiftBlur} defaultValue={this.state.tiltShiftBlur} title="Tilt/Shift Blur" onAfterChange={(value) => {
                        this.photoEditorLib.setSelectedImageFilter("tilt/shift", [value, this.state.tiltShiftGradient, new this.photoEditorLib.PixiLib.PIXI.Point(0.5, 0) , new this.photoEditorLib.PixiLib.PIXI.Point(0.5, 1)]);
                      }}/>
                      <EffectSlider name="tiltShiftGradient" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={0} max={1000} updateState={updateState} value={this.state.tiltShiftGradient} defaultValue={this.state.tiltShiftGradient} title="Tilt/Shift Gradient" onAfterChange={(value) => {
                        this.photoEditorLib.setSelectedImageFilter("tilt/shift", [this.state.tiltShiftBlur, value, new this.photoEditorLib.PixiLib.PIXI.Point(0.5, 0) ,  new this.photoEditorLib.PixiLib.PIXI.Point(0.5, 1)]);
                      }}/>
                    </Collapse.Panel>
                  </Collapse>
                  <h4 style={{display: "flex", justifyContent:"space-between", alignItems: "center", marginTop: "10px", marginLeft: "0px"}}>Filter Gallery</h4>
                  { /* <div style={{display: "flex", justifyContent:"center", alignItems: "center", marginBottom: "10px"}}>
                    <DropdownMenu items={this.selectableFilters} defaultSelectedKey={0} onSelect={(selectedItem) => {
                      this.photoEditorLib.setImageFilter(selectedItem);
                    }}/>
                  </div> */ }
                  {
                    this.state.imageFilterPreviewsLoading ?
                      <div style={{position: "absolute", top: "90px", left: "0px", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
                        <Spin spinning={this.state.imageFilterPreviewsLoading}>
                        </Spin>
                      </div>
                    :
                    null
                  }
                  {
                    this.state.selectedTargetImage ?
                      <ImageGridMenu updateState={updateState} onSelectChange={(selectedFilterName) => {
                        this.setState({
                          canvasesContainerLoading: true
                        })
                        setTimeout(() => {
                          this.photoEditorLib.setSelectedImageFilter(selectedFilterName);
                          this.setState({
                            canvasesContainerLoading: false
                          });
                        }, 50)
                      }} titles={this.selectableFilters} images={this.state.filterPreviewImages} selectedIndex={this.selectableFilters.indexOf(this.state.filter)} />
                    :
                    null
                  }
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Adjustments" key="2">
                <div style={{width: "96%", margin: "auto"}}>
                  <EffectSlider name="contrast" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={-100} max={100} updateState={updateState} value={this.state.contrast} defaultValue={this.state.contrast} title="Contrast" onAfterChange={(value) => {
                    this.photoEditorLib.setSelectedImageFilter("contrast", [value / 100 + 1]);
                  }}/>
                  <EffectSlider name="brightness" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={-100} max={100} updateState={updateState} value={this.state.brightness} defaultValue={this.state.brightness} title="Brightness" onAfterChange={(value) => {
                    this.photoEditorLib.setSelectedImageFilter("brightness", [value / 100 + 1]);
                  }}/>
                  <EffectSlider name="gamma" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={-100} max={100} updateState={updateState} value={this.state.gamma} defaultValue={this.state.gamma} title="Gamma" onAfterChange={(value) => {
                    this.photoEditorLib.setSelectedImageFilter("gamma", [value / 100 + 1]);
                  }}/>
                  <EffectSlider name="saturation" disabled={this.state.selectedTargetImage ? false : true} showInput={true} min={-100} max={100} updateState={updateState} value={this.state.saturation} defaultValue={this.state.saturation} title="Saturation" onAfterChange={(value) => {
                    this.photoEditorLib.setSelectedImageFilter("saturation", [value / 100 + 1]);
                  }}/>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Image" key="3">
              </Tabs.TabPane>
            </Tabs>
            <div style={{width: "96%", margin: "auto"}}>
              <div style={{height:"24px", position: "relative", display: this.state.selectedTab === "3" ? "block" : "none"}}>
                <div style={{display: "flex", alignItems: "center", position: "relative"}}>
                  <h5>Background color: </h5>
                  <div style={{position: "relative", width: "24px", height: "24px"}}>
                    <Tooltip title="Color">
                      <div style={{position: "relative", marginLeft: "10px"}}>
                        <div className="colorPickerButton" style={{pointerEvents: "none", zIndex: 1, position: "absolute", top: "0px", left: "0px", backgroundImage: "url(background_tile_pattern.png)", backgroundSize: "cover"}}></div>
                        <button style={{zIndex: 2, position: "absolute", top: "0px", left: "0px"}} id="background-color-picker-button" className="colorPickerButton" onClick={() => {
                          this.photoEditorLib.showColorPicker("background-color-picker");
                        }}></button>
                      </div>
                    </Tooltip>
                    <div id="background-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
                  </div>
                </div>
                <div style={{display: "flex", alignItems: "center", position: "relative", marginTop: "10px"}}>
                  <h5>Canvas Width: </h5>
                  <div style={{marginLeft: "10px"}}>
                    <InputNumber size="small"/>
                  </div>
                </div>
                <div style={{display: "flex", alignItems: "center", position: "relative", marginTop: "10px"}}>
                  <h5>Canvas Height: </h5>
                  <div style={{marginLeft: "10px"}}>
                    <InputNumber size="small"/>
                  </div>
                </div>
              </div>
            </div>
            <div className="fileOptionsMenu" style={{position: "absolute", bottom: "0px", width: "100%", display: "flex" }}>
              <div style={{marginLeft: "5px"}}>
                <Upload buttonText="Import Image" onUpload={async (file) => {
                  if (!this.acceptedImageTypes.includes(file.type)) return;

                  if (this.state.imageInstanced) {

                    this.setState({
                      canvasesContainerLoading: true,
                      imageFilterPreviewsLoading: true
                    })

                    await this.photoEditorLib.importImage(file);

                    this.setState({
                      canvasesContainerLoading: false
                    });

                    return;
                  }

                  this.setState({
                    canvasesContainerLoading: true,
                    imageFilterPreviewsLoading: true
                  })

                  await this.photoEditorLib.loadImage(file);

                  this.setState({
                    uploadFileList: [],
                    imageInstanced: true,
                    canvasesContainerLoading: false
                  });
                }}
                accept="image/png,image/jpeg,image/jpg"
                showUploadList={{showPreviewIcon: false}}
                fileList={this.state.uploadFileList}/>
              </div>
              <div style={{marginLeft: "5px"}}>
                <CustomModal>
                  <div style={{width: "100%", height: "100px", display: "flex", alignItems: "center", justifyContent: "space-around", flexFlow: "column nowrap"}}>
                    <Button><CloudUploadOutlined/> Save to profile </Button>
                    <Button onClick={() => {
                      this.photoEditorLib.exportImage();
                    }}><DownloadOutlined/> Save to local computer</Button>
                  </div>
                </CustomModal>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default PhotoEditor;
