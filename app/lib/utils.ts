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

export const uniqBy = <T>(arr: T[], key: keyof T): T[] => {
  return Object.values(
    // @ts-ignore
    arr.reduce(
      (map, item) => ({
        ...map,
        [`${item[key]}`]: item,
      }),
      {}
    )
  );
};

export const uniqValues = (value: string, index: number, self: string[]) => {
  return self.indexOf(value) === index;
};

export const dateToUnix = (_date?: Date) => {
  const date = _date || new Date();

  return Math.floor(date.getTime() / 1000);
};

export const markdownImageContent = (content: string) =>
  /!\[[^\]]*\]\((?<filename>.*?)(?=\"|\))(?<title>\".*\")?\)/g.exec(content);

export const calculateEstimatedReadingTime = (text: string) => {
  const wpm = 225;
  const words = text.trim().split(/\s+/).length;
  const estimatedReadingTime = Math.ceil(words / wpm);
  return estimatedReadingTime;
};

export const getRelativeTime = (timestamp: number) => {
  const currentTimeInSeconds = Math.floor(new Date().getTime() / 1000);
  const oldTimestamp = new Date(timestamp).getTime();

  const difference = currentTimeInSeconds - oldTimestamp;

  let output;
  if (difference < 60) {
    output = `${difference} seconds ago`;
  } else if (difference < 3600) {
    output = `${Math.floor(difference / 60)} minutes ago`;
  } else if (difference < 86400) {
    output = `${Math.floor(difference / 3600)} hours ago`;
  } else if (difference < 2620800) {
    output = `${Math.floor(difference / 86400)} days ago`;
  } else if (difference < 31449600) {
    output = `${Math.floor(difference / 2620800)} months ago`;
  } else {
    output = `${Math.floor(difference / 31449600)} years ago`;
  }
  return output;
};
