import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { useAppState } from "~/store";
import { type EditorState, type LexicalEditor } from "lexical";

import AutoLinkPlugin from "../lexical/autolink/AutoLinkPlugin";
import { MarkdownCodeBlockShortcutPlugin } from "../lexical/codeblock/MarkdownCodeBlockShortcutPlugin";
import { ImageNode } from "../lexical/markdownImage/ImageNode";
import ImagePastePlugin from "../lexical/markdownImage/ImagePastePlugin";
import IMAGE_TRANSFORMER from "../lexical/markdownImage/ImageTransformer";
import { MarkdownImageShortcutPlugin } from "../lexical/markdownImage/MarkdownImageShortcut";
import { ProfileNode } from "../lexical/nostrProfile/NostrProfileNode";
import { ProfilePastePlugin } from "../lexical/nostrProfile/ProfilePastePlugin";
import ProfilePlugin, {
  ProfileMarkdownPlugin,
} from "../lexical/nostrProfile/ProfilePlugin";
import { PROFILE_TRANSFORMER } from "../lexical/nostrProfile/ProfileTransformer";
import { OnBlurPlugin } from "../lexical/onBlur/OnBlurPlugin";
import { OnChangeDebouncePlugin } from "../lexical/onChangeDebounce/OnChangeDebouncePlugin";
import { ScrollCenterCurrentLinePlugin } from "../lexical/scrollCenterCurrentLine/ScrollCenterCurrentLinePlugin";
import TabKeyPlugin from "../lexical/tabKey/TabKeyPlugin";
import { defaultTheme } from "../lexical/themes/defaultTheme";
import { ToolbarPlugin } from "../lexical/toolbar/ToolbarPlugin";
import { TweetNode } from "../lexical/tweet/TwitterNode";
import { TWITTER_TRANSFORMER } from "../lexical/tweet/TwitterTransformer";
import { YouTubeNode } from "../lexical/youtube/YouTubeNode";
import { YOUTUBE_TRANSFORMER } from "../lexical/youtube/YouTubeTransformer";

export const Editor = () => {
  const markdown = useAppState.getState().markdown;
  const setMarkdown = useAppState.getState().setMarkdown;

  const COMBINED_TRANSFORMERS = [
    IMAGE_TRANSFORMER,
    TWITTER_TRANSFORMER,
    YOUTUBE_TRANSFORMER,
    PROFILE_TRANSFORMER,
    ...TRANSFORMERS,
  ];

  function getInitalContent() {
    return $convertFromMarkdownString(
      markdown,
      COMBINED_TRANSFORMERS,
      undefined,
      true,
    );
  }

  const initialConfig = {
    namespace: "Editor",
    editorState: () => getInitalContent(),
    theme: defaultTheme,
    onError: () => {},
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      CodeHighlightNode,
      CodeNode,
      HorizontalRuleNode,
      QuoteNode,
      ImageNode,
      LinkNode,
      AutoLinkNode,
      HashtagNode,
      CodeNode,
      CodeHighlightNode,
      TweetNode,
      YouTubeNode,
      ProfileNode,
    ],
  };

  async function onChange(editorState: EditorState, editor: LexicalEditor) {
    await editor.read(async () => {
      const markdown = $convertToMarkdownString(COMBINED_TRANSFORMERS);
      setMarkdown(markdown);
      console.log("onChange", markdown);
    });
  }

  async function onBlur(event: FocusEvent, editor: LexicalEditor) {
    await editor.read(async () => {
      const markdown = $convertToMarkdownString(COMBINED_TRANSFORMERS);
      setMarkdown(markdown);
      console.log("onBlur", markdown);
    });
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="sticky top-0 z-10 mt-1 flex w-full justify-center border-b bg-secondary pb-1">
        <ToolbarPlugin />
      </div>
      <div className="editor-shell relative flex cursor-text justify-center">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[calc(100vh-4rem)] max-w-2xl flex-auto select-text flex-col py-8 pb-[20%] font-sourceserif text-[19px] leading-8 focus-visible:outline-none" />
          }
          placeholder={
            <div className="pointer-events-none absolute inset-0 mx-auto max-w-2xl py-8 font-sourceserif text-[19px] leading-8 text-muted-foreground">
              Write something...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <OnChangeDebouncePlugin onChange={onChange} debounceTime={500} />
      <OnBlurPlugin onBlur={onBlur} />
      <MarkdownImageShortcutPlugin />
      <ImagePastePlugin />
      <TabKeyPlugin tabSize={2} useSpaces={true} />
      <MarkdownShortcutPlugin transformers={COMBINED_TRANSFORMERS} />
      <AutoFocusPlugin />
      <ListPlugin />
      <HistoryPlugin />
      <ScrollCenterCurrentLinePlugin />
      <LinkPlugin />
      <ClickableLinkPlugin />
      <AutoLinkPlugin />
      <ProfilePlugin />
      <ProfilePastePlugin />
      <ProfileMarkdownPlugin />
      <MarkdownCodeBlockShortcutPlugin />
    </LexicalComposer>
  );
};
