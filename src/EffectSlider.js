import React, { useState } from "react";
import { Slider, Switch, InputNumber } from 'antd';

function EffectSlider({ min, max, defaultValue, title, onChange, positioning, sliderWidth, showInput }) {

  var [value, setValue] = useState(defaultValue);

  return (
    <div style={
      {
        display: positioning === "horizontal" ? "flex" : "block",
        flexFlow: positioning === "horizontal" ? "row nowrap" : "column nowrap",
        width: "100%",
        alignItems: "center"
      }
    }>
      <div style={{display: "flex", justifyContent: "space-between"}}>
        <h5>{title}</h5>
        {
          showInput && positioning !== "horizontal" ?
            <InputNumber min={min} max={max} value={value} defaultValue={defaultValue} size="small" onChange={(newValue) => {
              if (isNaN(newValue)) return;
              newValue = Math.min(max, newValue);
              newValue = Math.max(min, newValue);
              setValue(newValue);
              onChange(newValue);
            }} />
          :
          null
        }

      </div>
      <div style={positioning === "horizontal" ? {width: sliderWidth + "px", marginLeft: "10px"} : {width: "100%"}}>
        <Slider min={min} max={max} onChange={(newValue) => {
          if (isNaN(newValue)) return;
          newValue = Math.min(max, newValue);
          newValue = Math.max(min, newValue);
          setValue(newValue);
          onChange(newValue);
        }} value={value} defaultValue={defaultValue} />
      </div>
    </div>
  );
}

export default EffectSlider;
