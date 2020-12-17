
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

  clearCanvas(ctx) {
    if (!ctx) ctx = this.canvasCtx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  enableEraseMode() {
    //this.disableBrushPreviewMode();
    this.canvas.getContext("2d").globalCompositeOperation = "destination-out";
  };

  disableEraseMode() {
    //this.enableBrushPreviewMode();
    this.canvas.getContext("2d").globalCompositeOperation = "source-over";
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

  addDrawSegment(drawSegment) {
    this.drawSegments.push(drawSegment);
  }

  popLatestDrawSegment() {
    return this.drawSegments.pop();
  }

  addToCurrentDrawSegment(point) {
    this.currentDrawSegment.push(point);
    console.log(this.currentDrawSegment)
  }

  resetCurrentDrawSegment() {
    this.currentDrawSegment = [];
  }

  redrawSegments() {

    var drawSegments = this.getDrawSegments();

    console.log(drawSegments)

    for (var i = 0; i < drawSegments.length; i++) {
      var drawSegment = drawSegments[i];

      this.lastPoint = drawSegment[0];

      for (let j = 0; j < drawSegment.length; j++) {
        let point = drawSegment[j];
        this.drawPoints(point.x, point.y, this.canvasCtx, true);
      }

    }

  }

  redrawPoints() {

    console.log("redrawing drawn points")

    console.log(this.drawnPoints)

    this.lastPoint = this.drawnPoints[0];

    for (var i = 1; i < this.drawnPoints.length; i++) {
      var point = this.drawnPoints[i];
      this.drawPoints(point.x, point.y, this.canvasCtx, true);
    }

  }


  drawPoints(x, y, ctx, preventAddToDrawnPoints) {

    function distanceBetween(point1, point2) {
      return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
      return Math.atan2( point2.x - point1.x, point2.y - point1.y );
    }

    this.currentPoint = { x: x, y: y };
    var dist = distanceBetween(this.lastPoint, this.currentPoint);
    var angle = angleBetween(this.lastPoint, this.currentPoint);


    for (var i = 0; i < Math.max(1, dist); i+= this.size < 35 ? 1 : 5) {

      x = this.lastPoint.x + (Math.sin(angle) * i);
      y = this.lastPoint.y + (Math.cos(angle) * i);

      if (this.size < 5 || this.hardness === 1) { // hardness no longer applied for brush sizes below 5 or brushes at 100 hardness

        console.log("no hardness on brush")

        var radgrad = ctx.createRadialGradient(x,y,0,x,y,1);

        radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
        radgrad.addColorStop(0.5, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
        radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);

        ctx.fillStyle = radgrad;
        ctx.fillRect(x-this.size / 2, y-this.size / 2, this.size, this.size);

      } else {

        var radgrad = ctx.createRadialGradient(x,y, this.size < 40 ? Math.max(this.size / 2 / 2, 1) : 10,x,y,this.size / 2);

        var opacity = this.color[3] === 1 ? this.color[3] : Math.pow(this.color[3], 3);

        radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${opacity})`);
        // brush hardness settings on the UI as of the time of writing start from 0.1 and go up to 1
        radgrad.addColorStop(0.5 + ((this.hardness - 0.1) / 2), `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(opacity, 0.5 + ( this.hardness - 0.1) / 2)})`);
        radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);

        ctx.fillStyle = radgrad;
        ctx.fillRect(x-this.size / 2, y-this.size / 2, this.size, this.size);
      }

    }

    if (!preventAddToDrawnPoints) this.addToCurrentDrawSegment(this.currentPoint);
    this.lastPoint = this.currentPoint;

    return;

  }

  enableSoftBrush() {

    function distanceBetween(point1, point2) {
      return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
      return Math.atan2( point2.x - point1.x, point2.y - point1.y );
    }

    var drawn = 0;

    var drawPoints = (x, y, ctx, preventAddToDrawnPoints) => {

      //if (drawn) return;

      this.currentPoint = { x: x, y: y };
      var dist = distanceBetween(this.lastPoint, this.currentPoint);
      var angle = angleBetween(this.lastPoint, this.currentPoint);


      for (var i = 0; i < Math.max(1, dist); i+= this.size < 35 ? 1 : 5) {

        x = this.lastPoint.x + (Math.sin(angle) * i);
        y = this.lastPoint.y + (Math.cos(angle) * i);

        // hardness no longer applied for brush sizes below 5 or brushes at 100 hardness
        if (this.size < 5 || this.hardness === 1) {

          console.log("no hardness on brush")

          //var radgrad = ctx.createRadialGradient(x,y,0,x,y,1);

          /*
          radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
          radgrad.addColorStop(0.5, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
          radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`); */

          /*
          ctx.fillStyle = radgrad;
          ctx.fillRect(x-this.size / 2, y-this.size / 2, this.size, this.size); */

          ctx.beginPath();
          ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.color[3]})`;
          ctx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();

        } else {

          var radgrad = ctx.createRadialGradient(x,y, this.size < 40 ? Math.max(this.size / 2 / 2, 1) : 10,x,y,this.size / 2);

          var opacity = this.color[3] === 1 ? this.color[3] : Math.pow(this.color[3], 3);

          radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${opacity})`);
          // brush hardness settings on the UI as of the time of writing start from 0.1 and go up to 1
          radgrad.addColorStop(0.5 + ((this.hardness - 0.1) / 2), `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(opacity, 0.5 + ( this.hardness - 0.1) / 2)})`);
          radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);

          ctx.fillStyle = radgrad;
          ctx.fillRect(x-this.size / 2, y-this.size / 2, this.size, this.size);
        }

      }

      if (!preventAddToDrawnPoints) this.addToCurrentDrawSegment(this.currentPoint);
      this.lastPoint = this.currentPoint;
      /*
      var bezier = new Bezier(points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y);

      points = [points[2]];

      for (var i = 0; i < 100; i++) {
        var point = bezier.get(i / 100);

        x = point.x;
        y = point.y;


        var opacity = 0;

        if (this.hardness > 0.8) opacity = (this.hardness - 0.8) * 5;

        for (let i = 0; i < Math.max(1, this.size / 2 + (this.size / 2 / 2 * this.hardness)); i++) {

          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, (this.size / 2 / 2 + (this.size / 2 / 2 * this.hardness)) - i), 0, 2 * Math.PI);
          if (i >= Math.max(1, this.size / 2 + (this.size / 2 / 2 * this.hardness)) - 1) opacity = 1;
          ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(this.color[3], opacity)})`
          ctx.fill();
          opacity += (1 / this.size);
          ctx.closePath();

        }

        opacity = 0;

        for (let i = 0; i < Math.max(1, this.size / 2 - (this.size / 2 * this.hardness)); i++) {

          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, (this.size / 2 - (this.size / 2 * this.hardness)) - i), 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(this.color[3], opacity)})`
          ctx.fill();
          opacity += (0.1 / this.size)
          ctx.closePath();

        }

      }

      return; */

      return;


      for (var i = 0; i < dist; i += Math.max(1, this.size / 10) ) {

        var x = this.lastPoint.x + (Math.sin(angle) * i);
        var y = this.lastPoint.y + (Math.cos(angle) * i);

        /*
        var radgrad = ctx.createRadialGradient(x,y,1,x,y,1);

        radgrad.addColorStop(0, '#000');
        radgrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radgrad;
        ctx.fillRect(x, y, 1, 1); */

        var spacing = innerPointsSpacing * this.getSize() / 100 ;

        var opacity = 0;


        if (this.hardness > 0.8) opacity = (this.hardness - 0.8) * 5;

        /*
        for (let i = 0; i < Math.max(1, this.size / 2 + (this.size / 2 / 2 * this.hardness)); i++) {

          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, (this.size / 2 / 2 + (this.size / 2 / 2 * this.hardness)) - i), 0, 2 * Math.PI);
          if (i >= Math.max(1, this.size / 2 + (this.size / 2 / 2 * this.hardness)) - 1) opacity = 1;
          ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(this.color[3], opacity)})`
          ctx.fill();
          opacity += (1 / this.size);
          ctx.closePath();

        } */

        opacity = 0;


        for (let i = 0; i < Math.max(1, this.size / 2 - (this.size / 2 * this.hardness)); i++) {

          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, (this.size / 2 - (this.size / 2 * this.hardness)) - i), 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(this.color[3], opacity)})`
          ctx.fill();
          opacity += (0.1 / this.size)
          ctx.closePath();

        }

        /*
        if (innerPointsCounter++ % spacing === 0) {

          var radgrad = ctx.createRadialGradient(x, y, 1, x, y, Math.max(1, this.size / 2 / 4));

          //radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
          radgrad.addColorStop(0, `rgba(${this.color[0]},${this.color[1]},${this.color[2]},1)`);
          radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);

          ctx.fillStyle = radgrad;
          ctx.fillRect(x - (this.size / 2 / 4), y - (this.size / 2 / 4), Math.max(1, this.size / 4), Math.max(1, this.size / 4));

        }

        var radgrad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, this.size / 2));

        //radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
        radgrad.addColorStop(this.hardness, `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.hardness})`);
        radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);

        ctx.fillStyle = radgrad;
        ctx.fillRect(x - (this.size / 2), y - (this.size / 2), Math.max(1, this.size), Math.max(1, this.size));
        */

      };

    }

    var checkColorCounter = 0;

    var checkColorAtMousePos = (x, y, canvas) => {
      if (checkColorCounter++ < 10) return;
      checkColorCounter = 0;
      var cloneCanvas = CanvasLib.cloneCanvas(canvas);
      var ctx = cloneCanvas.getContext("2d");
      var colorAtMousePos = ctx.getImageData(x, y, 1, 1).data;
      if (colorAtMousePos[0] < 200 && colorAtMousePos[1] < 200 && colorAtMousePos[2] < 200 && colorAtMousePos[3] > 100) {
        this.cursorColor = [255, 255, 255, 255];
      }
      if (colorAtMousePos[0] > 200 && colorAtMousePos[1] > 200 && colorAtMousePos[2] > 200 && colorAtMousePos[3] > 100) {
        this.cursorColor = [0, 0, 0, 255];
      }
    }

    var drawCursor = (x, y, cursorCtx) => {
      checkColorAtMousePos(x, y, this.samplingCanvas);
      checkColorAtMousePos(x, y, this.canvas);
      cursorCtx.beginPath();
      cursorCtx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
      cursorCtx.lineWidth = 1 / this.canvasScale;
      cursorCtx.strokeStyle = `rgba(${this.cursorColor[0]}, ${this.cursorColor[1]}, ${this.cursorColor[2]}, ${this.cursorColor[3]})`;
      cursorCtx.stroke();
    }

    var handleMousemove = (x, y) => {
      if (testDisable) return;

      if (mouseLeft) {
        this.lastPoint = { x: x, y: y };
        mouseLeft = false;
        return;
      }

      this.canvas.style.cursor = "none";

      if (!initialized) {
        if (this.brushPreviewEnabled) {
          initialized = true;
          this.lastPoint = { x: x, y: y};
          drawCursor(x, y, cursorCtx)
          /*
          drawPoints(x, y, cursorCtx);
          */
        };
        return;
      }

      if (!isDrawing) {

        if (this.brushPreviewEnabled) {
          this.clearCanvas(cursorCtx);

          drawCursor(x, y, cursorCtx)

          /*
          lastPoint = { x: x, y: y };
          */
          /*
          var counter = 0;
          for (var i = 0; i < 10; i++) {
            counter++;
            let cursorX = counter % 2 === 0 ? x : x - 1;
            let cursorY = counter % 2 === 0 ? y : y - 1;
            drawPoints(cursorX, cursorY, cursorCtx);
          }
          */
        }

        return;
      }

      if (stoppedCursor && this.brushPreviewEnabled) {
        this.clearCanvas(cursorCtx);
        stoppedCursor = false;
      }

      points.push({x: x, y: y});

      if (points.length >= 3) {
        if (testDisable) return;
        drawPoints(x, y, ctx);
        this.dispatchEvent("draw", [this.getDrawnPoints().length]);
      }

      //drawPoints(x, y, ctx);

      if (testDisable) return;

      this.clearCanvas(cursorCtx);

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
      if (this.enabled){
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

        this.lastPoint = { x: x / this.canvasScale, y: y / this.canvasScale };
        drawPoints(x / this.canvasScale, y / this.canvasScale, ctx);

        this.dispatchEvent("draw", [this.getDrawnPoints().length]);

        isDrawing = false;

        points = [];

        this.addDrawSegment(this.currentDrawSegment);

        this.dispatchEvent("drawSegment", [this.currentDrawSegment]);
        this.dispatchEvent("drawend", [this.getDrawnPoints().length]);

        this.resetCurrentDrawSegment();
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
        mouseLeft = true;
        isDrawing = false;
      }
    }

    console.log("adding event listeners")

    this.canvas.onmousedown = this.onMouseDown;
    this.canvas.onmouseup = this.onMouseUp;
    this.canvas.onmousemove = this.onMouseMove;
    this.canvas.onmouseleave = this.onMouseLeave;

    /*
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave); */

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
