import React from "react";
import { Slider, Switch } from 'antd';

function EffectSlider({ min, max, defaultValue, title, onChange, positioning, sliderWidth }) {

  var titleWidth = title.length * "10";

  return (
    <div style={
      {
        display: positioning === "horizontal" ? "flex" : "block",
        flexFlow: positioning === "horizontal" ? "row nowrap" : "column nowrap",
        width: "100%",
        alignItems: "center"
      }
    }>
      <h5>{title}</h5>
      <div style={positioning === "horizontal" ? {width: sliderWidth + "px", marginLeft: "10px"} : {width: "100%"}}>
        <Slider min={min} max={max} onChange={onChange} defaultValue={defaultValue} />
      </div>
    </div>
  );
}

export default EffectSlider;
