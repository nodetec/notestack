import { DetailedHTMLProps, InputHTMLAttributes, useId } from "react";

interface PopupInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string;
  error?: string;
  value?: string;
  className?: string;
}

const PopupInput = ({
  label,
  error,
  placeholder = "",
  value = "",
  className = "",
  ...props
}: PopupInputProps) => {
  const id = useId();

  return (
    <div>
      <label className="text-sm text-gray" htmlFor={id}>
        {label}
      </label>
      {error && <p className="text-red-400 pl-3 text-sm mt-1">{error}</p>}
      {error ? null : (
        <input
          type="text"
          id={id}
          className={`outline-none text-gray-hover focus:outline-none border-b border-b-gray mt-1 py-2 block w-full leading-normal ${className}`}
          placeholder={placeholder}
          value={value}
          {...props}
        />
      )}
    </div>
  );
};

export default PopupInput;
