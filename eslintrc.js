/** @type {import("eslint").linter.config} */
module.exports = {
  extends: [require.resolve("eslint-config-mkw/base")],
  globals: {
    react: true,
    jsx: true,
  },
};
