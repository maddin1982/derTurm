node-mjpeg-proxy
================

A node.js module to proxy MJPEG requests. Supports multiple client consuming a single stream. Fixes an iOS 6 issue with some MJPEG steams.

Installation
------------

From npm:

``` bash
$ npm install mjpeg-proxy
```

From source:

``` bash
$ git clone https://github.com/legege/node-mjpeg-proxy.git
$ cd node-mjpeg-proxy
$ npm install
```

Example
-------

### Example Usage

``` js
var MjpegProxy = require('mjpeg-proxy').MjpegProxy;
var express = require('express');
var app = express();

app.get('/index1.jpg', new MjpegProxy('http://admin:admin@192.168.1.109/cgi/mjpg/mjpg.cgi').proxyRequest);
app.listen(8080);
```

Here, it will create a proxy to the source video feed (`http://admin:admin@192.168.1.109/cgi/mjpg/mjpg.cgi`). You can now access the feed at `http://localhost:8080/index1.jpg`.

API
---

### MjpegProxy

``` js
var mjpegProxy = new MjpegProxy(mjpegUrl);
``` 

Returns: a `MjpegProxy` instance for the MJPEG stream at `mjpegUrl` URL.

Credits
-------

Original prototype version from:

  * Phil Rene ([philrene](http://github.com/philrene))
  * Chris Chua ([chrisirhc](http://github.com/chrisirhc))

License
-------

(The MIT License)

Copyright (C) 2013, Georges-Etienne Legendre <legege@legege.com>

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.

A different license may apply to other software included in this package, 
including libftdi and libusb. Please consult their respective license files
for the terms of their individual licenses.

