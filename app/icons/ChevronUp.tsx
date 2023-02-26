import IconProps from "./IconProps";

const ChevronUp: React.FC<IconProps> = ({ size = "1rem", ...props }) => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    height={size}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="48"
      d="M112 328l144-144 144 144"
    />
  </svg>
);

export default ChevronUp;
