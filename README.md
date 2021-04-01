# SVG optimiser, joiner and reverser

This tool is _very_ specific the the SVG files created by my tools over at https://revdancatt.com/penplotter

A lot of the time, but not always, I want to optimise and join the lines that are created, but I don't want to have the browser javascript do it.

So here is a command line tool that does the job.

## Install

`npm install -g`

## Running

`svgjoin filename.svg`

This will create two new files

filename_joined.svg  
filename_reversed.svg

The first is optimised with the ends of lines joined together where possible. The second is the same data just in the reverse order, so you can run the plot twice. Once in one direction, and once in the other, but with the ability to wipe, change, or whatever you need to do with the pen inbwetween the plots.

## Not a general SVG tool.

SVGs can be written in a number of ways. The tools I write at https://revdancatt.com/penplotter write in a very specfic way, a single `<path>` node where the lines are created by a string of `M` and `L` commands (move and line) and space delimited values. This code makes use of hardcoded `.split()` and `.join()` functions to process it all. So it won't work on _other_ valid SVGs, just the ones in that very format I create.




