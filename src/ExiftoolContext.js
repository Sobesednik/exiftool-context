const assert = require('assert')
const exiftoolBin = require('dist-exiftool')
const fs = require('fs')
const os = require('os')
const path = require('path')
const wrote = require('wrote')
const makePromise = require('makepromise')
const exiftool = require('node-exiftool')

// exiftool will print "File not found: test/fixtures/no_such_file.jpg"
// with forward slashes independent of platform
const replaceSlashes = str => str.replace(/\\/g, '/')

const etcDir = path.join(__dirname, '../etc/')
const fixturesDir = 'fixtures'
const jpegFile = path.join(etcDir, fixturesDir, 'CANON', 'IMG_9858.JPG')
const jpegFile2 = path.join(etcDir, fixturesDir, 'CANON', 'IMG_9859.JPG')
const fileDoesNotExist = replaceSlashes(path.join(etcDir, fixturesDir, 'no_such_file.jpg'))
const fileDoesNotExist2 = replaceSlashes(path.join(etcDir, fixturesDir, 'no_such_file2.jpg'))
const folder = path.join(etcDir, fixturesDir, 'CANON')
const emptyFolder = path.join(etcDir, fixturesDir, 'empty')
const filenameWithEncoding = path.join(etcDir, fixturesDir, 'Fọto.jpg')

// create temp file for writing metadata
function makeTempFile(inputFile, extension) {
    const n = Math.floor(Math.random() * 100000)
    const tempFile = path.join(os.tmpdir(), `exiftool-contex_${n}.${extension}`)
    return wrote(tempFile)
        .then((ws) => {
            return new Promise((resolve, reject) => {
                if (inputFile) {
                    const rs = fs.createReadStream(inputFile)
                    rs.once('error', reject)
                    rs.once('close', () => resolve(ws))
                    rs.pipe(ws)
                } else {
                    resolve(ws)
                }
            })
            .then((ws) => {
                return makePromise(ws.end.bind(ws), null, tempFile)
            })
        })
}

const unlinkTempFile = tempFile => makePromise(fs.unlink, tempFile, tempFile)

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

function ExiftoolContext() {
    this._ep = null

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
        dataFile: {
            get: () => this._dataFile,
            set: (value) => {
                this._dataFile = value
            },
        },
        defaultBin: { get: () => 'exiftool' },
        replaceSlashes: { get: () => replaceSlashes },

        ep: {
            get: () => this._ep,
        },
        create: { value: (bin) => {
            const ep = new exiftool.ExiftoolProcess(
                typeof bin === 'string' ? bin : exiftoolBin
            )
            this._ep = ep
            return this
        }},
        open: { value: (encoding, file, debug) => {
            if (this.ep)
                return this.ep.open(encoding, file, debug)
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
            return makeTempFile(jpegFile, 'jpg')
                .then((res) => {
                    this._tempFile = res
                    return res
                })
        }},
        createDataFile: { value: function createDataFile(inputFile, extension) {
            if (this._dataFile) {
                return Promise.resolve(this._dataFile)
                // return Promise.reject(new Error('Data file is already created.'))
            }
            return makeTempFile(inputFile, extension)
                .then((res) => {
                    this._dataFile = res
                    return res
                })
        }},
        writeToDataFile: { value: function writeToDataFile(data) {
            if (!this.dataFile) {
                return Promise.reject(new Error('Data file is not available.'))
            }
            return wrote(this.dataFile)
                .then((ws) => {
                    this._ws = ws
                })
            // return createWriteStream(this._dataFile, {
                // flags: 'a',
            // })
                .then((ws) => { this._ws = ws })
                .then(() => makePromise(this._ws.write.bind(this._ws), data))
                .then(() => makePromise(this._ws.end.bind(this._ws)))
        }},
        _destroy: { value: () => {
            const promises = []
            if (this.ep && this.ep.isOpen) {
                promises.push(this.ep.close()
                    .then(() => {
                        if (this.dataFile) {
                            return unlinkTempFile(this.dataFile)
                        }
                    })
                )
            } else if (this.dataFile) {
                promises.push(unlinkTempFile(this.dataFile))
            }
            if (this.tempFile) {
                promises.push(unlinkTempFile(this.tempFile))
            }
            return Promise.all(promises)
        }},
    })
}

module.exports = ExiftoolContext
