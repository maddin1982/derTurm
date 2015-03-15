// Copyright (C) 2013, Georges-Etienne Legendre <legege@legege.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var MjpegProxy = require('../mjpeg-proxy').MjpegProxy;
var express = require('express');
var app = express();

var HTTP_PORT = 8080;

var cam1 = "http://admin:admin@192.168.124.54/cgi/mjpg/mjpg.cgi";
var cam2 = "http://admin:@192.168.124.32/videostream.cgi";

app.set("view options", {layout: false});
app.use(express.static(__dirname + '/public'));

app.get('/index1.jpg', new MjpegProxy(cam1).proxyRequest);
app.get('/index2.jpg', new MjpegProxy(cam2).proxyRequest);

app.listen(HTTP_PORT);

console.log("Listening on port " + HTTP_PORT);