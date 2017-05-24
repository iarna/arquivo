#!/usr/bin/env node
'use strict'
const yargs = require('yargs')
const npa = require('npm-package-arg')
const path = require('path')
const osenv = require('osenv')
const onExit = require('signal-exit')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const spawn = require('child_process').spawn
const execFileSync = require('child_process').execFileSync
const which = require('which')

const argv = yargs.argv;
const startingDir = process.cwd()
const install = argv._[0] || startingDir
const spec = npa(install, startingDir)
const workdir = path.join(osenv.tmpdir(), 'arquivo-' + process.pid)
const npm = `${__dirname}/node_modules/npm5/bin/npm-cli.js`

mkdirp.sync(path.join(workdir, 'node_modules'))
process.chdir(workdir)

onExit(function () {
  process.chdir(startingDir)
  rimraf.sync(workdir)
})

let npmarg =spec.toString()

const pack = execFileSync(process.execPath, [npm, 'pack', '--loglevel=error', npmarg], {cwd: workdir, stdio: [0,'pipe',2]})
const inst = spawn(process.execPath, [npm, 'install', '--global-style', '--loglevel=error', `file:${pack.toString().trim()}`], {cwd: workdir, stdio: [0,1,2]})
inst.on('close', function (code) {
  if (code !== 0) process.exit(code)
  const fs = require('fs')   
  const installed = fs.readdirSync(path.join(workdir, 'node_modules'))
  const name = installed.filter(function (file) { return file[0] !== '.' })[0]
  const pkg = JSON.parse(fs.readFileSync(path.join(workdir, 'node_modules', name, 'package.json')))
  const outname = name + '-' + pkg.version + '.tar.gz'
  console.error(`Packing ${outname}`)
  const tar = require('tar')
  const zlib = require('zlib')
  const prefix = path.join(workdir, 'node_modules')
  const outpath = `${startingDir}/${outname}`
  process.chdir(prefix)
  tar.c({gzip:true, file: outpath, portable: true, sync: true}, [name])
})
