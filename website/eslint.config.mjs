import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/**", ".astro/**", "generated/**"]
    },
    {
        files: ["**/*.ts", "**/*.mts", "**/*.mjs", "**/*.js"],
        extends: [...tseslint.configs.recommended]
    }
);
