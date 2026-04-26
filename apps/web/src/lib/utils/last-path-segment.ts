export const lastPathSegment = (cwd: string): string => {
  if (!cwd) return "";
  const trimmed = cwd.replace(/\/+$/, "");
  const segment = trimmed.split("/").pop();
  return segment || trimmed || "/";
};
