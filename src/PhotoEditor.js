
import React from "react";
import Canvas from "./Canvas.js";
import Upload from "./Upload.js" ;
import EffectSlider from "./EffectSlider.js";
import TextField from "./TextField.js";
import { Input, InputNumber, Button, Tooltip, Empty, Select } from "antd";
import { RotateRightOutlined, UploadOutlined } from "@ant-design/icons"
import '@simonwep/pickr/dist/themes/nano.min.css';
import "./PhotoEditor.css";
import DropdownMenu from "./DropdownMenu.js";
import ContextMenu from "./ContextMenu.js";
import ConfirmPopupButton from "./ConfirmPopupButton.js";
import { Tabs } from 'antd';
import PhotoEditorLib from "./PhotoEditorLib";

class PhotoEditor extends React.Component {

  constructor(props) {
    super(props);

    var selectedTool = "";

    this.state = {
      image: props.image ? props.image : "",
      numberOfTextFields: 0,
      showAcceptCancelMenu: false,
      drawingLineWidth: 10,
      imageInstanced: false,
      selectedTool: selectedTool,
      brushHardness: 50,
      drawingLineWidth: 10
    }

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
      "Vintage",
      "Tilt/Shift"
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

    this.emptyBackgroundMemes = [
      "derp.svg",
      "derpina.svg",
      "cereal-guy.svg",
      "yuno.svg",
      "lol.svg",
      "glasses-guy.svg",
      "jackie-chan.svg",
      "seriously.svg",
      "are-you-kidding-me.svg"
    ]

    this.photoEditorLib = new PhotoEditorLib({
      selectableFilters: this.selectableFilters,
      selectedTool: selectedTool,
      defaultBrushSize: this.state.drawingLineWidth,
      defaultBrushHardness: this.state.brushHardness / 100
    });

  }

