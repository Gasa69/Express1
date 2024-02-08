/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.handlebars"],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'), require("daisyui")],
  daisyui: {
    /*themes: ["synthwave", "aqua"],*/
  }
}

