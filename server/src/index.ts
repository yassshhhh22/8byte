import app from "./app.js";

const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Portfolio API listening on http://localhost:${port}`);
  });
}

export default app;

