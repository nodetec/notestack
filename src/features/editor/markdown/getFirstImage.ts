export function getFirstImage(markdown: string) {
  const regex = /!\[.*\]\((.*)\)/;
  const match = regex.exec(markdown);

  if (match) {
    // console.log(match);
    // console.log("match[1]",match[1]);
    return match[1];
  }

  return undefined;
}
