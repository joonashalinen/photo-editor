
import * as PIXI from 'pixi.js';
import * as PixiFilters from "pixi-filters";

class PixiLib {

  static appFromImage(image) {
    var app = new PIXI.Application({
        width: image.width,
        height: image.height
    });

    var container = new PIXI.Container();
    app.stage.addChild(container);

    var texture = PIXI.Texture.from(image);
    var sprite = new PIXI.Sprite(texture);

    container.addChild(sprite);

    return app;
  }

  static canvasFromApp(app) {
    return app.renderer.extract.canvas(app.stage);
  }

  static imageFromApp(app) {
    return app.renderer.extract.image(app.stage);
  }

  static setImageFilters(app, filters) {

  }

  static setImageFilter(app, filterName, values) {

    filterName = filterName.toLowerCase();
    if (filterName === "none") return;

    var colorMatrixFilters = {
      "black & white": "blackAndWhite",
      "greyscale": "greyscale",
      "browni": "browni",
      "kodachrome": "kodachrome",
      "technicolor": "technicolor",
      "negative": "negative",
      "polaroid": "polaroid",
      "sepia": "sepia",
      "vintage": "vintage"
    }

    var generalFilters = {
      "tilt/shift": "TiltShiftFilter"
    }

    var generalCoreFilters = {
      "blur": "BlurFilter"
    }

    var adjustmentFilters = {
      "gamma": "gamma",
      "contrast": "contrast",
      "saturation": "saturation",
      "brightness": "brightness"
    }

    if (colorMatrixFilters[filterName]) {
      var filterFunctionName = colorMatrixFilters[filterName];
      var type = "colorMatrix";
    }

    if (generalFilters[filterName]) {
      var filterFunctionName = generalFilters[filterName];
      var type = "general";
    }

    if (generalCoreFilters[filterName]) {
      var filterFunctionName = generalCoreFilters[filterName];
      var type = "generalCore";
    }

    if (adjustmentFilters[filterName]) {
      var filterFunctionName = adjustmentFilters[filterName];
      var type = "adjustment";
    }

    if (!filterFunctionName) return;

    this.addFilter(app, filterFunctionName, values, type);

  }

  static addFilter(app, filterName, values, type) {

    function handleFilter(filterName, type, container) {

      if (type === "colorMatrix") {
        var colorMatrix = new PIXI.filters.ColorMatrixFilter(...values);
        container.filters = [colorMatrix];
        colorMatrix[filterName](true);
        return;
      }

      if (type === "general") {
        var filter = new PixiFilters[filterName](...values);
        container.filters = [filter];
        return;
      }

      if (type === "generalCore") {
        var filter = new PIXI.filters[filterName](...values);
        container.filters = [filter];
        return;
      }

      if (type === "adjustment") {
        var options = {};
        options[filterName] = values[0];
        var filter = new PixiFilters.AdjustmentFilter(options);
        container.filters = [filter];
      }

    }

    if (!values) {
      values = [];
    }

    if (!Array.isArray(values)) {
      values = [values];
    }

    var container = app.stage.children[0];

    handleFilter(filterName, type, container);

  }

}

export default PixiLib;
