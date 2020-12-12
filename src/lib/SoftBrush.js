
import { Bezier } from "bezier-js";

class SoftBrush {

  constructor(canvas, options) {

    if (!options) options = {};

    this.canvas = canvas
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
    this.size = Math.floor(value);
  }

  setHardness(value) {
    this.hardness = value;
  }

  setColor(rgba) {
    this.color = rgba;
  }

  setCanvasHeight(value) {
    this.canvas.height = value;
    if (this.cursorCanvas) this.cursorCanvas.height = this.canvas.height;
  }

  setCanvasWidth(value) {
    this.canvas.width = value;
    if (this.cursorCanvas) this.cursorCanvas.width = this.canvas.width;
  }

  clearCanvas(ctx) {
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

  enableSoftBrush() {

    function distanceBetween(point1, point2) {
      return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
      return Math.atan2( point2.x - point1.x, point2.y - point1.y );
    }

    var drawn = 0;

    var drawPoints = (x, y, ctx) => {

      //if (drawn) return;

      var currentPoint = { x: x, y: y };
      var dist = distanceBetween(lastPoint, currentPoint);
      var angle = angleBetween(lastPoint, currentPoint);


      for (var i = 0; i < dist; i+= this.size < 35 ? 1 : 5) {

        x = lastPoint.x + (Math.sin(angle) * i);
        y = lastPoint.y + (Math.cos(angle) * i);

        if (this.size < 5) { // hardness no longer applied for brush sizes below 5

          var radgrad = ctx.createRadialGradient(x,y,0,x,y,1);

          radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
          radgrad.addColorStop(0.5, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);
          radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`);

          ctx.fillStyle = radgrad;
          ctx.fillRect(x-this.size / 2, y-this.size / 2, this.size, this.size);

        } else {

          var radgrad = ctx.createRadialGradient(x,y, this.size < 40 ? Math.max(this.size / 2 / 2, 1) : 10,x,y,this.size / 2);

          console.log(this.color)

          var opacity = this.color[3] === 1 ? this.color[3] : Math.pow(this.color[3], 3);

          radgrad.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${opacity})`);
          // brush hardness settings on the UI as of the time of writing start from 0.1 and go up to 1
          radgrad.addColorStop(0.5 + ((this.hardness - 0.1) / 2), `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${Math.min(opacity, 0.5 + ( this.hardness - 0.1) / 2)})`);
          radgrad.addColorStop(1, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0)`);

          ctx.fillStyle = radgrad;
          ctx.fillRect(x-this.size / 2, y-this.size / 2, this.size, this.size);
        }

      }

      lastPoint = currentPoint;
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

        var x = lastPoint.x + (Math.sin(angle) * i);
        var y = lastPoint.y + (Math.cos(angle) * i);

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

    var checkColorAtMousePos = (x, y) => {
      var colorAtMousePos = ctx.getImageData(x, y, 1, 1).data;
      if (colorAtMousePos[0] < 200 && colorAtMousePos[1] < 200 && colorAtMousePos[2] < 200 && colorAtMousePos[3] > 100) {
        this.cursorColor = [255, 255, 255, 255];
      }
    }

    var drawCursor = (x, y, ctx) => {
      ctx.beginPath();
      ctx.arc(x, y, this.size / 2, 0, 2 * Math.PI);
      ctx.lineWidth = 1 / this.canvasScale;
      ctx.strokeStyle = `rgba(${this.cursorColor[0]}, ${this.cursorColor[1]}, ${this.cursorColor[2]}, ${this.cursorColor[3]})`;
      ctx.stroke();
    }

    var handleMousemove = (x, y) => {

      if (mouseLeft) {
        lastPoint = { x: x, y: y };
        mouseLeft = false;
        return;
      }

      this.canvas.style.cursor = "none";

      if (!initialized) {
        if (this.brushPreviewEnabled) {
          initialized = true;
          lastPoint = { x: x, y: y};
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

      if (points.length >= 3) drawPoints(x, y, ctx);

      //drawPoints(x, y, ctx);

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

    var isDrawing, lastPoint, mouseLeft;

    var points = [];

    var initialized = false;
    var stoppedCursor = true;

    var innerPointsSpacing = 10;
    var innerPointsCounter = 0;

    if (this.konvaStage) {

      this.konvaStage.on('mousedown touchstart', () => {
        if (this.enabled){
          this.dispatchEvent("drawbegin");
          isDrawing = true;
          var pos = this.konvaStage.getPointerPosition();

          /*
          var x = pos.x;
          var y = pos.y;

          if (this.konvaStage.rotation() === 90) {
            pos.y = this.konvaStage.width() - x;
            pos.x = y;
          } else if (this.konvaStage.rotation() === 180) {
            pos.y = this.konvaStage.height() - y;
            pos.x = this.konvaStage.width() - x;
          } else if (this.konvaStage.rotation() === 270) {
            pos.y = x;
            pos.x = this.konvaStage.height() - y;
          } */

          lastPoint = { x: pos.x / this.konvaStage.scale().x, y: pos.y / this.konvaStage.scale().y };
          points.push(lastPoint);
        }
      });

      this.konvaStage.on('mouseup touchend', () => {
        if (this.enabled) {
          points = [];
          isDrawing = false;
          this.dispatchEvent("drawend");
        }
      });

      let timeout;

      this.konvaStage.on('mousemove touchmove', () => {


        if (timeout) {
          window.cancelAnimationFrame(timeout);
        }

        timeout = window.requestAnimationFrame(() => {

          console.log("asd")

          if (this.enabled) {
            var pos = this.konvaStage.getPointerPosition();

            /*
            var x = pos.x;
            var y = pos.y;

            if (this.konvaStage.rotation() === 90) {
              pos.y = this.konvaLayer.width() - x + this.konvaLayer.y();
              pos.x = y - this.konvaLayer.x();
            } else if (this.konvaStage.rotation() === 180) {
              pos.y = this.konvaStage.height() - y;
              pos.x = this.konvaStage.width() - x;
            } else if (this.konvaStage.rotation() === 270) {
              pos.y = x;
              pos.x = this.konvaStage.height() - y;
            } */


            handleMousemove(pos.x / this.konvaStage.scale().x, pos.y / this.konvaStage.scale().y);

            this.konvaStage.batchDraw();

            this.dispatchEvent("draw");
          }

        });

      });

      this.konvaStage.on('mouseleave', () => {
        if (this.enabled) {
          this.clearCanvas(cursorCtx);
          points = [];
          mouseLeft = true;
          this.konvaStage.batchDraw();
        }
      });

      return;
    }

    this.onMouseDown = (e) => {
      if (this.enabled){
        this.dispatchEvent("drawbegin");
        isDrawing = true;
        var pos = {x: e.offsetX, y: e.offsetY}

        lastPoint = { x: pos.x, y: pos.y };
        points.push(lastPoint);
      }
    }

    this.onMouseUp = (e) => {
      if (this.enabled) {
        points = [];
        isDrawing = false;
        this.dispatchEvent("drawend");
      }
    }

    var timeout;

    this.onMouseMove = (e) => {

      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }

      timeout = window.requestAnimationFrame(() => {

        if (this.enabled) {
          var pos = {x: e.offsetX, y: e.offsetY}

          handleMousemove(pos.x, pos.y);

          this.dispatchEvent("draw");
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

    this.canvas.onpointerdown = this.onMouseDown;
    this.canvas.onpointerup = this.onMouseUp;
    this.canvas.onpointermove = this.onMouseMove;
    this.canvas.onpointerleave = this.onMouseLeave;

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
