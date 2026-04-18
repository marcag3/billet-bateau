module.exports = [
    {
        path: "/sanctum/csrf-cookie",
        rule: { target: "http://localhost" },
    },
    {
        path: "/user-api",
        rule: { target: "http://localhost" },
    },
];
