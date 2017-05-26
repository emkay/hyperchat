#!/usr/bin/env node

const argv = process.argv.slice(2)
const usage = 'Usage: hyperchat channel nick\n'

if (argv.length < 2) {
  process.stdout.write(usage)
  process.exit(0)
}

const channel = argv[0]
const nick = argv[1]

const init = require('.')
init(channel, nick)
