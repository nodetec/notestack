import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { createCommand } from "lexical";
import React, { useEffect, useState } from "react";
import { $createProfileNode, ProfileNode } from "./NostrProfileNode";

// Create a command to insert a profile
export const INSERT_PROFILE_COMMAND = createCommand("insertProfile");

// Button component for the toolbar
export function InsertProfileButton() {
  const [editor] = useLexicalComposerContext();
  const [npubInput, setNpubInput] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleInsertProfile = () => {
    if (!npubInput.trim()) return;

    editor.dispatchCommand(INSERT_PROFILE_COMMAND, npubInput.trim());
    setNpubInput("");
    setShowInput(false);
  };

  return (
    <div className="insert-profile-container relative">
      <button
        className="toolbar-item"
        onClick={() => setShowInput(!showInput)}
        title="Insert Profile"
      >
        <span className="text">👤</span>
      </button>

      {showInput && (
        <div className="profile-input-container absolute z-10 bg-white p-2 border rounded shadow-md mt-1">
          <input
            type="text"
            value={npubInput}
            onChange={(e) => setNpubInput(e.target.value)}
            placeholder="Enter npub..."
            className="border rounded px-2 py-1 mr-2"
          />
          <button
            onClick={handleInsertProfile}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Insert
          </button>
        </div>
      )}
    </div>
  );
}

// Main plugin component
export default function ProfilePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register the custom node if not already registered
    if (!editor.hasNodes([ProfileNode])) {
      console.warn(
        "ProfilePlugin: ProfileNode not registered in editor config"
      );
    }

    // Register the command to insert a profile
    return mergeRegister(
      editor.registerCommand(
        INSERT_PROFILE_COMMAND,
        (npub: string) => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          const profileNode = $createProfileNode(npub);
          selection.insertNodes([profileNode]);

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  // This plugin doesn't render anything directly
  return null;
}

// You can also create a plugin for handling profile syntax like @npub if needed
export function ProfileMarkdownPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Pattern to match: npub1... (without the @ symbol)
    const PROFILE_REGEX = /(npub1[a-z0-9]{6,})/;

    const removeTextContentListener = editor.registerTextContentListener(
      (textContent) => {
        const match = textContent.match(PROFILE_REGEX);

        if (match) {
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            const text = selection.getTextContent();
            // const npub = match[1]; // The captured npub
            const matchIndex = text.indexOf(match[0]);

            if (matchIndex >= 0) {
              // Only transform if cursor is right after the match
              if (selection.anchor.offset === matchIndex + match[0].length) {
                const anchorNode = selection.anchor.getNode();

                // Ensure we're working with a TextNode
                if ($isTextNode(anchorNode)) {
                  const start = matchIndex;
                  const end = matchIndex + match[0].length;

                  // Set selection to cover the npub text
                  selection.setTextNodeRange(
                    anchorNode,
                    start,
                    anchorNode,
                    end
                  );

                  // Remove the selected text
                  selection.removeText();

                  // Insert the profile node
                  const profileNode = $createProfileNode(match[1]);
                  selection.insertNodes([profileNode]);
                }
              }
            }
          });
        }
      }
    );

    return removeTextContentListener;
  }, [editor]);

  return null;
}
