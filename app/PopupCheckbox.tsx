import { DetailedHTMLProps, InputHTMLAttributes, useId } from "react";

interface PopupCheckboxProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string;
  error?: string;
  value?: string;
  className?: string;
}

const PopupCheckbox = ({
  label,
  error,
  placeholder = "",
  value = "",
  className = "",
  ...props
}: PopupCheckboxProps) => {
  const id = useId();

  return (
    <div className="form-check">
      <input
        className="form-check-input appearance-none h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
        type="checkbox"
        value={value}
        id={id}
        {...props}
      />
      <label
        className="form-check-label inline-block text-gray-800"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
};

export default PopupCheckbox;
