# Array Query API Documentation

## Introduction

This guide documents the operations of the Array Query API. This API provides functionalities to create a persistent array, update an element in it, query sum over a range inside it, and clone it. Every user is identified by session-specific cookies, so each user can have their own list of arrays.

The API interface is defined and served over HTTP, following RESTful principles. The response data format is in JSON.

## Environment Setup

- Node.js: Download and install Node.js from [here](https://nodejs.org/)
- MongoDB: Download and install MongoDB from [here](https://www.mongodb.com/)

## Project setup and start the server

Clone the git repository:

```shell script
$ git clone https://github.com/huynhtrankhanh/mongodb-tree-demo
```

Change to the project directory:

```shell script
$ cd mongodb-tree-demo
```

Install dependencies:

```shell script
$ npm install
```

Start the server:

```shell script
$ npm start
```

## API Endpoints

### Create an Array - `POST /array`

Creates a new array for a new session. 

**Request body:**

```
{
  "values": [...n values...]
}
```
**Response:**

On successful array creation:

```
Array created successfully
```

### Update an Array Element - `PUT /array/:id`

Updates an array element at the given index for the given session array.

**Request parameters:**

`id`: Version number of the array e.g. /array/1

**Request body:**

```
{
  "action": "1",
  "index": "...an integer value...",
  "value": "...an integer value..."
}
```
**Response:**

On successful update:

```
Done
```

### Query Array Sum - `PUT /array/:id`

Calculates the sum of elements in the given range for the chosen array.

**Request parameters:**

`id`: Version number of the array e.g. /array/1

**Request body:**

```
{
  "action": "2",
  "left": "...an integer value...",
  "right": "...an integer value..."
}
```
**Response:**

On successful sum computation:

```
{
  "sum": "...an integer value..."
}
```

### Clone an Array - `PUT /array/:id`

Creates a copy of the array with the provided version number and adds it to the end of the list.

**Request parameters:**

`id`: Version number of the array e.g. /array/1

**Request body:**

```
{
  "action": "3"
}
```
**Response:**

On successful cloning:

```
Done
```

# Efficiency and Optimality of the Array Query API's Algorithm

The Array Query API leverages a **Segment Tree** data structure to optimize the querying of array segments, and delivering updates. A segment tree is a divide-and-conquer-based data structure that can perform range queries and updates in logarithmic time (`O(logn)`), which makes it a powerful tool for handling array-based operations of the Array Query API.

This is a significant improvement when compared to traditional array implementations for these operations, which would typically handle updates in constant time (`O(1)`), while queries would require linear time (`O(n)`) in the worst case. The use of the segment tree strikes a balance between these complexities for an efficient solution.

## Efficient Segment Tree Construction

The segment tree is built recursively top-down, which ensures it is well balanced and complete. The process involves subdividing the array into two equal halves and recursively constructing the left and right children as segment trees for these halves. In the base case (when only one element is left), a leaf node that holds the element's value is created.

This top-down construction approach ensures that we have a complete, balanced binary tree where each node contains the sum of its two children, thereby allowing for extremely efficient segment sum queries.

## Optimized Update and Sum Query

The update operation leverages the structure of the segment tree for efficient updates. In each step, it checks if the index of the updated element is in the left or right half of the array segment. Depending on the result, it recursively dives into the corresponding subtree to perform the update. 

The sum query operation similarly utilizes the segment tree's structure. It checks if the queried segment fully overlaps, partially overlaps, or doesn't overlap with the array segment of the current node. Depending on these conditions, the function either uses the stored sum, recursively resolves the partial segments, or returns 0, respectively.

By acting only on segments that are part of the query and traversing the tree depth-first, these operations take advantage of the shorter path to their target nodes and avoid unnecessary computations, hence their logarithmic time complexity.

## Efficient Clone Operation

In the provided solution, the cloning operation is performed in constant time (`O(1)`). The cloned array simply gets a reference to the root of the original array segment tree. As these model instances are managed by MongoDB and Node.js with automatic garbage collection when no references are left, this approach saves memory and has minimal impact on the server's performance.
