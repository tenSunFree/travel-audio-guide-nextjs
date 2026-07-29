export function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

export function stringifyTags(tags: string[]) {
  return tags.join(", ");
}
