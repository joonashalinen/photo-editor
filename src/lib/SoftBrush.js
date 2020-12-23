
import { Bezier } from "bezier-js";
import CanvasLib from "./CanvasLib.js";

class SoftBrush {

  constructor(canvas, options) {

    if (!options) options = {};

    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext("2d");
    this.hardness = 1;
    this.hardness = options.hardness ? options.hardness : 0.7;
    this.size = options.size ? options.size : 40;
    this.color = options.color ? options.color : [0, 0, 0, 1];
    this.konvaStage = options.konvaStage ? options.konvaStage : false;
    this.konvaLayer = options.konvaLayer ? options.konvaLayer : false;
    this.canvasScale = options.canvasScale ? options.canvasScale : 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.brushPreviewEnabled = options.brushPreviewEnabled ? options.brushPreviewEnabled : false;

    if (options.cursorCanvas) {
      this.cursorCanvas = options.cursorCanvas ? options.cursorCanvas : false;
      this.cursorCanvas.width = this.canvas.width;
      this.cursorCanvas.height = this.canvas.height;
    }

    this.cursorColor = [0, 0, 0, 255];

    this.enabled = typeof options.enabled !== undefined ? options.enabled : true;

    this.eventListeners = [];

    this.drawnPoints = [];
    this.drawSegments = [];

    this.currentDrawSegment = [];

    /*
    setTimeout(() => {
      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.redrawPoints();
    }, 5000) */

  }

  on(evtString, evtHandler) {
    this.eventListeners.unshift({
      type: evtString,
      handler: evtHandler
    });
  }

  dispatchEvent(evtString, args) {

    for (var i = this.eventListeners.length - 1; i >= 0; i--) {
      var event = this.eventListeners[i];
      if (event.type !== evtString) continue;
      event.handler.apply(null, args);
    }
  }

  getSize() {
    return this.size;
  }

  setSize(value) {
    this.size = value;
  }

  setHardness(value) {
    this.hardness = value;
  }

  setColor(rgba) {
    this.color = rgba;
  }

  setSamplingCanvas(canvas) {
    this.samplingCanvas = canvas;
    this.samplingCtx = canvas.getContext("2d");
    this.samplingImageData = this.samplingCtx.getImageData(0, 0, this.samplingCanvas.width, this.samplingCanvas.height);
    //this.samplingImageData = this.samplingCtx.getImageData(this.samplingCanvas.width, this.samplingCanvas.height);
  }

  setCanvasHeight(value) {
    this.canvas.height = value;
    if (this.cursorCanvas) this.cursorCanvas.height = this.canvas.height;
  }

  setCanvasWidth(value) {
    this.canvas.width = value;
    if (this.cursorCanvas) this.cursorCanvas.width = this.canvas.width;
  }

  setCanvasScale(value) {
    this.canvasScale = value;
  }

  clearCanvasCursor(x, y, ctx) {
    if (!ctx) ctx = this.canvasCtx;
    ctx.clearRect(x - this.size * 2, y - this.size * 2, this.size * 4, this.size * 4);
  }

