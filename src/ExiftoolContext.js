const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const exiftoolBin = require('dist-exiftool')
const exiftool = require('node-exiftool')

// exiftool will print "File not found: test/fixtures/no_such_file.jpg"
// with forward slashes independent of platform
const replaceSlashes = str => str.replace(/\\/g, '/')

const fixturesDir = 'fixtures'
const etcDir = path.join(__dirname, '../etc')
const jpegFile = path.join(etcDir, fixturesDir, 'CANON', 'IMG_9858.JPG')
const jpegFile2 = path.join(etcDir, fixturesDir, 'CANON', 'IMG_9859.JPG')
const fileDoesNotExist = replaceSlashes(path.join(etcDir, fixturesDir, 'no_such_file.jpg'))
const fileDoesNotExist2 = replaceSlashes(path.join(etcDir, fixturesDir, 'no_such_file2.jpg'))
const folder = path.join(etcDir, fixturesDir, 'CANON')
const emptyFolder = path.join(etcDir, fixturesDir, 'empty')
const filenameWithEncoding = path.join(etcDir, fixturesDir, 'Fọto.jpg')

// create temp file for writing metadata
function makeTempFile() {
    const n = Math.floor(Math.random() * 100000)
    const tempFile = path.join(os.tmpdir(), `node-exiftool_test_${n}.jpg`)
    return new Promise((resolve, reject) => {
        const rs = fs.createReadStream(jpegFile)
        const ws = fs.createWriteStream(tempFile)
        rs.on('error', reject)
        ws.on('error', reject)
        ws.on('close', () => {
            resolve(tempFile)
        })
        rs.pipe(ws)
    })
}

function assertJpegMetadata(file) {
    const mask = {
        FileType: 'JPEG',
        MIMEType: 'image/jpeg',
        CreatorWorkURL: 'https://sobesednik.media',
        Creator: 'Photographer Name',
        Scene: '011200',
    }
    // shallow deep equal
    Object.keys(mask)
        .forEach((key) => {
            assert.equal(file[key], mask[key])
        })
}

const unlinkTempFile = tempFile => new Promise((resolve, reject) =>
    fs.unlink(tempFile, err => (err ? reject(err) : resolve(tempFile)))
)

const context = function Context() {
    this._ep = null
    this._exiftoolConstructor = exiftool.ExiftoolProcess

    Object.assign(this, {
        fileDoesNotExist,
        fileDoesNotExist2,
        folder,
        emptyFolder,
        filenameWithEncoding,
        assertJpegMetadata,
    })

    Object.defineProperties(this, {
        jpegFile: { get: () => jpegFile },
        jpegFile2: { get: () => jpegFile2 },
        tempFile: { get: () => this._tempFile },
        defaultBin: { get: () => 'exiftool' },
        replaceSlashes: { get: () => replaceSlashes },

        ep: {
            get: () => this._ep,
        },
        exiftoolConstructor: {
            get: () => {
                return this._exiftoolConstructor
            },
            set: (value) => {
                this._exiftoolConstructor = value
            },
        },
        create: { value: (bin) => {
            const ep = new this.exiftoolConstructor(
                typeof bin === 'string' ? bin : exiftoolBin
            )
            this._ep = ep
            return this
        }},
        open: { value: () => {
            if (this.ep)
                return this.ep.open()
            throw new Error('ep has not been created')
        }},
        createOpen: { value: (bin) => {
            return this.create(bin).open()
        }},
        close: { value: () => {
            if (this.ep)
                return this.ep.close()
            throw new Error('ep has not been created')
        }},
        readMetadata: { value: function readMetadata() {
            if (this.ep)
                return this.ep.readMetadata.apply(this.ep, arguments)
            throw new Error('ep has not been created')
        }},
        writeMetadata: { value: function writeMetadata() {
            if (this.ep)
                return this.ep.writeMetadata.apply(this.ep, arguments)
            throw new Error('ep has not been created')
        }},
        initAndReadMetadata: { value: function initAndReadMetadata() {
            return this.createOpen()
                .then(() => {
                    return this.readMetadata.apply(this, arguments)
                })
        }},
        initAndWriteMetadata: { value: function initAndWriteMetadata() {
            return this.createOpen()
                .then(() => this.writeMetadata.apply(this, arguments))
        }},
        createTempFile: { value: function createTempFile() {
            if (this._tempFile) {
                return Promise.reject(new Error('Temp file is already created.'))
            }
            return makeTempFile()
                .then((res) => {
                    this._tempFile = res
                    return res
                })
        }},
        _destroy: { get: () => {
            const promises = []
            if (this.ep && this.ep.isOpen) {
                promises.push(this.ep.close())
            }
            if (this.tempFile) {
                promises.push(unlinkTempFile(this.tempFile))
            }
            return Promise.all(promises)
        }},
    })
}

module.exports = context
