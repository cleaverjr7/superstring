'use strict'

const Random = require('random-seed')
const { MarkerIndex } = require('..')
const { traverse, traversalDistance, compare } = require('../test/js/helpers/point-helpers')

const random = new Random(1)
const markerIds = []
let idCounter = 1
let lastInsertionEnd = { row: 0, column: 0 }
let markerIndex = null
const sequentialInsertOperations = []
const insertOperations = []
const spliceOperations = []
const deleteOperations = []
const rangeQueryOperations = []

function runBenchmark () {
  for (let i = 0; i < 40000; i++) {
    enqueueSequentialInsert()
  }

  for (let i = 0; i < 40000; i++) {
    enqueueInsert()
    enqueueSplice()
    enqueueDelete()
  }

  for (let i = 0; i < 500; i++) {
    enqueueRangeQuery()
  }

  markerIndex = new MarkerIndex()
  profileOperations('sequential inserts', sequentialInsertOperations)

  markerIndex = new MarkerIndex()
  profileOperations('inserts', insertOperations)
  profileOperations('range queries', rangeQueryOperations)
  profileOperations('splices', spliceOperations)
  profileOperations('deletes', deleteOperations)
}

function profileOperations (name, operations) {
  console.time(name)
  for (let i = 0, n = operations.length; i < n; i++) {
    const operation = operations[i]
    markerIndex[operation[0]].apply(markerIndex, operation[1])
  }
  console.timeEnd(name)
}

function enqueueSequentialInsert () {
  const id = (idCounter++).toString()
  let row, startColumn, endColumn
  if (random(10) < 3) {
    row = lastInsertionEnd.row + 1 + random(3)
    startColumn = random(100)
    endColumn = startColumn + random(20)
  } else {
    row = lastInsertionEnd.row
    startColumn = lastInsertionEnd.column + 1 + random(20)
    endColumn = startColumn + random(20)
  }
  lastInsertionEnd = { row, column: endColumn }
  sequentialInsertOperations.push(['insert', [id, { row, column: startColumn }, lastInsertionEnd]])
}

function enqueueInsert () {
  const id = (idCounter++).toString()
  const range = getRange()
  const start = range[0]
  const end = range[1]
  const exclusive = Boolean(random(2))
  markerIds.push(id)
  insertOperations.push(['insert', [id, start, end]])
  insertOperations.push(['setExclusive', [id, exclusive]])
}

function enqueueSplice () {
  spliceOperations.push(['splice', getSplice()])
}

function enqueueRangeQuery () {
  rangeQueryOperations.push(['findIntersecting', getRange()])
}

function enqueueDelete () {
  const id = markerIds.splice(random(markerIds.length), 1)
  deleteOperations.push(['delete', [id]])
}

function getRange () {
  const start = { row: random(100), column: random(100) }
  let end = start
  while (random(3) > 0) {
    end = traverse(end, { row: random.intBetween(-10, 10), column: random.intBetween(-10, 10) })
  }
  end.row = Math.max(end.row, 0)
  end.column = Math.max(end.column, 0)

  if (compare(start, end) <= 0) {
    return [start, end]
  } else {
    return [end, start]
  }
}

function getSplice () {
  const range = getRange()
  const start = range[0]
  const oldEnd = range[1]
  const oldExtent = traversalDistance(oldEnd, start)
  let newExtent = { row: 0, column: 0 }
  while (random(2)) {
    newExtent = traverse(newExtent, { row: random(10), column: random(10) })
  }
  return [start, oldExtent, newExtent]
}

runBenchmark()