  clearCanvas(ctx) {
    if (!ctx) ctx = this.canvasCtx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  enableEraseMode() {
    //this.disableBrushPreviewMode();
    this.canvasCtx.globalCompositeOperation = "destination-out";
  };

  disableEraseMode() {
    //this.enableBrushPreviewMode();
    this.canvasCtx.globalCompositeOperation = "source-over";
  };

  enableBrushPreviewMode() {
    this.brushPreviewEnabled = true;
  }

  disableBrushPreviewMode() {
    this.brushPreviewEnabled = false;
  }

  addNewDrawnPoint(point) {
    this.drawnPoints.push(point);
  }

  getDrawnPoints() {
    return this.drawnPoints;
  }

  setDrawnPoints(drawnPoints) {
    this.drawnPoints = drawnPoints;
  }

  getDrawSegments() {
    return this.drawSegments;
  }

  setDrawSegments(drawSegments) {
    this.drawSegments = drawSegments;
  }

  addOffsetToDrawSegments(offsetX, offsetY) {

    var drawSegments = this.getDrawSegments();

    for (var i = 0; i < drawSegments.length; i++) {
      var drawSegment = drawSegments[i];
      drawSegment.brush.offsetX += offsetX;
      drawSegment.brush.offsetY += offsetY;
    }

  }

  setDrawSegmentsOffset(offsetX, offsetY) {
    var drawSegments = this.getDrawSegments();

    for (var i = 0; i < drawSegments.length; i++) {
      var drawSegment = drawSegments[i];
      drawSegment.brush.offsetX = offsetX;
      drawSegment.brush.offsetY = offsetY;
    }
  }

  setOffset(offsetX, offsetY) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  addDrawSegment(drawSegment) {
    var drawSegmentItem = Array.isArray(drawSegment) ? {
      data: drawSegment,
      brush: {
        size: this.size,
        hardness: this.hardness,
        color: this.color,
        globalCompositeOperation: this.canvasCtx.globalCompositeOperation,
        offsetX: 0,
        offsetY: 0
      }
    } : drawSegment;
    this.drawSegments.push(drawSegmentItem);
    return drawSegmentItem;
  }

  popLatestDrawSegment() {
    return this.drawSegments.pop();
  }

  addToCurrentDrawSegment(point) {
    this.currentDrawSegment.push(point);
  }

  resetCurrentDrawSegment() {
    this.currentDrawSegment = [];
  }

  removeDrawSegments() {

    var drawSegments = this.drawSegments;
    this.drawSegments = [];

    return drawSegments;

  }

  redrawSegments() {

    var drawSegments = this.getDrawSegments();

    for (var i = 0; i < drawSegments.length; i++) {
      var drawSegment = drawSegments[i];

      var first = drawSegment.data[0];

      this.lastPoint = {
        x: drawSegment.brush.offsetX + first.x,
        y: drawSegment.brush.offsetY + first.y
      };

      var currentGlobalCompositeOperation = this.canvasCtx.globalCompositeOperation;
      this.canvasCtx.globalCompositeOperation = drawSegment.brush.globalCompositeOperation;

      for (let j = 1; j < drawSegment.data.length; j++) {
        let point =  drawSegment.data[j];
        this.drawPoints(drawSegment.brush.offsetX + point.x, drawSegment.brush.offsetY + point.y, this.canvasCtx, drawSegment.brush, true);
      }

      this.canvasCtx.globalCompositeOperation = currentGlobalCompositeOperation;

    }

  }

  redrawPoints() {

    console.log("redrawing drawn points")

    this.lastPoint = this.drawnPoints[0];

    for (var i = 1; i < this.drawnPoints.length; i++) {
      var point = this.drawnPoints[i];
      this.drawPoints(point.x, point.y, this.canvasCtx, true);
    }

  }

  drawPoints(x, y, ctx, brush, preventAddToDrawnPoints) {

    function distanceBetween(point1, point2) {
      return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
      return Math.atan2( point2.x - point1.x, point2.y - point1.y );
    }

    var getCircleImageData = (imageData, width, height) => {

      var startX = width / 2;
      var startY = height / 2;
      var r = width / 2;
      var index = 0;
      var distSqr;
      var opacity;
      var minimumOpacity = brush.color[3] === 1 && brush.size < 10 ? 0.99 : brush.color[3];
      var hardness = brush.hardness;
      var opaqueCenterRadius = width / 2 * brush.hardness;

      for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {
          distSqr = ((x - startX) * (x - startX) + (y - startY) * (y - startY))
          if (distSqr <= r * r) {
            opacity = (Math.min(minimumOpacity, 1 - ((Math.sqrt(distSqr) - opaqueCenterRadius) / (r - opaqueCenterRadius))));
            if (imageData.data[index + 3] > 0 ) {
              imageData.data[index] = brush.color[0]* opacity + imageData.data[index] * (1 - opacity);
              imageData.data[index + 1] = brush.color[1] * opacity + imageData.data[index + 1] * (1 - opacity);
              imageData.data[index + 2] = brush.color[2] * opacity + imageData.data[index + 2] * (1 - opacity);
              imageData.data[index + 3] = Math.min(Math.max(minimumOpacity * 255, imageData.data[index + 3]) , opacity * 255 + imageData.data[index + 3] * (1 - opacity));
            } else {
              imageData.data[index] = brush.color[0];
              imageData.data[index + 1] = brush.color[1];
              imageData.data[index + 2] = brush.color[2];
              imageData.data[index + 3] = opacity * 255;
            }

          }
          index += 4;
        }

      }

      return imageData;

    }

    this.currentPoint = { x: x, y: y };
    var dist = distanceBetween(this.lastPoint, this.currentPoint);
    var angle = angleBetween(this.lastPoint, this.currentPoint);

    var size = brush.size;
    if (size < 2) size = 2;

    for (var i = 0; i < Math.max(1, dist); i+= size < 35 ? 1 : size / 15) {

      x = this.lastPoint.x + (Math.sin(angle) * i);
      y = this.lastPoint.y + (Math.cos(angle) * i);

      var circleImageData = getCircleImageData(this.canvasCtx.getImageData(x - size / 2, y - size / 2, size, size), size, size);
      this.canvasCtx.putImageData(circleImageData, x - size / 2, y - size / 2);

    }

    if (!preventAddToDrawnPoints) this.addToCurrentDrawSegment(this.currentPoint);
    this.lastPoint = this.currentPoint;

    return;

  }

