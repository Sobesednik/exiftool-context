'use strict'
const assert = require('assert')
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const ExiftoolContext = require('../../src/')

class MockExiftool {
    constructor(binary) {
        this.created = true
        this.binary = binary
    }
    open(options) {
        this.options = options
        this.opened = true
    }
}

const myModuleTestSuite = {
    context: ExiftoolContext,
    'should be a function': () => {
        assert.equal(typeof ExiftoolContext, 'function')
    },
    'should create ExiftoolContext without error': () => {
        const context = {}
        ExiftoolContext.call(context)
        assert.equal(context._ep, null)
    },
    'should read correct metadata': (ctx) => {
        const ep = ctx.create()
        return ep.open().then(() => {
            return ep.readMetadata(ctx.jpegFile)
        })
        .then((res) => {
            const file = res.data[0]
            return ctx.assertJpegMetadata(file)
        })
    },
    'should read file with filename in utf8': (ctx) => {
        return ctx.initAndReadMetadata(ctx.filenameWithEncoding, ['charset filename=utf8'])
            .then((res) => {
                assert.notEqual(res.data, null)
                assert.equal(
                    res.data[0].SourceFile,
                    ctx.replaceSlashes(ctx.filenameWithEncoding)
                )
                assert.equal(res.error, null)
            })
    },
    'should have ExiftoolProcess as default constructor': (ctx) => {
        assert.strictEqual(ctx.exiftoolConstructor, exiftool.ExiftoolProcess)
    },
    'should be able to specify ExiftoolProcess prototype': (ctx) => {
        ctx.exiftoolConstructor = MockExiftool
        assert.equal(ctx.exiftoolConstructor, MockExiftool)
    },
    'should create ep with given constructor': (ctx) => {
        ctx.exiftoolConstructor = MockExiftool
        ctx.create()
        assert(ctx.ep instanceof MockExiftool)
        assert(ctx.ep.created)
    },
    create: {
        'should create exiftool with default binary': (ctx) => {
            ctx.exiftoolConstructor = MockExiftool
            ctx.create()
            assert.equal(ctx.ep.binary, exiftoolBin)
        },
        'should pass binary to the constructor': (ctx) => {
            ctx.exiftoolConstructor = MockExiftool
            const binary = '/usr/local/bin'
            ctx.create(binary)
            assert.equal(ctx.ep.binary, binary)
        },
    },
    createOpen: {
        'should pass binary to the constructor': (ctx) => {
            ctx.exiftoolConstructor = MockExiftool
            const binary = '/usr/local/bin'
            ctx.createOpen(binary)
            assert.equal(ctx.ep.binary, binary)
        },
        'should pass options to the open method': (ctx) => {
            ctx.exiftoolConstructor = MockExiftool
            const options = { detached: true }
            ctx.createOpen(null, options)
            assert.equal(ctx.ep.options, options)
        },
        'should pass options to the open method if specified as first argument': (ctx) => {
            ctx.exiftoolConstructor = MockExiftool
            const options = { detached: true }
            ctx.createOpen(options)
            assert.equal(ctx.ep.binary, exiftoolBin)
            assert.equal(ctx.ep.options, options)
        },
        'should open exiftool': (ctx) => {
            ctx.exiftoolConstructor = MockExiftool
            ctx.createOpen()
            assert(ctx.ep.opened)
        },
    },
    'should be able to set and use global exiftool constructor': {
        'should set global': () => {
            ExiftoolContext.globalExiftoolConstructor = MockExiftool
        },
        'should create using global': (ctx) => {
            ctx.create()
            assert(ctx.ep instanceof MockExiftool)
            assert(ctx.ep.created)
        },
    },
    'should be able to unset global and use default constructor': {
        'should unset global': () => {
            ExiftoolContext.globalExiftoolConstructor = null
        },
        'should create using default': (ctx) => {
            ctx.create()
            assert(ctx.ep instanceof exiftool.ExiftoolProcess)
        },
    },
    'should convert a string to unicode': (ctx) => {
        const res = ctx.toUnicode('Fọto.jpg')
        assert.equal(res, '\\u0046\\u1ECD\\u0074\\u006F\\u002E\\u006A\\u0070\\u0067')
    },
}

module.exports = myModuleTestSuite
