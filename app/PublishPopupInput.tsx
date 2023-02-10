import { DetailedHTMLProps, InputHTMLAttributes, useId } from "react";

interface PublishPopupInputProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  label: string;
  error?: string;
  value?: string;
  className?: string;
}

const PublishPopupInput = ({
  label,
  error,
  placeholder = "",
  value = "",
  className = "",
  ...props
}: PublishPopupInputProps) => {
  const id = useId();

  return (
    <div className={`${className}`}>
      <label className="text-sm font-bold pt-[.15rem]" htmlFor={id}>
        {label}
      </label>
      {error && <p className="text-red-400 pl-3 text-sm mt-1">{error}</p>}
      {error ? null : (
        <input
          type="text"
          id={id}
          className={`outline-none focus:outline-none border-zinc-300 border border-t-0 border-x-0 mt-1 py-2 block w-full leading-normal`}
          placeholder={placeholder}
          value={value}
          {...props}
        />
      )}
    </div>
  );
};

export default PublishPopupInput;
