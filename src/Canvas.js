
import "./Canvas.css";

export default ({ id, containerId, style }) => {

  return (
    <div id={containerId} className="canvasContainer" style={style}>
      <canvas id={ id } width="100px" height="100px" className="canvas"></canvas>
    </div>
  )

}
