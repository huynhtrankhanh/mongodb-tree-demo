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

// Update node value and create new nodes along the way to keep previous state intact
async function update(node, left, right, index, newValue) {
  let value = 0;
  let leftId = node.left;
  let rightId = node.right;
  
  if (left == right) {
    value = newValue;
  } else {
    let mid = Math.floor((left + right) / 2);

    if (index <= mid) {
      const leftNode = await Node.findById(leftId, (err, doc) => doc);
      leftId = (await update(leftNode, left, mid, index, newValue))._id;
    } else {
      const rightNode = await Node.findById(rightId, (err, doc) => doc);
      rightId = (await update(rightNode, mid + 1, right, index, newValue))._id;
    }

    const leftNode = await Node.findById(leftId, (err, doc) => doc);
    const rightNode = await Node.findById(rightId, (err, doc) => doc);

    value = leftNode.value + rightNode.value;
  }

  let updatedNode = new Node({ left: leftId, right: rightId, value: value });
  await updatedNode.save();
  return updatedNode;
}

// Query for sum in the range [queryLeft, queryRight]
async function query(node, left, right, queryLeft, queryRight) {
  if (queryRight < left || right < queryLeft) {
    return 0;
  }
  
  if (queryLeft <= left && right <= queryRight) {
    return node.value;
  }

  let mid = Math.floor((left + right) / 2);
  
  const leftNode = await Node.findById(node.left, (err, doc) => doc);
  const rightNode = await Node.findById(node.right, (err, doc) => doc);

  return (await query(leftNode, left, mid, queryLeft, queryRight)) +
         (await query(rightNode, mid + 1, right, queryLeft, queryRight));
}

app.put('/array/:id', async (req, res) => {
  const sessionID = req.session.id;
  const id = req.params.id - 1;
  const arrayModel = await ArrayModel.findOne({ sessionID });
  if (!arrayModel) return res.status(404).send('Array not found');
  
  let arrayNode = await Node.findById(arrayModel.root).exec();

  switch (req.body.action) {
    case 'UPDATE':
      const index = req.body.index - 1;
      const value = req.body.value;
      const updatedRoot = await update(arrayNode, 0, arrayNode.value - 1, index, value);
      arrayModel.root = updatedRoot._id;
      break;
    
    case 'QUERY':
      const left = req.body.left - 1;
      const right = req.body.right - 1;
      const sum = await query(arrayNode, 0, arrayNode.value - 1, left, right);
      res.send({ sum });
      return;
    
    case 'CLONE':
      const newArrayModel = new ArrayModel({ sessionID, root: arrayModel.root });
      await newArrayModel.save();
      res.send('Clone created successfully');
      return;
    
    default:
      res.status(400).send('Invalid action');
      return;
  }

  await arrayModel.save();
  res.send('Operation was successful.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
