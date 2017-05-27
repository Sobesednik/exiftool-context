const assert = require('assert')
const ExiftoolContext = require('../../src/')

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
    'should have correct metadata': (ctx) => {
        const ep = ctx.create()
        return ep.open().then(() => {
            return ep.readMetadata(ctx.jpegFile)
        })
        .then((res) => {
            const file = res.data[0]
            return ctx.assertJpegMetadata(file)
        })
    },
}

module.exports = myModuleTestSuite
