
class SoftBrush {

  constructor(canvas, options) {
    this.canvas = canvas
    this.hardness = 1;
    this.hardness = options.hardness ? options.hardness : 0.7;
    this.size = options.size ? options.size : 40;
    this.color = options.color ? options.color : [0, 0, 0, 1];

    this.brushPreviewEnabled = options.brushPreviewEnabled ? options.brushPreviewEnabled : false;

    if (options.cursorCanvas) {
      this.cursorCanvas = options.cursorCanvas ? options.cursorCanvas : false;
      this.cursorCanvas.width = this.canvas.width;
      this.cursorCanvas.height = this.canvas.height;
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
    this.disableBrushPreviewMode();
    this.canvas.getContext("2d").globalCompositeOperation = "destination-out";
  };

  disableEraseMode() {
    this.enableBrushPreviewMode();
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

    var drawPoints = (e, ctx) => {

      var currentPoint = { x: e.offsetX, y: e.offsetY };
      var dist = distanceBetween(lastPoint, currentPoint);
      var angle = angleBetween(lastPoint, currentPoint);

      for (var i = 0; i < dist; i+=1) {

        var x = lastPoint.x + (Math.sin(angle) * i);
        var y = lastPoint.y + (Math.cos(angle) * i);

        /*
        var radgrad = ctx.createRadialGradient(x,y,1,x,y,1);

        radgrad.addColorStop(0, '#000');
        radgrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radgrad;
        ctx.fillRect(x, y, 1, 1); */

        var spacing = innerPointsSpacing * this.getSize() / 100 ;

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


        /*
        var radgrad = ctx.createRadialGradient(x, y, this.size / 2 / 2, x, y, this.size / 2);

        radgrad.addColorStop(0, 'rgba(0,0,0,1)');
        radgrad.addColorStop(0.1, 'rgba(0,0,0,0.01)');
        radgrad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radgrad;
        ctx.fillRect(x - (this.size / 2), y - (this.size / 2), this.size, this.size); */

        }

        lastPoint = currentPoint;
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

    el.onmousedown = (e) => {
      isDrawing = true;
      lastPoint = { x: e.offsetX, y: e.offsetY };
    };

    var initialized = false;
    var stoppedCursor = true;

    var innerPointsSpacing = 10;
    var innerPointsCounter = 0;

    el.onmousemove = (e) => {

      if (mouseLeft) {
        lastPoint = { x: e.offsetX, y: e.offsetY };
        mouseLeft = false;
        return;
      }

      this.canvas.style.cursor = "none";

      if (!initialized) {
        if (this.brushPreviewEnabled) {
          initialized = true;
          lastPoint = { x: e.offsetX, y: e.offsetY };
          drawPoints(e, cursorCtx);
        };
        return;
      }

      if (!isDrawing) {

        if (this.brushPreviewEnabled) {
          this.clearCanvas(cursorCtx);

          for (var i = 0; i < 10; i++) {
            var x = e.offsetX;
            var y = e.offsetY;
            x += i % 2 === 0 ? -1 : 1;
            y += i % 2 === 0 ? -1 : 1;
            drawPoints({offsetX: x, offsetY: y}, cursorCtx);
          }
        }

        return;
      }

      if (stoppedCursor && this.brushPreviewEnabled) {
        this.clearCanvas(cursorCtx);
        stoppedCursor = false;
      }

      drawPoints(e, ctx);


      /*
      if (!initialized) {
        if (this.cursorCanvas) {
          initialized = true;
          lastPoint = { x: e.offsetX, y: e.offsetY };
          drawPoints(e);
        }
      }
      drawPoints(e); */

      /*
      if (!isDrawing) {
        if (this.cursorCanvas) {
          isDrawing = true;
          lastPoint = { x: e.offsetX, y: e.offsetY };
          this.clearCanvas();
          drawPoints(e);
        }
        return;
      }
      drawPoints(e); */
      //drawPoints(e);
    };

    el.onmouseup = () => {
      isDrawing = false;
      stoppedCursor = true;
    };

    el.onmouseleave = () => {
      this.clearCanvas(cursorCtx);
      mouseLeft = true;
    };

  }

}

export default SoftBrush;
