require('dotenv').config()
const app = require("express")();

app.get("/", (_, res) => {
  res.send("OK").status(200);
});

app.listen(process.env.PORT, () => {
  console.info(`Server ready at port: ${process.env.PORT}`);
});