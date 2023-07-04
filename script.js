const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

mongoose.connect('mongodb://localhost:27017/array_db',
  { useNewUrlParser: true, useUnifiedTopology: true });

const NodeSchema = new mongoose.Schema({
  left: { type: mongoose.Schema.Types.ObjectId, ref: 'Node' },
  right: { type: mongoose.Schema.Types.ObjectId, ref: 'Node' },
  value: Number,
});

const ArraySchema = new mongoose.Schema({
  sessionID: String,
  root: { type: mongoose.Schema.Types.ObjectId, ref: 'Node' },
});

const Node = mongoose.model('Node', NodeSchema);
const ArrayModel = mongoose.model('ArrayModel', ArraySchema);

app.use(session({
  secret: 'some secret',
  cookie: { maxAge: 60000 },
  resave: false,
  saveUninitialized: false,
}));

async function buildTree(data, l, r) {
  if (l > r) return null;

  let node = new Node({ value: data[l] });
  if (l < r) {
    let mid = Math.floor((l + r) / 2);
    node.left = (await buildTree(data, l, mid))._id;
    node.right = (await buildTree(data, mid + 1, r))._id;
    node.value = node.left.value + node.right.value;
  }
  
  await node.save();
  return node;
}

app.post('/array', async (req, res) => {
  const sessionID = req.session.id;
  const data = req.body.values;
  const root = await buildTree(data, 0, data.length - 1);
  await new ArrayModel({ sessionID, root: root._id }).save();
  res.send('Array created successfully');
});

// Update the value at a given index.
async function update(node, left, right, index, newValue) {
  if (left === right) {
    node.value = newValue;
  } else {
    let mid = Math.floor((left + right) / 2);
    if (index <= mid) {
      await update(node.left, left, mid, index, newValue);
    } else {
      await update(node.right, mid + 1, right, index, newValue);
    }
    node.value = node.left.value + node.right.value;
  }
  await node.save();
}

// Calculate the sum of an array segment.
async function query(node, left, right, queryLeft, queryRight) {
  if (queryRight < left || right < queryLeft) {
    return 0;
  }
  if (queryLeft <= left && right <= queryRight) {
    return node.value;
  }
  let mid = Math.floor((left + right) / 2);
  return (await query(node.left, left, mid, queryLeft, queryRight)) +
         (await query(node.right, mid + 1, right, queryLeft, queryRight));
}

app.put('/array/:id', async (req, res) => {
  const sessionID = req.session.id;
  const id = req.params.id - 1;
  const arrayModel = await ArrayModel.findOne({ sessionID });
  if (!arrayModel) return res.status(404).send('Array not found');
  const n = arrayModel.root.value;
  let arrayNode = await Node.findById(arrayModel.root).exec();

  switch (req.body.action) {
    case '1': // "Update"
      const index = req.body.index - 1;
      const value = req.body.value;
      await update(arrayNode, 0, n - 1, index, value);
      break;

    case '2': // "Query"
      const left = req.body.left - 1;
      const right = req.body.right - 1;
      const sum = await query(arrayNode, 0, n - 1, left, right);
      res.send({ sum });
      return;

    case '3': // "Clone"
      const clonedRoot = new Node({ ...arrayNode.toObject() });
      await clonedRoot.save();
      await new ArrayModel({ sessionID, root: clonedRoot._id }).save();
      break;
      
    default:
      res.status(400).send('Invalid action');
      return;
  }

  await arrayModel.save();
  res.send('Done');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
