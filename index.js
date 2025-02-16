const restify = require("restify");
const mariadb = require("mariadb");
require("dotenv").config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "osu",
  connectionLimit: 5,
});

function respond(req, res, next) {
  res.send({ hello: req.params.name });
  next();
}

async function osuGetChatEntries(req, res) {
  const { username, keywords, offset = 0 } = req.query;

  let conn;
  try {
    conn = await pool.getConnection();
    const query = "SELECT * FROM chat";
    const rows = await conn.query(query);

    res.send(rows);
  } catch (err) {
    console.error(err);
    res.send(500, { error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
}

const server = restify.createServer();

server.use(restify.plugins.queryParser());

server.get("/hello/:name", respond);
server.head("/hello/:name", respond);
server.get("/api/osu/chat", osuGetChatEntries);

server.listen(8080, function () {
  console.log("%s listening at %s", server.name, server.url);
});
