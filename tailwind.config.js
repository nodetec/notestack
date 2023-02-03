/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Note the addition of the `app` directory.
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      main: ["var(--main-font)", "sans-serif"],
    },
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        red: "rgb(247, 0, 0)",
        "red-hover": "rgb(210, 19, 7)",
        green: "rgb(26, 137, 23)",
        "green-hover": "rgb(15, 115, 12)",
        gray: "rgb(117, 117, 117)",
        "gray-hover": "rgb(41, 41, 41)",
        "light-gray": "rgb(225, 225, 225)",
        "medium-gray": "rgb(168, 168, 168)",
      },
      gridTemplateColumns: {
        "content-porfile": "5fr 2fr",
      },
      boxShadow: {
        "profile-menu": "rgb(230, 230, 230) 0px 1px 4px",
      },
      maxHeight: {
        192: "48rem",
      },
      clipPath: {
        "clip-path": "rect(0px, 18px, 14px, -4px)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
