import { FC, useContext, useEffect, useState } from "react";
import Button from "./Button";
import { NotifyContext } from "./context/notify-provider";
import useCopy from "./hooks/useCopy";
import Tooltip from "./Tooltip";
import { BiDotsHorizontalRounded } from "react-icons/bi";

interface AuthorTooltipProps {
  npub: string;
}

const AuthorTooltip: FC<AuthorTooltipProps> = ({ npub }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { copyToClipboard, isCopied, isError } = useCopy();
  const { setNotifyMessage } = useContext(NotifyContext);

  useEffect(() => {
    if (isCopied) {
      setNotifyMessage("Link copied");
    }
    if (isError) {
      setNotifyMessage("Error copying link");
    }
  }, [isCopied, isError, setNotifyMessage]);

  return (
    <Tooltip
      direction="bottom"
      show={showTooltip}
      toggle={() => setShowTooltip((current) => !current)}
      Component={
        <Button
          color="transparent"
          variant="ghost"
          size="sm"
          icon={<BiDotsHorizontalRounded size="24" />}
        />
      }
    >
      <div className="flex flex-col gap-3 w-max">
        <Button
          variant="ghost"
          color="transparent"
          size="xs"
          onClick={() => {
            copyToClipboard(npub);
            setShowTooltip(false);
          }}
        >
          Copy link to profile
        </Button>
        <Button
          color="transparent"
          variant="ghost"
          size="xs"
          onClick={() => {
            setNotifyMessage("click the ⚡ button under the user card");
            setShowTooltip(false);
          }}
        >
          Support this author
        </Button>
      </div>
    </Tooltip>
  );
};

export default AuthorTooltip;
