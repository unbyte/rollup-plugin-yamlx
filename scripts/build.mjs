import $ from 'shelljs'

$.rm('-rf', './dist')

$.exec('yarn tsup src/index.ts --dts --format cjs,esm')
