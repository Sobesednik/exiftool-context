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

Fixtures are found in `./etc` directory. These functions and properties are available:

### jpegFile

`CANON/IMG_9858.JPG`

### jpegFile2

`CANON/IMG_9859.JPG`

### tempFile

You need to call `ctx.createTempFile` first, after which this will be set to a temp
jpeg file, into which you can write some metadata.

### dataFile

You need to call `ctx.createDataFile` first, after which this will be set to a data
file which can be used to open exiftool with and write commands to.

### defaultBin

Returns `exiftool`.

### static replaceSlashes()

`exiftool` will print "File not found: test/fixtures/no_such_file.jpg" in case of error,
even on windows. use this function to replace slashes on your platform.

### fileDoesNotExist

`no_such_file.jpg`

### fileDoesNotExist2

`no_such_file2.jpg`

### folder

`CANON`

### emptyFolder

`empty`

### filenameWithEncoding

`Fọto`

### assertJpegMetadata

A function which has hard-coded metadata in it to assert against fixtures metadata.

### ep

An `ExiftoolProcess` instance. it is not set at first, call `ctx.create()` before accessing.

### create(bin)

```js
this._ep = new exiftool.ExiftoolProcess(bin)
```

Create a new instance with given bin, and assign it to self.

### open(encoding, file, debug)

Open a new instance

### createOpen(bin)

```js
this.create(bin).open()
```

Create instance and open it

### close()

```js
this.ep.close()
```

Close instance

### readMetadata()

```js
ep.readMetadata()
```

Read metadata of a file

### writeMetadata()

```js
ep.writeMetadata()
```

Write metadata to a file

### initAndReadMetadata()

```js
ep.open.readMetadata()
```

Open ExiftoolProcess and read metadata

### initAndWriteMetadata()

```js
ep.open.writeMetadata()
```

Open ExiftoolProcess and write metadata

### createTempFile()

Create a new temp file for testing. Currently clones a jpeg fixture.

### createDataFile()

Create a data file which can be used to open `exiftool`

### writeToDataFile(data)

Write some data to the data file.

### _destroy()

Perform the following:

* unlinkTempFile(this.dataFile)
* unlinkTempFile(this.dataFile)
* unlinkTempFile(this.tempFile)

That is, make sure that tests do not have open processes after them, or temp files.

## What is a Test Context

A test context is an object which is available to tests via `ctx` argument. This is
implemented in `zoroaster` test runner. It allows to abstract individual test contexts.
That makes maintanence of test files easier when they don't have to rely on global scope
of each other. You can create unique and specific tests contexts to be used in testing
of your application. Save time by reusing the code, and using tests as a tool, and not
the other way around.

To learn more about the idea of test contexts, read [zoroaster documentation](https://zoroaster.co.uk/test-context).

---

(c) [Zoroaster](https://zoroaster.co.uk) 2017