  enableSoftBrush() {

    function getColorAt(x, y, imageData) {

      x = Math.round(x);
      y = Math.round(y);

      var index = (y * imageData.width * 4) + x * 4;

      return [
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3]
      ]

    }

    var checkColorAtMousePos = (x, y, imageData) => {
      if (!imageData) return;

      var colorAtMousePos = getColorAt(x, y, imageData);

      if (colorAtMousePos[0] < 200 && colorAtMousePos[1] < 200 && colorAtMousePos[2] < 200 && colorAtMousePos[3] > 100) {
        this.cursorColor = [255, 255, 255, 255];
      }
      if (colorAtMousePos[0] > 200 && colorAtMousePos[1] > 200 && colorAtMousePos[2] > 200 && colorAtMousePos[3] > 100) {
        this.cursorColor = [0, 0, 0, 255];
      }
    }

    var drawCursor = (x, y, cursorCtx) => {
      checkColorAtMousePos(x, y, this.samplingImageData);
      checkColorAtMousePos(x, y, this.drawingCloneImageData);
      cursorCtx.beginPath();
      cursorCtx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
      cursorCtx.lineWidth = 1 / this.canvasScale;
      cursorCtx.strokeStyle = `rgba(${this.cursorColor[0]}, ${this.cursorColor[1]}, ${this.cursorColor[2]}, ${this.cursorColor[3]})`;
      cursorCtx.stroke();
    }

    var handleMousemove = (x, y) => {

      if (mouseLeft) {
        this.lastPoint = { x: x, y: y };
        mouseLeft = false;
        return;
      }

      if (!initialized) {
        if (this.brushPreviewEnabled) {
          initialized = true;
          this.lastPoint = { x: x, y: y};
          this.lastCursorMovePoint = { x: x, y: y };
          drawCursor(x, y, cursorCtx)
          /*
          drawPoints(x, y, cursorCtx);
          */
        };
        return;
      }

      if (!isDrawing) {

        if (this.brushPreviewEnabled) {

          if (!this.lastCursorMovePoint) this.lastCursorMovePoint = { x: x, y: y };

          this.clearCanvasCursor(this.lastCursorMovePoint.x, this.lastCursorMovePoint.y, cursorCtx);

          drawCursor(x, y, cursorCtx)

          this.lastCursorMovePoint = { x: x, y: y };
        }

        return;
      }

      if (stoppedCursor && this.brushPreviewEnabled) {
        //this.clearCanvas(cursorCtx);
        stoppedCursor = false;
      }

      this.drawPoints(x, y, ctx, this);

      if (!this.lastCursorMovePoint) this.lastCursorMovePoint = { x: x, y: y };

      this.clearCanvasCursor(this.lastCursorMovePoint.x, this.lastCursorMovePoint.y, cursorCtx);

      this.lastCursorMovePoint = { x: x, y: y };

      drawCursor(x, y, cursorCtx);

    }

