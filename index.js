const restify = require("restify");
const mariadb = require("mariadb");
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  connectionLimit: 5,
});
require("dotenv").config();

function respond(req, res, next) {
  res.send({ hello: req.params.name });
  next();
}

// https://osu.ppy.sh/oauth/authorize?scope=identify&response_type=code&client_id=38016&redirect_uri=http://localhost:8080/api/osu/verify
async function osuCodeToAuthentication(req, res) {
  const { code } = req.query;

  if (code === "" || typeof code !== "string") {
    res.send(422, { error: "Code was not found." });
  }

  // TODO: Implement code to auth token.
  return res.send({ codeFound: req.query.code });
}

async function osuGetChatEntries(req, res) {
  const { username, keywords, offset } = req.query;

  pool
    .getConnection()
    .then((conn) => {
      return conn
        .query("SELECT * FROM chat")
        .then((rows) => {
          res.send({
            messages: rows,
          });
        })
        .catch((err) => {
          console.error(err);
          res.send(500, {
            error: "An error occurred while fetching chat entries.",
          });
        })
        .finally(() => {
          if (conn) {
            conn.release();
          }
        });
    })
    .catch((err) => {
      console.error(err);
      res.send(500, { error: "Could not connect to the database." });
    });
}

const server = restify.createServer();

server.use(restify.plugins.queryParser());

server.get("/hello/:name", respond);
server.head("/hello/:name", respond);
server.get("/api/osu/verify", osuCodeToAuthentication);
server.get("/api/osu/chat", osuGetChatEntries);

server.listen(8080, function () {
  console.log("%s listening at %s", server.name, server.url);
});
