export const NODE_TITLE_MAX_LENGTH = 30;
export const NODE_DESCRIPTION_MAX_LENGTH = 100;

export const normalizeNodeTitle = (value: string) =>
  value.slice(0, NODE_TITLE_MAX_LENGTH);
