const child_process = require('child_process')
const EventEmitter = require('events')
const Readable = require('stream').Readable
const Writable = require('stream').Writable
const EOL = require('os').EOL

const originalSpawn = child_process.spawn
const originalNow = Date.now

const restore = () => {
    child_process.spawn = originalSpawn
    Date.now = originalNow
}

const createReadable = () => new Readable({ read() {} })

const pushToReadable = (rs, s) => {
    return rs.push(s === null ? null : new Buffer(`${s}`))
}

function mockSpawn(startTime, id) {
    const pid = Number.isInteger(id) ? id : Math.floor(Math.random() * 1000)
    const stderr = createReadable()
    const stdout = createReadable()

    const proc = Object.assign(new EventEmitter(), {
        pid,
        stderr,
        stdout,
        stdinData: [],
        stdin: new Writable({
            write(chunk, encoding, cb) {
                proc.stdinData.push({ chunk, encoding })
                cb()
                const data = proc.stdinData.map(d => String(d.chunk)).join('')
                if (data === `-stay_open${EOL}false${EOL}`) {
                    proc.emit('close')
                }
            },
        }),
        pushStderr: s => pushToReadable(proc.stderr, s),
        pushStdout: s => pushToReadable(proc.stdout, s),
        args: null,
    })
    const now = Number.isInteger(startTime) ? startTime : 10
    Date.now = () => now

    child_process.spawn = (bin, args, options) => {
        proc.args = { bin, args, options }
        const isSpawnCommand = args.find((arg, index, arr) =>
            arg === '-stay_open' && arr[index + 1] === 'True'
        )
        if (isSpawnCommand) {
            setTimeout(() => {
                proc.pushStderr(Date.now())
                proc.pushStderr(null)
            }, 10)
        }
        return proc
    }

    return proc
}

module.exports = {
    mockSpawn,
    restore,
}