  render() {

    return (
      <div id="mainContainer" className="mainContainer">
        <div className="upperRow" style={{position: "relative"}}>
          <div className="toolOptionsMenu">
            <div style={{height:"24px", position: "relative", display: this.state.selectedTool === "draw" ? "block" : "none"}}>
              <Tooltip title="Color">
                <button id="drawing-color-picker-button" className="colorPickerButton" onClick={() => {
                  this.photoEditorLib.showColorPicker("drawing-color-picker");
                }}></button>
              </Tooltip>
              <div id="drawing-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
            </div>
            {
              this.state.selectedTool === "draw" ?
                <>
                  <div className="toolOptionsSlider">
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={1} max={100} defaultValue={ this.state.drawingLineWidth } title="Size:" onAfterChange={(value) => {
                      this.photoEditorLib.setBrushSize(value);
                      this.photoEditorLib.setDrawingLineWidth(value);
                      this.setState({
                        drawingLineWidth: value
                      });
                    }}/>
                  </div>
                  <div className="toolOptionsSlider" style={{width: "140px"}}>
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={10} max={100} defaultValue={this.state.brushHardness} title="Hardness:" onAfterChange={(value) => {
                      this.photoEditorLib.softBrush.setHardness(value / 100);
                      this.setState({
                        brushHardness: value
                      });
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
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={1} max={100} defaultValue={ this.state.drawingLineWidth } title="Size:" onAfterChange={(value) => {
                      this.photoEditorLib.softBrush.setSize(value);
                      this.photoEditorLib.setDrawingLineWidth(value);
                      this.setState({
                        drawingLineWidth: value
                      });
                    }}/>
                  </div>
                  <div className="toolOptionsSlider" style={{width: "140px"}}>
                    <EffectSlider sliderWidth="80" positioning="horizontal" min={10} max={100} defaultValue={this.state.brushHardness} title="Hardness:" onAfterChange={(value) => {
                      this.photoEditorLib.softBrush.setHardness(value / 100);
                      this.setState({
                        brushHardness: value
                      });
                    }}/>
                  </div>
                </>
              :
              null
            }
            <div style={{ position: "relative", display: this.state.selectedTool === "addText" ? "inline-block" : "none"}}>
              <Tooltip title="Color">
                <div id="text-color-picker-button" className="colorPickerButton" onClick={() => {
                  this.photoEditorLib.showColorPicker("text-color-picker");
                }}></div>
              </Tooltip>
              <div id="text-color-picker" className="colorPicker" style={{opacity: 0, visibility: "hidden", transition: "opacity 0.3s"}}></div>
            </div>
            <div style={{display: this.state.selectedTool === "addText" ? "inline-block" : "none", marginLeft: "10px"}}>
              <Select size="small" defaultValue="Impact" onChange={(fontName) => {
                this.photoEditorLib.selectedFont = fontName;
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
                <div style={{position: "absolute", right: "35%", bottom: "10px", marginRight: "69px"}}>
                  <ConfirmPopupButton content={
                    <img className="toolIcon undoRedoButton" src="times-circle_antd-colors.svg" height="18px" style={{filter: "brightness(1)"}} onClick={() => {

                    }}></img>
                  } />
                </div>
              </Tooltip>
            :
            null
          }
          <Tooltip title="Redo">
            <img className="toolIcon undoRedoButton" src="redo.svg" height="18px" style={{position: "absolute", bottom: "10px", marginRight: "21px"}} onClick={() => {
              //this.photoEditorLib.redo();
            }}></img>
          </Tooltip>
          <Tooltip title="Undo">
            <img className="toolIcon undoRedoButton" src="redo.svg" height="18px" style={{position: "absolute", bottom: "10px", marginRight: "45px", transform: "scaleX(-1)"}} onClick={() => {
              //this.photoEditorLib.undo();
            }}></img>
          </Tooltip>
        </div>
        <div className="canvasTools">
          <div id="canvasesContainer" className="canvasesContainer">
            <div style={{position: "absolute", top: "190px", width:"100%"}}>
              {
                !this.state.imageInstanced ?
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

              if (target === this.photoEditorLib.konvaLib.getBackgroundImage()) {
                setOptions([]);
                return;
              }

              if (target instanceof this.photoEditorLib.Konva.Image) {
                setOptions(["Bring To Front", "Delete Image Layer"]);
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
            }}>
              <div id="konvaImagesContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            </ContextMenu>
            <Canvas id="drawingCanvas" containerId="drawingCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            <Canvas id="cursorCanvas" containerId="cursorCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            <Canvas id="overlayCanvas" containerId="overlayCanvasContainer" style={{ position: "absolute", top: 0, left: 0, backgroundColor: "transparent", pointerEvents: "none" }}/>
            <div id="drawingCanvasCursor" className="drawingCanvasCursor" style={{display: "none"}}></div>
            {
              this.state.selectedTool === "crop" ?
                ( <>
                    <Button onClick={(e) => {
                      this.photoEditorLib.acceptCrop();
                      this.setState({
                        selectedTool: "",
                        showAcceptCancelMenu: false
                      });
                      this.photoEditorLib.selectedTool = "";
                      this.photoEditorLib.inCropMode = false;
                    }} type="primary" className="cropAccept"><img className="whiteCheckmark" src="check.svg" height="18px"></img></Button>
                    <Button onClick={() => {
                      this.photoEditorLib.endCrop();
                      this.setState({
                        selectedTool: "",
                        showAcceptCancelMenu: false
                      });
                      this.photoEditorLib.selectedTool = "";
                      this.photoEditorLib.inCropMode = false;
                    }} className="cropCancel">Cancel</Button>
                  </>
                )
              :
              null
            }
          </div>
          <div className="toolIcons">
            <Tooltip placement="right" title="Crop [C]">
              <div className={`toolIconContainer${this.state.selectedTool === "crop" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                return;
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "crop") return;
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.focusTool("crop");
                this.setState({
                  showAcceptCancelMenu: true,
                  selectedTool: "crop",
                  inCropMode: true
                });
                this.photoEditorLib.selectedTool = "crop";
                this.photoEditorLib.beginCrop();
              }}>
                <img className="toolIcon" src="crop-alt.svg" width="24px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Add Text [T]">
              <div className={`toolIconContainer${this.state.selectedTool === "addText" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "addText") return;
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.readdAllAnchors();
                this.photoEditorLib.focusTool("addText");
                this.setState({
                  selectedTool: "addText"
                });
                this.photoEditorLib.selectedTool = "addText";
                this.photoEditorLib.enableTextColorPicker();
              }}>
                <img className="toolIcon" src="text.svg" width="24px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Paint [B]">
              <div className={`toolIconContainer${this.state.selectedTool === "draw" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "draw") return;
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                //this.photoEditorLib.focusTool("draw");
                this.photoEditorLib.focusCanvasContainer("konvaImagesContainer");
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
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                //this.photoEditorLib.focusTool("draw");
                this.photoEditorLib.focusCanvasContainer("konvaImagesContainer");
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
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
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
                  return;
                  if (!this.state.imageInstanced) return;
                  this.photoEditorLib.rotate();
                }}></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Move [V]">
              <div id="move-tool-icon" className={`toolIconContainer${this.state.selectedTool === "move" ? " toolIconContainerSelected" : ""}`} onClick={() => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "move") return;
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "erase") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.photoEditorLib.konvaImagesContainer.style.cursor = "move";
                this.photoEditorLib.focusCanvasContainer("konvaImagesContainer");
                this.setState({
                  selectedTool: "move"
                });
                this.photoEditorLib.selectedTool = "move";
              }}>
                <img className="toolIcon" src="move-outline.svg" height="18px"></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Drag [G]">
              <div className={`toolIconContainer${this.state.selectedTool === "drag" ? " toolIconContainerSelected" : ""}`}>
                <img className="toolIcon" src="hand-right.svg" height="18px" onClick={() => {
                  return;
                  if (!this.state.imageInstanced) return;
                  if (this.state.selectedTool === "drag") return;
                  if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                  if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                  if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
                  if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                  document.getElementById("canvas").style.cursor = "grab";
                  this.photoEditorLib.focusCanvasContainer("canvasContainer");
                  this.setState({
                    selectedTool: "drag"
                  });
                  this.photoEditorLib.selectedTool = "drag";
                }}></img>
              </div>
            </Tooltip>
            <Tooltip placement="right" title="Effects & Filters">
              <div style={{visibility: "hidden"}} className={`toolIconContainer${this.state.selectedTool === "effects" ? " toolIconContainerSelected" : ""}`} onClick={(e) => {
                if (!this.state.imageInstanced) return;
                if (this.state.selectedTool === "effects") return;
                if (this.state.selectedTool === "crop") this.photoEditorLib.endCrop();
                if (this.state.selectedTool === "draw") this.photoEditorLib.disableDrawingCanvas();
                if (this.state.selectedTool === "addText") this.photoEditorLib.removeAllAnchors();
                if (this.state.selectedTool === "eyedrop") this.photoEditorLib.disableColorPickerMode();
                this.setState({
                  selectedTool: "effects"
                });
                this.photoEditorLib.selectedTool = "effects";
              }}>
                <span style={{fontSize: "12px", fontWeight: "bold", margin: 0, fontStyle: "italic", cursor: "default"}}>fx</span>
              </div>
            </Tooltip>

          </div>
          <div id="tools" className="toolsMenuContainer">
            <Tabs type="card" tabBarStyle={{fontSize: "11px"}} tabBarGutter={0} size="small" defaultActiveKey="1">
              <Tabs.TabPane tab="Filters" key="1">
                <div style={{width: "96%", margin: "auto"}}>
                  <EffectSlider showInput={true} min={0} max={100} defaultValue={0} title="Blur" onAfterChange={(value) => {
                    this.photoEditorLib.setImageFilter("blur", [value, 20]);
                  }}/>
                  <h5 style={{display: "flex", justifyContent:"space-between", alignItems: "center"}}>Image Filter</h5>
                  <div style={{display: "flex", justifyContent:"center", alignItems: "center", marginBottom: "10px"}}>
                    <DropdownMenu items={this.selectableFilters} defaultSelectedKey={0} onSelect={(selectedItem) => {
                      this.photoEditorLib.setImageFilter(selectedItem);
                    }}/>
                  </div>
                </div>
              </Tabs.TabPane>
              <Tabs.TabPane tab="Adjustments" key="2">
                <div style={{width: "96%", margin: "auto"}}>
                  <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Contrast" onAfterChange={(value) => {
                    this.photoEditorLib.setImageFilter("contrast", [value / 100 + 1]);
                  }}/>
                  <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Brightness" onAfterChange={(value) => {
                    this.photoEditorLib.setImageFilter("brightness", [value / 100 + 1]);
                  }}/>
                  <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Gamma" onAfterChange={(value) => {
                    this.photoEditorLib.setImageFilter("gamma", [value / 100 + 1]);
                  }}/>
                  <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Saturation" onAfterChange={(value) => {
                    this.photoEditorLib.setImageFilter("saturation", [value / 100 + 1]);
                  }}/>
                </div>
              </Tabs.TabPane>
            </Tabs>
            <div style={{position: "absolute", bottom: "0px", width: "100%", display: "flex" }}>
              <div style={{marginLeft: "5px"}}>
                <Upload buttonText="Import Image" onUpload={(file) => {
                  if (!this.acceptedImageTypes.includes(file.type)) return;

                  if (this.state.imageInstanced) {
                    file.arrayBuffer().then(buffer => {
                      this.photoEditorLib.importImage(buffer);
                    });
                    return;
                  }

                  this.photoEditorLib.removeImageInstance();
                  file.arrayBuffer().then(buffer => {
                    this.photoEditorLib.changeImage(buffer);
                  });
                  this.setState({
                    uploadFileList: [],
                    imageInstanced: true
                  });
                }}
                accept="image/png,image/jpeg,image/jpg"
                showUploadList={{showPreviewIcon: false}}
                fileList={this.state.uploadFileList}/>
              </div>
              <div style={{marginLeft: "5px"}}>
                <Button>Cancel</Button>
              </div>
              <div style={{marginLeft: "5px"}}>
                <Button type="primary" id="saveImageButton">Save</Button>
              </div>
            </div>
            {
              this.state.selectedTool === "effects" ?
                <Tabs type="card" tabBarStyle={{fontSize: "11px"}} tabBarGutter={0} size="small" defaultActiveKey="1">
                  <Tabs.TabPane tab="Filters" key="1">
                    <div style={{width: "96%", margin: "auto"}}>
                      <EffectSlider min={0} max={20} defaultValue={0} title="Blur" onAfterChange={(value) => {

                      }}/>
                      <h5 style={{display: "flex", justifyContent:"space-between", alignItems: "center"}}>Image Filters</h5>
                      <div style={{display: "flex", justifyContent:"center", alignItems: "center", marginBottom: "10px"}}>
                        <DropdownMenu items={this.selectableFilters} defaultSelectedKey={0} onSelect={(selectedItem) => {
                          this.photoEditorLib.setImageFilter(selectedItem);
                        }}/>
                      </div>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Adjustments" key="2">
                  <div style={{width: "96%", margin: "auto"}}>
                    <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Contrast" onAfterChange={(value) => {
                      this.photoEditorLib.setImageFilter("contrast", [value / 100 + 1]);
                    }}/>
                    <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Brightness" onAfterChange={(value) => {
                      this.photoEditorLib.setImageFilter("brightness", [value / 100 + 1]);
                    }}/>
                    <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Gamma" onAfterChange={(value) => {
                      this.photoEditorLib.setImageFilter("gamma", [value / 100 + 1]);
                    }}/>
                    <EffectSlider showInput={true} min={-100} max={100} defaultValue={0} title="Saturation" onAfterChange={(value) => {
                      this.photoEditorLib.setImageFilter("saturation", [value / 100 + 1]);
                    }}/>
                  </div>
                  </Tabs.TabPane>
                </Tabs>
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
