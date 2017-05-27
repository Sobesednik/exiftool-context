'use strict'
const assert = require('assert')
const exiftool = require('node-exiftool')
const ExiftoolContext = require('../../src/')

class MockExiftool {
    constructor() {
        this.created = true
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
    'should be able to unset global and use default contructor': {
        'should unset global': () => {
            ExiftoolContext.globalExiftoolConstructor = null
        },
        'should create using default': (ctx) => {
            ctx.create()
            assert(ctx.ep instanceof exiftool.ExiftoolProcess)
        },
    },
}

module.exports = myModuleTestSuite