    if (this.cursorCanvas) {
      this.cursorCanvas.height = this.canvas.height;
      this.cursorCanvas.width = this.canvas.width;
      this.cursorCanvas.style.transform = this.canvas.style.transform;
    }

    var el = this.canvas;
    var ctx = el.getContext('2d');
    var cursorCtx = this.cursorCanvas.getContext("2d");
    ctx.lineJoin = ctx.lineCap = 'round';

    var isDrawing, mouseLeft;

    var points = [];

    var initialized = false;
    var stoppedCursor = true;

    var innerPointsSpacing = 10;
    var innerPointsCounter = 0;

    var drawSegmentStartIndex;

    this.onMouseDown = (e) => {
      if (this.enabled) {
        this.dispatchEvent("drawbegin", [this.getDrawnPoints().length]);
        isDrawing = true;

        drawSegmentStartIndex = this.getDrawnPoints().length;

        var boundingRect = this.canvas.getBoundingClientRect();

        var x = e.clientX - boundingRect.x;
        var y = e.clientY - boundingRect.y;

        var pos = {x: x / this.canvasScale, y: y / this.canvasScale}

        this.lastPoint = { x: pos.x, y: pos.y };
        points.push(this.lastPoint);
        this.addNewDrawnPoint(this.lastPoint);
        this.addToCurrentDrawSegment(this.lastPoint);
      }
    }

    this.onMouseUp = (e) => {
      if (this.enabled) {

        var boundingRect = this.canvas.getBoundingClientRect();

        var x = e.clientX - boundingRect.x;
        var y = e.clientY - boundingRect.y;

        points = [
          { x: x / this.canvasScale, y: y / this.canvasScale },
          { x: x / this.canvasScale, y: y / this.canvasScale },
          { x: x / this.canvasScale, y: y / this.canvasScale }];

        if (isDrawing) {
          this.drawPoints(x / this.canvasScale, y / this.canvasScale, ctx, this);
          this.dispatchEvent("draw", [this.getDrawnPoints().length]);
          var drawSegmentItem = this.addDrawSegment(this.currentDrawSegment);

          this.dispatchEvent("drawSegment", [drawSegmentItem]);
          this.dispatchEvent("drawend", [this.getDrawnPoints().length]);

          this.resetCurrentDrawSegment();
        }

        isDrawing = false;

        points = [];

        this.drawingCloneImageData = CanvasLib.cloneCanvas(this.canvas).getContext("2d").getImageData(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    var timeout;

    var testDisable = false;

    setTimeout(() => {
      //testDisable = true;
      //console.log("test disabled softBrush")
    }, 10000)

    this.onMouseMove = (e) => {

      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }

      timeout = window.requestAnimationFrame(() => {

        if (this.enabled) {

          var boundingRect = this.canvas.getBoundingClientRect();

          var x = e.clientX - boundingRect.x;
          var y = e.clientY - boundingRect.y;

          var pos = {x: x / this.canvasScale, y: y / this.canvasScale}

          handleMousemove(pos.x, pos.y);

        }

      });

    }

    this.onMouseLeave = (e) => {
      if (this.enabled) {
        this.clearCanvas(cursorCtx);
        points = [];

        if (isDrawing) {
          var drawSegmentItem = this.addDrawSegment(this.currentDrawSegment);

          this.dispatchEvent("drawSegment", [drawSegmentItem]);
          this.dispatchEvent("drawend", [this.getDrawnPoints().length]);

          this.resetCurrentDrawSegment();
        }

        mouseLeft = true;
        isDrawing = false;
      }
    }

    console.log("adding event listeners")

    this.canvas.onmousedown = this.onMouseDown;
    this.canvas.onmouseup = this.onMouseUp;
    this.canvas.onmousemove = this.onMouseMove;
    this.canvas.onmouseleave = this.onMouseLeave;

  }

  removeInstance() {

    this.canvas.onpointerdown = false;
    this.canvas.onpointerup = false;
    this.canvas.onpointermove = false;
    this.canvas.onpointerleave = false;

    /*

    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave); */
  }

}

export default SoftBrush;
