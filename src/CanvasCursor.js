
class CanvasCursor {

  constructor(canvasElement, cursorElement, options) {
    this.canvas = canvasElement;
    this.cursor = cursorElement;

    this.canvas.addEventListener("mousemove", (e) => {
      this.updateCursor(e);
    });

    this.canvas.addEventListener("mouseleave", (e) => {
      this.hideCursor();
    });

    this.canvas.addEventListener("mouseenter", (e) => {
      this.showCursor();
    });

    if (!options) options = {};

    this.canvasScale = options.canvasScale ? options.canvasScale : 1;
    this.cursorSize = options.cursorSize ? options.cursorSize : 5;
    this.cursorSize += 8;
    this.cursor.style.width = this.cursorSize + "px";
    this.cursor.style.height = this.cursorSize + "px";

    this.cursor.style.borderColor = "white";

    this.offsetX = 0;
    this.offsetY = 0;

  }

  setOffsetX(value) {
    this.offsetX = value;
  }

  setOffsetY(value) {
    this.offsetY = value;
  }

  getOffsetX() {
    return this.offsetX;
  }

  getOffsetY() {
    return this.offsetY;
  }

  setCanvasScale(value) {
    this.canvasScale = value;
  }

  setCursorSize(value) {
    console.log(value)
    this.cursorSize = value + 8;
    this.cursor.style.width = this.cursorSize + "px";
    this.cursor.style.height = this.cursorSize + "px";
  }

  setCursorColor(rgba) {
    this.cursor.style.borderColor = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3] ? rgba[3] : 1})`;
  }

  updateCursor(e) {

    var canvasParent = this.canvas.parentElement;
    var canvasParentRect = canvasParent.getBoundingClientRect();

    var canvasRect = this.canvas.getBoundingClientRect();

    var x = canvasRect.x - canvasParentRect.x;
    var y = canvasRect.y - canvasParentRect.y;

    x -= this.cursor.offsetWidth / 2;
    y -= this.cursor.offsetHeight / 2;

    // +1px for some reason looks to be more centered with the brush preview
    this.cursor.style.left = Math.floor(this.offsetX + x + e.offsetX * this.canvasScale) + 1 + "px";
    this.cursor.style.top = Math.floor(this.offsetY + y + e.offsetY * this.canvasScale) + 1 + "px";

  }

  hideCursor() {
    this.cursor.style.visibility = "hidden";
  }

  showCursor() {
    this.cursor.style.visibility = "visible";
  }


}

export default CanvasCursor;
