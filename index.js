const crypto = require('crypto')
const chalk = require('chalk')
const toPort = require('hash-to-port')
const swarm = require('discovery-swarm')
const jsonStream = require('duplex-json-stream')
const streamSet = require('stream-set')

const sockets = streamSet()

function hyperchat (channel, myNick) {
  const hash = crypto.createHash('sha256')
  hash.update(channel)

  const key = hash.digest('hex')
  const sw = swarm()

  let mySeq = 0
  const seqMap = new Map()

  const shouldUpdateSequence = (nick, seq) => {
    return !seqMap.has(nick) || seqMap.get(nick) < seq
  }

  sw.listen(toPort(myNick))
  sw.join(key)

  process.stdout.write('> ')

  sw.on('connection', (connection, info) => {
    const socket = jsonStream(connection)
    sockets.add(socket)

    socket.on('data', data => {
      const {nick, msg, seq} = data
      const output = `\n${data.nick}> ${data.msg}\n> `

      if (shouldUpdateSequence(nick, seq)) {
        seqMap.set(nick, seq)
        sockets.forEach(s => {
          s.write({nick, msg, seq})
        })

        if (nick !== myNick) process.stdout.write(chalk.blue(output))
      }
    })

    // @TODO: clean up stuff?
    socket.on('close', () => {})
  })

  process.stdin.on('data', data => {
    mySeq += 1
    const msg = data.toString().trim()
    if (msg.length > 0) {
      sockets.forEach(s => {
        s.write({nick: myNick, msg: `${msg}\n`, seq: mySeq})
      })
      process.stdout.write('> ')
    }
  })
}

module.exports = hyperchat
