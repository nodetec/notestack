export function removeTitle(markdown: string) {
	return markdown.replace(/^# .*\n/, "");
}
