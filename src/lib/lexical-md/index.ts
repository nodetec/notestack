import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  type ElementNode,
  type TextNode,
} from "lexical";

export function $convertFromMarkdown(markdown: string) {
  // console.log(markdown);
  const root = $getRoot();
  console.log("THE ROOT FROM MARKDOWN", root);

  const elementNode = $createParagraphNode();

  const textNode = $createTextNode("Hello, World!");
  console.log("THE TEXT NODE", textNode);

  elementNode.append(textNode);

  root.append(elementNode);


  // return root;
}
