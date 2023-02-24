"use client";
import { FC, SVGProps, useEffect, useState } from "react";

interface AnimatedLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const AnimatedLogo: FC<AnimatedLogoProps> = ({ size = 24 }) => {
  const [showPathIndex, setShowPathIndex] = useState(0);
  const PATH_COUNT = 3;
  const SPEED = 300;

  useEffect(() => {
    const signalEffect = () => {
      setShowPathIndex((current) =>
        current < PATH_COUNT - 1 ? current + 1 : 0
      );
    };

    const interval = setInterval(signalEffect, SPEED);

    return () => clearInterval(interval);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28.125 48.9452C28.125 46.035 30.7812 43.7303 33.6328 44.2968C48.3789 47.2264 59.0039 61.7382 55.6055 77.9296C53.3789 88.535 44.8047 97.1288 34.1797 99.3554C16.0352 103.164 0 89.3553 0 71.8749V23.4374C0 20.8397 2.08984 18.7499 4.6875 18.7499H14.0625C16.6602 18.7499 18.75 20.8397 18.75 23.4374V71.8749C18.75 77.0507 22.9492 81.2499 28.125 81.2499C33.3008 81.2499 37.5 77.0507 37.5 71.8749C37.5 67.8514 34.9414 64.4139 31.3867 63.0858C29.5117 62.3827 28.125 60.7811 28.125 58.7889V48.9452Z"
        fill="black"
      />
      <path
        className={showPathIndex >= 1 ? "block" : "hidden"}
        d="M40.8789 18.7499C39.0625 18.6132 37.5 20.0585 37.5 21.8945V28.164C37.5 29.8046 38.7695 31.1523 40.3906 31.2695C55.3906 32.4999 67.3438 44.5898 68.6914 59.6288C68.8477 61.2499 70.1758 62.4999 71.7969 62.4999H78.0859C79.9023 62.4999 81.3672 60.9374 81.2305 59.121C79.5898 37.6171 62.3828 20.4101 40.8789 18.7499Z"
        fill="black"
      />
      <path
        className={showPathIndex >= 2 ? "block" : "hidden"}
        d="M37.5 3.12485C37.5 1.32798 39.0234 -0.0978054 40.8203 -0.000149152C72.6953 1.67954 98.3203 27.3045 99.9805 59.1795C100.078 60.9764 98.6523 62.4999 96.8555 62.4999H90.5859C88.9453 62.4999 87.5781 61.2108 87.4805 59.5702C86.0156 34.2772 65.7031 13.7694 40.4297 12.4022C38.7891 12.3241 37.5 10.9569 37.5 9.29673V3.12485Z"
        fill="black"
      />
    </svg>
  );
};

export default AnimatedLogo;
