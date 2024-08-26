import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type Props = {
  children: React.ReactNode;
};

export function ZapDialog({ children }: Props) {
  // create state to hold the amount of satoshis to send
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  // create function to set the amount of satoshis to send
  function setAmountToTip(amount: number) {
    setAmount(amount);
  }

  function handleSubmit() {
    console.log("submitting");
    setOpen(false);
    setAmount(0);
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[425px] rounded-lg">
        <DialogHeader>
          <DialogTitle>Send a Tip</DialogTitle>
          {/* <DialogDescription> */}
          {/*   Make changes to your profile here. Click save when you're done. */}
          {/* </DialogDescription> */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="amount">Amount</Label>
            <Input
              type="number"
              id="amount"
              placeholder="Enter amount in satoshis"
              className="col-span-3"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setAmountToTip(1000)}
              variant="secondary"
              className="w-full"
            >
              1k ⚡
            </Button>
            <Button
              onClick={() => setAmountToTip(5000)}
              variant="secondary"
              className="w-full"
            >
              5k ⚡
            </Button>
            <Button
              onClick={() => setAmountToTip(10000)}
              variant="secondary"
              className="w-full"
            >
              10k ⚡
            </Button>
            <Button
              onClick={() => setAmountToTip(25000)}
              variant="secondary"
              className="w-full"
            >
              25k ⚡
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              placeholder="Optional"
              className="col-span-3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            className="bg-foreground/90 hover:bg-foreground/80"
            type="submit"
          >
            Send Satoshis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
