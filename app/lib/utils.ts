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
      {},
    ),
  )
}

export const uniqValues = (value: string, index: number, self: string[]) => {
  return self.indexOf(value) === index
}

export const dateToUnix = (_date?: Date) => {
  const date = _date || new Date()

  return Math.floor(date.getTime() / 1000)
}
