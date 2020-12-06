import React, { useState } from "react";
import { Slider, Switch, InputNumber } from 'antd';

function EffectSlider({ min, max, value, disabled, defaultValue, title, onAfterChange, positioning, sliderWidth, showInput, updateState, name }) {

  console.log(value)

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
            <InputNumber disabled={disabled} min={min} max={max} value={value} defaultValue={defaultValue} size="small" onChange={(newValue) => {
              if (isNaN(newValue)) return;
              newValue = Math.min(max, newValue);
              newValue = Math.max(min, newValue);
              updateState(name, newValue);
              onAfterChange(newValue);
            }}/>
          :
          null
        }

      </div>
      <div style={positioning === "horizontal" ? {width: sliderWidth + "px", marginLeft: "10px"} : {width: "100%"}}>
        <Slider disabled={disabled} min={min} max={max} onChange={(newValue) => {
          updateState(name, newValue);
        }} onAfterChange={(newValue) => {
          if (isNaN(newValue)) return;
          newValue = Math.min(max, newValue);
          newValue = Math.max(min, newValue);
          updateState(name, newValue);
          onAfterChange(newValue);
        }} value={value} defaultValue={defaultValue} />
      </div>
    </div>
  );
}

export default EffectSlider;
