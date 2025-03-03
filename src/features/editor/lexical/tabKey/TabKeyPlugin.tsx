import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";

/**
 * Captures tab key presses and inserts tab characters or spaces instead of tabbing out of the editor
 * @param {Object} props
 * @param {number} [props.tabSize=2] - Number of spaces to insert for each tab (if useSpaces is true)
 * @param {boolean} [props.useSpaces=true] - Whether to use spaces instead of actual tab characters
 */
const TabKeyPlugin = ({ tabSize = 2, useSpaces = true }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Function to handle the tab key press
    const handleTabKey = (event: KeyboardEvent) => {
      // Only handle if it's the tab key and not combined with modifiers
      if (
        event.key === "Tab" &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();

        editor.update(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            // Handle indentation of multiple lines or selections later if needed
            return;
          }

          // Insert either a tab character or spaces
          if (useSpaces) {
            const spaces = " ".repeat(tabSize);
            selection.insertText(spaces);
          } else {
            // Insert a real tab character
            selection.insertText("\t");
          }
        });
      }
    };

    // Get the editor DOM element to add the event listener
    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener("keydown", handleTabKey);
    }

    // Clean up the event listener when the component unmounts
    return () => {
      if (editorElement) {
        editorElement.removeEventListener("keydown", handleTabKey);
      }
    };
  }, [editor, tabSize, useSpaces]);

  // This component doesn't render anything visible
  return null;
};

export default TabKeyPlugin;
