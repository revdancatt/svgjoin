#!/usr/bin/env node
/*
  SCRIPT THAT WILL OPTIMISE AND JOIN A BUNCH OF PATHS
  NOTE:
  This is not fully optimised, when we first start both things, we take the
  first path, and check against the final point on it. Although we check
  both ends of the rest of the lines we _may_ be missing a join to the
  first point of the first path. I'm kinda okay with that fwiw
*/
const fs = require('fs')
const path = require('path')

//  Now loop through the paths, until we've processed each one of them
const joinPaths = (paths, threshold) => {
  console.log('')
  console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
  console.log(' JOINING PATHS')
  console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
  console.log('')
  let finalPaths = []

  let keepGoing = true
  while (keepGoing) {

    console.log('>>>>> JOIN PATHS: ', paths.length)
    finalPaths = []

    let foundNewJoin = false
    while (paths.length >= 1) {
      console.log('JOIN PATHS: ', paths.length)
      //  Grab the first path
      const firstPath = paths.shift()
      const endPoint = firstPath[firstPath.length - 1]
      //  This is where we are going to keep the merge path
      let mergePath = null
      //  This is where we are going to keep the rest of them
      let rejectPaths = []

      /*
        Now we are going to go through all the paths, looking to see if the END POINT of the first
        path, matches any of the FIRST POINTS of the other paths.
        If it does, then we keep the marge path, and put the rest into the rejects
      */
      const x1 = endPoint[0]
      const y1 = endPoint[1]
      paths.forEach((p) => {
        const x2 = p[0][0]
        const y2 = p[0][1]
        const dist = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
        if (dist <= threshold && !mergePath) {
          mergePath = p
          foundNewJoin = true
        } else {
          rejectPaths.push(p)
        }
      })

      //  If we didn't find a mergePath then go again but with all the paths reversed
      if (!mergePath) {
        rejectPaths = []
        paths = paths.map((p) => p.reverse())
        paths.forEach((p) => {
          const x2 = p[0][0]
          const y2 = p[0][1]
          const dist = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
          if (dist <= threshold && !mergePath) {
            mergePath = p
            foundNewJoin = true
          } else {
            rejectPaths.push(p)
          }
        })
      }

      //  If we have a path to merge, then stick them together and put them back in the stack
      //  so they can go around again, if there was still nothing to merge then we put the
      //  path into the finalPaths, where it will live and not get checked again
      if (mergePath) {
        //  remove the last entry from the first path
        firstPath.pop()
        //  Now put it back into the array of rejected paths, so it can go around again
        rejectPaths.push([...firstPath, ...mergePath])
      } else {
        //  If there was nothing to merge, put it on the finalPaths instead, so we can
        //  remove it all from future checking
        finalPaths.push(firstPath)
      }

      paths = rejectPaths
    }
    //  If we didn't find a new join, then we can stop
    if (!foundNewJoin) {
      keepGoing = false
    } else {
      paths = finalPaths
      finalPaths = []
    }
  }
  return finalPaths
}

const optimisePaths = (paths) => {
  console.log('')
  console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
  console.log(' OPTIMISING PATHS')
  console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
  console.log('')
  //  This is going to hold out winning paths
  const winningPaths = []
  //  Grab the first path and also put it onto the winning paths stack
  let checkPath = paths.shift()
  winningPaths.push(checkPath)
  //  Now we need to loop through all the remaining paths, to find the one
  //  that starts or ends clostest to the end point of our first line
  while (paths.length > 0) {
    console.log('OPT PATHS:  ', paths.length)
    //  We are going to store the next path, rejected paths and the
    //  current best minimum distance here
    let nextPath = null
    let rejectPaths = []
    let minDistance = 999999
    
    //  Grab the end points of the checkPath
    const endPoint = checkPath[checkPath.length - 1]
    const x1 = endPoint[0]
    const y1 = endPoint[1]

    //  Go through all the paths one way
    paths.forEach((p) => {
      const x2 = p[0][0]
      const y2 = p[0][1]
      const dist = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
      //  If the distance is less, then we keep the path, otherwise we reject it
      if (dist <= minDistance) {
        //  If we already have a nextPath, then reject it, and grab the new one
        if (nextPath) rejectPaths.push(nextPath)
        nextPath = p
        minDistance = dist
      } else {
        rejectPaths.push(p)
      }
    })

    //  Now reverse all the rejected paths, and look through them again
    paths = rejectPaths.map((p) => p.reverse())
    rejectPaths = []
    paths.forEach((p) => {
      const x2 = p[0][0]
      const y2 = p[0][1]
      const dist = Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2))
      //  If the distance is less, then we keep the path, otherwise we reject it
      if (dist <= minDistance) {
        //  If we already have a nextPath, then reject it, and grab the new one
        rejectPaths.push(nextPath)
        nextPath = p
        minDistance = dist
      } else {
        rejectPaths.push(p)
      }
    })

    //  Now that we have our next path, we need to keep it and add it to the winning paths
    winningPaths.push(nextPath)
    checkPath = nextPath
    paths = rejectPaths
  }
  return winningPaths
}

//  Grab input and output values
let inputFile = null

if (process.argv[2]) inputFile = process.argv[2]
if (!inputFile) {
  console.log('You need to specify an input file')
  process.exit()
}


//  Faff around grapbbing the extension and making a valit output file name if we haven't been given one
const inputSplit = inputFile.split('.')
const inputExtension = inputSplit.pop()
const inputNotExtension = inputSplit.join('.')
inputFile = `${inputNotExtension}.${inputExtension}`
const outputFile = `${inputNotExtension}_joined.${inputExtension}`
const outputReverseFile = `${inputNotExtension}_reversed.${inputExtension}`

//  Read the file and split it into parts
const filename = path.join(process.cwd(), inputFile)
const rawSVG = fs.readFileSync(filename, 'utf-8')
const parts = rawSVG.split('<path d="')
const tailSplit = parts[1].split('"')
const head = parts[0]
const body = tailSplit.shift().trim()
const tail = tailSplit.join('"')

//  Convert the body into an array of points
let paths = body.trim().split('M').map((p) => p.trim().split('L').map((l) => l.trim().split(' ')))
paths.shift()



const startingPaths = paths.length

// const optPaths = optimisePaths(JSON.parse(JSON.stringify(paths)))
let optPaths = JSON.parse(JSON.stringify(paths))
optPaths = joinPaths(JSON.parse(JSON.stringify(paths)), 10)
optPaths = optimisePaths(JSON.parse(JSON.stringify(optPaths)))

const endingPaths = optPaths.length

const reversedPath = JSON.parse(JSON.stringify(optPaths)).reverse().map((p) => p.reverse())

const innerJoin = optPaths.map((l) => `M ${l.map((p) => p.join(' ')).join(' L ')}`).join(' ').trim()
const innerReverse = reversedPath.map((l) => `M ${l.map((p) => p.join(' ')).join(' L ')}`).join(' ').trim()

const output = `${head} <path d="${innerJoin}"${tail}`
const outputReverse = `${head} <path d="${innerReverse}"${tail}`

fs.writeFileSync(path.join(process.cwd(), outputFile), output, 'utf-8')
fs.writeFileSync(path.join(process.cwd(), outputReverseFile), outputReverse, 'utf-8')

console.log('')
console.log('-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-')
console.log('')
console.log('startingPaths: ', startingPaths)
console.log('endingPaths: ', endingPaths)
