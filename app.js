const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const hasPriorityAndStatus = reqQuery => {
  return reqQuery.priority !== undefined && reqQuery.status !== undefined
}
const hasPriority = reqQuery => {
  return reqQuery.priority !== undefined
}
const hasStatus = reqQuery => {
  return reqQuery.status !== undefined
}

app.get('/todos/', async (req, res) => {
  let getquery = ''
  let data = ''
  let {search_q = '', status, priority} = req.query
  switch (true) {
    case hasPriorityAndStatus(req.query):
      getquery = `    SELECT * FROM  todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`
      break
    case hasPriority(req.query):
      getquery = `SELECT * FROM    todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`
      break
    case hasStatus(req.query):
      getquery = `SELECT * FROM    todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`
      break
    default:
      getquery = `SELECT * FROM   todo WHERE todo LIKE '%${search_q}%';`
  }
  data = await db.all(getquery)
  res.send(data)
})

app.get('/todos/:todoId', async (req, res) => {
  let {todoId} = req.params
  let getquery = `SELECT * FROM todo WHERE id = ${todoId};
  `
  let data = await db.get(getquery)
  res.send(data)
})

app.post('/todos/', async (req, res) => {
  let {id, todo, priority, status} = req.params
  let getquery = `INSERT INTO todo (id,todo,priority,status) VALUES (${id},'${todo}','${priority}', '${status}');  `
 await db.run(getquery)
  res.send('Todo Successfully Added')
})

app.put('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params
  let update = ''
  let reqbody = req.body
  switch (true) {
    case reqbody.status !== undefined:
      update = 'Status'
      break
    case reqbody.priority !== undefined:
      update = 'Priority'
      break
    case reqbody.todo !== undefined:
      update = 'Todo'
      break
  }
  let previousquery = `SELECT * FROM todo WHERE id = ${todoId};`
  let result = await db.get(previousquery)
  const {
    todo = result.todo,
    status = result.status,
    priority = result.priority,
  } = req.body

  let getquery = `UPDATE todo SET todo= '${todo}' , status = '${status}' , priority = '${priority}' WHERE id = ${todoId};  `
  await db.run(getquery)
  res.send(`${update} Updated`)
})

app.delete('/todos/:todoId', async (req, res) => {
  const {todoId} = req.params
  let getquery = `DELETE FROM todo WHERE id = ${todoId};
  `
  await db.run(getquery)
  res.send('Todo Deleted')
})
module.exports = app
