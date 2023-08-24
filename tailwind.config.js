/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {
            colors: {
                "honeybadger-purple": "#c683f6",
                "honeybadger-orange": "#f33a3e",
                "honeybadger-black": "#0b0a0b",
            },
            backgroundImage: {
                honeybadger: "url('/images/honeybadger-fire.webp')",
            },
            fontFamily: {
                contrail: ["Contrail One"],
            },
        },
    },
    plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
