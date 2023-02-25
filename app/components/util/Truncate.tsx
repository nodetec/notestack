"use client";
import Button, { Props as IButtonProps } from "../../Button";
import { Fragment } from "react";
import { shortenHash } from "@/app/lib/utils";
import useCopy from "@/app/hooks/useCopy";
import { ClipboardCheck, ClipboardCopy, ClipboardX } from "@/app/icons";

interface ITruncateProps extends IButtonProps {
  content: string;
  length?: number;
  iconOnly?: boolean;
}

const Truncate = ({
  content,
  length,
  iconOnly = false,
  ...props
}: ITruncateProps) => {
  const { isCopied, isError, copyToClipboard } = useCopy();

  const color = isCopied ? "text-green-400" : isError ? "text-red-400" : "";

  return (
    <Fragment>
      <span className={color}>
        {iconOnly
          ? null
          : isCopied
          ? "Copied!"
          : isError
          ? "Error"
          : shortenHash(content, length)}
      </span>
      <Button
        className={color}
        icon={
          isCopied ? (
            <ClipboardCheck />
          ) : isError ? (
            <ClipboardX />
          ) : (
            <ClipboardCopy />
          )
        }
        {...props}
        onClick={() => copyToClipboard(content)}
      />
    </Fragment>
  );
};

export default Truncate;
