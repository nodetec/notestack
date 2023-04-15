import Popup from "./Popup";
import { useEffect, useState } from "react";
import Button from "./Button";
import { requestInvoice } from "lnurl-pay";
import Buttons from "@/app/Buttons";
import { LightningCharge } from "./icons";
import { Satoshis } from "lnurl-pay/dist/types/types";

const PRESET_AMOUNTS = [
  { value: 1000 as Satoshis, label: "1k" },
  { value: 5000 as Satoshis, label: "5k" },
  { value: 10000 as Satoshis, label: "10k" },
  { value: 25000 as Satoshis, label: "25k" },
];

export default function LightningTip({
  lud06,
  lud16,
  isTipOpen,
  setIsTipOpen,
}: any) {
  const defaultTipAmount = 1 as Satoshis;
  const [isTipSuccessOpen, setIsTipSuccessOpen] = useState(false);
  const [tipInputValue, setTipInputValue] =
    useState<Satoshis>(defaultTipAmount);
  const [tipMessage, setTipMessage] = useState<string>();
  const [paymentHash, setPaymentHash] = useState();
  const [tippedAmount, setTippedAmount] = useState<any>();

  useEffect(() => {
    setTipMessage("");
    setTipInputValue(defaultTipAmount);
  }, [isTipOpen]);

  const validateTipInputKeyDown = (e: any) => {
    if ((e.which != 8 && e.which != 0 && e.which < 48) || e.which > 57) {
      e.preventDefault();
    }
  };

  const handleSendTip = async (e: any) => {
    e.preventDefault();
    if (typeof window.webln !== "undefined") {
      const lnUrlOrAddress = lud06 || lud16;

      const { invoice /* , params, successAction, validatePreimage  */ } =
        await requestInvoice({
          lnUrlOrAddress,
          tokens: tipInputValue, // satoshis
          comment: tipMessage,
        });
      try {
        const result = await webln.sendPayment(invoice);
        // console.log("Tip Result:", result);
        setTippedAmount(tipInputValue);
        setPaymentHash(result.paymentHash);
      } catch (e) {
        console.log("Tip Error:", e);
      }
    }
    setIsTipOpen(!isTipOpen);
    setIsTipSuccessOpen(!isTipSuccessOpen);
  };

  return (
    <>
      <Popup
        title="Pay with Lightning"
        isOpen={isTipOpen}
        setIsOpen={setIsTipOpen}
      >
        <h2 className="pt-2 font-bold text-lg ">Amount</h2>
        <div className="flex items-center w-full py-2 px-4 rounded-md ring-1 ring-black-700">
          <input
            type="number"
            value={tipInputValue}
            onKeyDown={validateTipInputKeyDown}
            onChange={(e) => {
              const inputValue = e.target.value;
              const tipAmount = parseInt(inputValue) as Satoshis;
              setTipInputValue(tipAmount);
            }}
            placeholder="Enter amount in sats"
            required
            min={1}
            className="outline-none w-full flex-1 focus:ring-0 border-0 bg-transparent "
          />
          <span className="text-black-600 text-sm ml-2 font-bold">
            satoshis
          </span>
        </div>
        <Buttons>
          {PRESET_AMOUNTS.map((amount, idx) => (
            <Button
              key={idx}
              variant="outline"
              iconAfter
              className="w-full"
              icon={<LightningCharge size="14" />}
              onClick={() => setTipInputValue(amount.value)}
            >
              {amount.label}
            </Button>
          ))}
        </Buttons>
        <h2 className="pt-2 font-bold text-lg ">Message</h2>
        <div className="flex items-center w-full py-2 px-4 rounded-md   ring-1 ">
          <input
            type="text"
            value={tipMessage}
            onChange={(e) => setTipMessage(e.target.value)}
            placeholder="optional"
            className="outline-none w-full flex-1 focus:ring-0 border-0 bg-transparent "
          />
        </div>
        <Button
          variant="solid"
          onClick={handleSendTip}
          size="md"
          icon={<LightningCharge size="14" />}
          className="w-full"
        >
          Send
        </Button>
      </Popup>

      <Popup
        title="Success"
        isOpen={isTipSuccessOpen}
        setIsOpen={setIsTipSuccessOpen}
      >
        <h4 className="text-lg text-green-500 text-center pb-4">{`You sent ${tippedAmount} sat(s)!`}</h4>
        <h5 className="text overflow-x-scroll rounded-md text-center p-4">
          <div className="cursor-text flex justify-start whitespace-nowrap items-center">
            <div className="mr-2">{"Payment Hash:"}</div>
            <div className="pr-4">{paymentHash}</div>
          </div>
        </h5>
      </Popup>
    </>
  );
}
