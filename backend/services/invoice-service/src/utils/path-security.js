import path from "path";

const isPathInsideDirectory = (filePath, directory) => {
  const resolvedFile = path.resolve(filePath);
  const resolvedDirectory = path.resolve(directory);
  const relative = path.relative(resolvedDirectory, resolvedFile);

  return (
    relative !== "" &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
};

export { isPathInsideDirectory };