import express from "express";

const PORT = 3000;

const app = express();

app.get("/", (req, res) => {
    res.json({
        ok: "ok",
        path: req.path
    });
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});

