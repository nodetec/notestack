import { DetailedHTMLProps, InputHTMLAttributes, useId } from "react";

export interface PopupInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label?: string;
  error?: boolean;
  message?: string;
  value?: string;
  className?: string;
}

const PopupInput = ({
  label = "",
  error,
  message,
  placeholder = "",
  value = "",
  className = "",
  ...props
}: PopupInputProps) => {
  const id = useId();

  return (
    <div>
      {label ? (
        <label className="text-sm text-gray" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        type="text"
        id={id}
        className={`outline-none text-gray-hover focus:outline-none border-b mt-1 py-1 block w-full leading-normal 
                  ${error ? "border-error" : "border-light-gray"}
                  ${className}`}
        placeholder={placeholder}
        value={value}
        {...props}
      />
      {message ? (
        <div className="flex items-center gap-2 justify-between">
          <p className={`text-xs mt-1 ${error ? "text-error" : "text-gray"}`}>
            {message}
          </p>
          <span className="text-gray text-xs mt-1">
            {value.length} / {props.maxLength}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default PopupInput;
