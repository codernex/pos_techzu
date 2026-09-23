export const getParam = (param: string | string[] | undefined, name = 'parameter'): string => {
  if (Array.isArray(param)) return param[0];
  if (!param) throw new Error(`Missing required parameter: ${name}`);
  return param;
};

