const cp = require('child_process')
const ExiftoolContext = require('../../src/')
const os = require('os')
const assert = require('assert')
const Catchment = require('catchment')
const EOL = require('os').EOL

const HOME = os.homedir()

const bin = 'echo'
const args = ['hello', 'world']
const options = {
    cwd: HOME,
}

const mockProcess = {
    context: ExiftoolContext,

    'should mock process': (ctx) => {
        ctx.mockSpawn()

        const proc = cp.spawn(bin, args, options)
        assert.deepEqual(proc.args, { bin, args, options })
    },
    'should push to stdout': (ctx) => {
        ctx.mockSpawn()
        const proc = cp.spawn(bin, args, options)
        const catchment = new Catchment()
        proc.stdout.pipe(catchment)

        const t1 = 'test'
        const t2 = 123
        proc.pushStdout(t1)
        proc.pushStdout(t2)
        proc.pushStdout(null)
        return catchment.promise
            .then((res) => {
                assert.equal(res, `${t1}${t2}`)
            })
    },
    'should push to stderr': (ctx) => {
        ctx.mockSpawn()
        const proc = cp.spawn(bin, args, options)
        const catchment = new Catchment()
        proc.stderr.pipe(catchment)

        const t1 = 'test'
        const t2 = 123
        proc.pushStderr(t1)
        proc.pushStderr(t2)
        proc.pushStderr(null)
        return catchment.promise
            .then((res) => {
                assert.equal(res, `${t1}${t2}`)
            })
    },
    'should write to stdin': (ctx) => {
        ctx.mockSpawn()
        const proc = cp.spawn(bin, args, options)
        const t = 'hello'
        return new Promise((resolve) => {
            proc.stdin.write(t, resolve)
        })
            .then(() => {
                assert.deepEqual(proc.stdinData, [{
                    chunk: new Buffer(t),
                    encoding: 'buffer',
                }])
            })
    },
    'should mock now': (ctx) => {
        ctx.mockSpawn()
        const now = Date.now()
        assert.equal(now, 10)
    },
    'should mock now with given time': (ctx) => {
        const t = 20
        ctx.mockSpawn(t)
        const now = Date.now()
        assert.equal(now, t)
    },
    'should mock process with a given id': (ctx) => {
        const t = 999
        ctx.mockSpawn(null, t)
        const proc = cp.spawn(bin, args, options)
        assert.equal(proc.pid, t)
    },
    'should make proc accessible': (ctx) => {
        ctx.mockSpawn()
        assert.notEqual(ctx.proc, undefined)
        assert.equal(ctx.proc.args, null)
    },
    'should close when sent -stay_open false': (ctx) => {
        ctx.mockSpawn()
        const proc = cp.spawn(bin, args, options)
        const p = new Promise((resolve) => {
            proc.on('close', resolve)
        })
        proc.stdin.write('-stay_open')
        proc.stdin.write(EOL)
        proc.stdin.write('false')
        proc.stdin.write(EOL)
        return p
    },
}

const mockProcessRestore = {
    'should restore Date.now': () => {
        const now = Date.now()
        assert.notEqual(now, 10)
    },
    'should restore spawn': () => {
        const catchment = new Catchment()
        const t = 'hello world'
        const proc = cp.spawn('echo', t.split(' '))
        proc.stdout.pipe(catchment)
        return catchment.promise
            .then((res) => {
                assert.equal(res.trim(), t)
            })
    },
}

module.exports = {
    mockProcess,
    mockProcessRestore,
}
