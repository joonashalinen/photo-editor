import React from "react";
import { Slider, Switch } from 'antd';

function EffectSlider({ min, max, defaultValue, title, onChange }) {
  return (
    <>
      <h5>{title}</h5>
      <Slider min={min} max={max} onChange={onChange} defaultValue={defaultValue} />
    </>
  );
}

export default EffectSlider;
