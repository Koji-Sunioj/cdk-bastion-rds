const { getSecret } = require("./utils/ssm.js");
const { Pool } = require("pg");

exports.handler = async function (event, context) {
  const { httpMethod, resource, pathParameters, body, queryStringParameters } =
    event;
  const routeKey = `${httpMethod} ${resource}`;
  let statusCode = 200;
  let returnObject = {};
  let query, command, postId, title, content, user_name;
  const { username, host, password, dbname, port } = await getSecret(
    process.env.DB_SECRET
  );

  const dbbParams = {
    user: username,
    host: host,
    database: dbname,
    password: password,
    port: Number(port),
  };

  const pool = new Pool(dbbParams);

  try {
    switch (routeKey) {
      case "GET /posts":
        command =
          "SELECT posts.post_id, posts.title,posts.content,posts.user_name, posts.created,\
          array_agg(row_to_json(comments)) AS comments from posts JOIN\
          comments ON comments.post_id = posts.post_id GROUP BY posts.post_id order by posts.created asc";
        query = await pool.query(command);
        returnObject = { posts: query.rows };
        break;
      case "POST /posts":
        ({ title, content, user_name } = JSON.parse(body));
        command =
          "INSERT INTO posts(title,content,user_name) VALUES($1,$2,$3) RETURNING *;";
        query = await pool.query(command, [title, content, user_name]);
        returnObject = { post: query.rows[0], message: "successfully created" };
        break;
      case "GET /posts/{postId}":
        ({ postId } = pathParameters);
        command = `SELECT posts.post_id, posts.title, posts.content, posts.user_name, posts.created,\
        array_agg(row_to_json(comments)) AS comments from posts  JOIN comments ON comments.post_id = \
        ${postId} where posts.post_id = 1 GROUP BY posts.post_id;`;
        query = await pool.query(command);
        returnObject = { post: query.rows[0] };
        break;
      case "DELETE /posts/{postId}":
        ({ postId } = pathParameters);
        command = `delete from posts where post_id=${postId};`;
        await pool.query(command);
        returnObject = {
          message: `successfully deleted post number ${postId}`,
        };
        break;
      case "PATCH /posts/{postId}":
        ({ postId } = pathParameters);
        ({ title, content } = JSON.parse(body));
        command =
          "UPDATE posts set title=$1,content=$2 where post_id=$3 RETURNING *;";
        query = await pool.query(command, [title, content, postId]);
        returnObject = {
          post: query.rows[0],
          message: `successfully updated post number ${postId}`,
        };
        break;
      default:
        statusCode = 404;
    }
  } catch (e) {
    statusCode = 400;
    returnObject = { message: e.message };
  }

  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnObject),
  };
};
