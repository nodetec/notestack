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
    extend: {
      colors: {
        red: "rgb(247, 0, 0)",
        "red-hover": "rgb(210, 19, 7)",
        gray: "rgb(117, 117, 117)",
        "gray-hover": "rgb(41, 41, 41)",
        "light-gray": "rgb(225, 225, 225)",
      },
      gridTemplateColumns: {
        "content-porfile": "2fr 1fr",
      },
      boxShadow: {
        "profile-menu": "rgb(230, 230, 230) 0px 1px 4px",
      },
    },
  },
  plugins: [],
};
