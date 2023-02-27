import { CSSProperties, useState } from "react";

const useHover = (
  styleOnHover: CSSProperties,
  styleOnNotHover: CSSProperties = {}
) => {
  const [style, setStyle] = useState(styleOnNotHover);

  const onMouseEnter = () => setStyle(styleOnHover);
  const onMouseLeave = () => setStyle(styleOnNotHover);

  return { style, onMouseEnter, onMouseLeave };
};

export default useHover;
