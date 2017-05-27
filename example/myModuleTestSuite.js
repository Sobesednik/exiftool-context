const ExiftoolContext = require('../.')

const myModuleTestSuite = {
    context: ExiftoolContext,
    'should have correct metadata': (ctx) => {
        const ep = ctx.create()
        return ep.open().then(() => {
            // Context has a number of JPEG pictures with some metadata.
            return ep.readMetadata(ctx.jpegFile)
        })
        .then((res) => {
            const file = res.data[0]
            return ctx.assertJpegMetadata(file)
        })
    },
}

module.exports = myModuleTestSuite
