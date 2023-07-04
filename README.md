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
