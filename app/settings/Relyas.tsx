"use client";
import { Fragment, useContext, useEffect, useState } from "react";
import { RelayContext } from "@/app/context/relay-provider";
import Button from "../Button";
import PopupInput from "../PopupInput";
import Popup from "../Popup";
import { RELAYS } from "../lib/constants";
import { BinX } from "../icons";

const Relays = () => {
  const { allRelays, addRelay, resetRelays, removeRelay } =
    useContext(RelayContext);
  const [isOpen, setIsOpen] = useState(false);
  const [noChanges, setNoChanges] = useState(true);
  const [newRelay, setNewRelay] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setNewRelay("");
    }
  }, [isOpen]);

  useEffect(() => {
    setNoChanges(
      allRelays.every((relay) => RELAYS.includes(relay)) &&
        RELAYS.every((relay) => allRelays.includes(relay))
    );
  }, [allRelays]);

  return (
    <Fragment>
      <ul className="flex flex-col gap-2">
        {allRelays.map((relay, idx) => (
          <li className="flex items-center gap-4 justify-between" key={idx}>
            <p>{relay}</p>
            <div className="flex">
              <Button
                icon={
                  <BinX
                    className="fill-gray group-hover:fill-red-hover"
                    size={16}
                  />
                }
                color="transparent"
                className="group"
                variant="ghost"
                onClick={() => removeRelay(relay)}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 justify-end items-center mt-4">
        {noChanges ? null : (
          <Button
            color="green"
            size="sm"
            variant="outline"
            onClick={resetRelays}
          >
            Reset
          </Button>
        )}
        <Button color="green" size="sm" onClick={() => setIsOpen(true)}>
          Add Relay
        </Button>
      </div>
      <Popup title="Add new relay" isOpen={isOpen} setIsOpen={setIsOpen}>
        <PopupInput
          label="Relay URL"
          placeholder="wss://"
          value={newRelay}
          onChange={(e) => setNewRelay(e.target.value)}
        />
        <Button
          disabled={!newRelay}
          className="ml-auto"
          color="green"
          size="sm"
          onClick={() => {
            addRelay(newRelay);
            setIsOpen(false);
          }}
        >
          Save
        </Button>
      </Popup>
    </Fragment>
  );
};

export default Relays;
