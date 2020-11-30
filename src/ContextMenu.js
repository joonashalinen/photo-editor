
import { useState } from "react";
import { Menu, Dropdown } from 'antd';


function ContextMenu(props) {

  var defaultOptions = ["Bring To Front", "Delete"];

  var [options, setOptions] = useState(defaultOptions);

  const menu = (
    <Menu onClick={props.onClick}>
      {
        options.map((option) => (
          <Menu.Item key={option}>{option}</Menu.Item>
        ))
      }
    </Menu>
  );

  return (
    <Dropdown onVisibleChange={(visible) => {
      props.onVisibleChange(visible, setOptions);
    }} overlay={menu} trigger={['contextMenu']}>
      { props.children }
    </Dropdown>
  )

}

export default ContextMenu;
