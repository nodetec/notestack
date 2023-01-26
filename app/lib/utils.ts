export const shortenHash = (hash: string, length = 4 as number) => {
  if (hash) {
    return (
      hash.substring(0, length) + "..." + hash.substring(hash.length - length)
    );
  }
};

export const getTagValues = (name: string, tags: string[][]) => {
  const [itemTag] = tags.filter((tag: string[]) => tag[0] === name);
  const [, item] = itemTag || [, undefined];
  return item;
};
