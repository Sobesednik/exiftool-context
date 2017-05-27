# ExiftoolContext

[![npm version](https://badge.fury.io/js/exiftool-context.svg)](https://badge.fury.io/js/exiftool-context)

`exiftool-contex` is a context for `zoroaster` which allows to create
`ExiftoolProcess`, open it, create temp jpeg and data file, and make
sure they are removed, and `exiftool` is closed in the `_destroy` method.
Full API description see below.

## Install

`npm i --save-dev exiftool-context`

## How to use

Just specify `ExiftoolContext` as your test suite `context`.

```js
const ExiftoolContext = require('exiftool-context')

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

```

`zoroaster example/myModuleTestSuite`

```fs
example
   myModuleTestSuite.js
    ✓  should have correct metadata

Executed 1 tests.
```

## API

These functions and properties are available:

### jpegFile: { get: () => jpegFile }
### jpegFile2: { get: () => jpegFile2 }
### tempFile: { get: () => this._tempFile }
### dataFile: { get: () => this._dataFile, set: (value) => { this._dataFile = value } }
### defaultBin: { get: () => 'exiftool' }

### replaceSlashes() // exiftool will print "File not found: test/fixtures/no_such_file.jpg"

### fileDoesNotExist
### fileDoesNotExist2
### folder
### emptyFolder
### filenameWithEncoding
### assertJpegMetadata

### ep(): this._ep

Getter for intance's ep

### create(bin): this._ep = new exiftool.ExiftoolProcess(bin)

Create a new instance with given bin, and assign it to self.

### open(encoding, file, debug): ep.open(encoding, file, debug)

Open current instance

### createOpen(bin): this.create(bin).open()

Create instance and open it

### close: ep.close()

Close instance

### readMetadata: ep.readMetadata()

Read metadata of a file

### writeMetadata: ep.writeMetadata()

Write metadata to a file

### initAndReadMetadata: ep.open.readMetadata()

Open ExiftoolProcess and read metadata

### initAndWriteMetadata: ep.open.writeMetadata()

Open ExiftoolProcess and write metadata

### createTempFile()

Create a new temp file for testing. Currently clones a jpeg fixture.

### createDataFile()

Create a data file which can be used to open `exiftool`

### writeToDataFile(data)

Write some data to the data file.

### _destroy:

Perform the following:

* unlinkTempFile(this.dataFile)
* unlinkTempFile(this.dataFile)
* unlinkTempFile(this.tempFile)

That is, make sure that tests do not have open processes after them, or temp files.


## What is a Test Context

A test context is an object (or instance of a class) which is available to tests via
`ctx` argument. This is implemented in `zoroaster` test runner. It allows to abstract
individual test contexts to be used in tests. That makes maintanence of test files
so much easier, when they don't have to rely on global scope of each other. Improved
code reuse, refactor and readily available testing allows to create unique and
specifically tailored tests contexts to be used in bespoke and Open Source software.

To learn more about the idea of test contexs, visit [zoroaster documentation](https://zoroaster.co.uk/test-context).

---

(c) [Zoroaster](https://zoroaster.co.uk) 2017
