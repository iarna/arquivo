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
const npm = `${__dirname}/node_modules/npm/bin/npm-cli.js`

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
  const prefix = `${workdir}/node_modules`
  const outpath = `${startingDir}/${outname}`
  try {
    const pjson = require(`${prefix}/${name}/package.json`)
    delete pjson.bundledDependencies
    pjson.bundleDependencies = fs.readdirSync(`${prefix}/${name}/node_modules`).filter(f => !/^[.]/.test(f))
    fs.writeFileSync(`${prefix}/${name}/package.json`, JSON.stringify(pjson, null, 2))
  } catch (x) {
  }
  try {
    let lock = require(`${workdir}/package-lock.json`)
    lock = lock.dependencies[name]
    lock.lockfileVersion = 1
    delete lock.resolved
    delete lock.integrity
    // it shouldn't be necessary to mark these as such in the shrinkwrap,
    // but there was an early npm@5 bug that would result in the bundle
    // being ignored w/o this.
    markAsBundled(lock)
    fs.writeFileSync(`${prefix}/${name}/npm-shrinkwrap.json`, JSON.stringify(lock, null, 2))

    function markAsBundled (lock) {
      if (!lock.dependencies) return
      Object.keys(lock.dependencies).forEach(d => {
        lock.dependencies[d].bundled = true
        markAsBundled(lock.dependencies[d])
      })
    }
  } catch (x) {
  }
  process.chdir(prefix)
  tar.c({gzip:true, file: outpath, portable: true, sync: true, filter: (p, s) => {
    if (s.isSymbolicLink()) return false
    if (path.basename(p) === '.bin') return false
    return true
  }}, [name])
})
