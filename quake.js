(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var webgl = require('gl/gl');
var Input = require('input');
var StatusBar = require('ui/statusbar');
var Client = require('client');
var assets = require('assets');
var con = require('ui/console');
var installer = require('installer/installer');

if (!window.requestFrame) {
    window.requestFrame = ( function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function() {
                window.setTimeout( callback, 1000 / 60 );
            };
    })();
}

Quake = function() {};
var ticks = 100000000;

var tick = function(time) {
    if (ticks-- < 0) return;
    requestFrame(tick);
    Quake.instance.tick(time);
};

Quake.prototype.tick = function(time) {

    con.update(time);
    this.client.update(time);
    this.handleInput();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    if (this.client.viewEntity > 0)
        this.client.world.draw(this.projection, this.client.viewEntity);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    this.statusBar.draw(this.ortho);
    con.draw(this.ortho);
};

// Temp. controller.
Quake.prototype.handleInput = function() {
    if (this.client.viewEntity === -1)
        return;



    /*
    var angle = utils.deg2Rad(this.client.viewAngles[1]);
    var position = this.client.entities[this.client.viewEntity].nextState.origin;
    var speed = 5.0;

    if (this.input.left)
        this.client.viewAngles[1] -= 2;
    if (this.input.right)
        this.client.viewAngles[1] += 2;
    if (this.input.up) {
        this.client.demo = null;
        position[0] += Math.cos(angle) * speed;
        position[1] -= Math.sin(angle) * speed;
    }
    if (this.input.down) {
        position[0] -= Math.cos(angle) * speed;
        position[1] += Math.sin(angle) * speed;
    }
    if (this.input.flyUp)
        position[2] += 10;
    if (this.input.flyDown)
        position[2] -= 10;
    */
};

Quake.prototype.start = function() {
    Quake.instance = this;
    webgl.init('canvas');
    this.ortho = mat4.ortho(mat4.create(), 0, gl.width, gl.height, 0, -10, 10);
    this.projection = mat4.perspective(mat4.create(), 68.03, gl.width / gl.height, 0.1, 4096);

    var self = this;
    installer.start(function(pak) {
        assets.add('shaders/color2d.shader');
        assets.add('shaders/model.shader');
        assets.add('shaders/texture2d.shader');
        assets.add('shaders/world.shader');
        assets.precache(function() {
            con.init();
            self.input = new Input();
            self.statusBar = new StatusBar();
            self.client = new Client();
            self.client.playDemo('demo1.dem');
            tick();
        });
    });
};





}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_d6b3c4a9.js","/")
},{"1YiZ5S":5,"assets":6,"buffer":2,"client":7,"gl/gl":17,"input":22,"installer/installer":24,"ui/console":33,"ui/statusbar":34}],2:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/index.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer")
},{"1YiZ5S":5,"base64-js":3,"buffer":2,"ieee754":4}],3:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib")
},{"1YiZ5S":5,"buffer":2}],4:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/buffer/node_modules/ieee754")
},{"1YiZ5S":5,"buffer":2}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/../node_modules/gulp-browserify/node_modules/browserify/node_modules/process/browser.js","/../node_modules/gulp-browserify/node_modules/browserify/node_modules/process")
},{"1YiZ5S":5,"buffer":2}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Shader = require('gl/shader');
var Texture = require('gl/texture');
var Pak = require('formats/pak');
var Wad = require('formats/wad');
var Palette = require('formats/palette');
var Bsp = require('formats/bsp');
var Mdl = require('formats/mdl');
var utils = require('utils');

function getName(path) {
    var index1 = path.lastIndexOf('/');
    var index2 = path.lastIndexOf('.');
    return path.substr(index1 + 1, index2 - index1 - 1);
}

function download(item, done) {
    var request = new XMLHttpRequest();
    request.open('GET', item.url, true);
    request.overrideMimeType('text/plain; charset=x-user-defined');
    if (item.binary)
        request.responseType = 'arraybuffer';
    request.onload = function (e) {
        if (request.status !== 200)
            throw 'Unable to read file from url: ' + item.name;

        var data = item.binary ?
            new Uint8Array(request.response) : request.responseText;
        done(item, data);
    };

    request.onerror = function (e) {
        throw 'Unable to read file from url: ' + request.statusText;
    };
    request.send(null);
}

var Assets = function() {
    this.pending = [];
    this.shaders = {};
};

Assets.prototype.add = function(url, type) {
    type = type || utils.getExtension(url);
    if (!type)
        throw 'Error: Unable to determine type for asset: ' + name;
    var binary = type !== 'shader';
    this.pending.push({ url: url, name: getName(url), type: type, binary: binary });
};

Assets.prototype.setPak = function(data) {
    this.pak = new Pak(data);
    this.wad = new Wad(this.pak.load('gfx.wad'));
    this.palette = new Palette(this.pak.load('gfx/palette.lmp'));
};

Assets.prototype.insert = function(item, data) {
    switch (item.type) {
        case 'shader':
            this.shaders[item.name] = new Shader(data);
            break;
        default: throw 'Error: Unknown type loaded: ' + item.type;
    }
};

Assets.prototype.load = function(name, options) {

    var index = name.indexOf('/');
    var location = name.substr(0, index);
    var type = utils.getExtension(name) || 'texture';
    name = name.substr(index + 1);
    options = options || {};

    switch (type) {
        case 'bsp':
            return new Bsp(this.pak.load(name));
        case 'mdl':
            return new Mdl(name, this.pak.load(name));
    }

    options.palette = this.palette;
    switch(location) {
        case 'pak':
            var data = this.pak.load(name);
            return new Texture(data, options);
        case 'wad':
            var data = this.wad.get(name);
            return new Texture(data, options);
        default:
            throw 'Error: Cannot load files outside PAK/WAD: ' + name;
    }
};

Assets.prototype.precache = function(done) {
    var total = this.pending.length;
    var self = this;
    for (var i in this.pending) {
        var pending = this.pending[i];
        download(pending, function(item, data) {
            self.insert(item, data);
            if (--total <= 0) {
                self.pending = [];
                done();
            }
        });
    }
};
module.exports = exports = new Assets();
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/assets.js","/")
},{"1YiZ5S":5,"buffer":2,"formats/bsp":9,"formats/mdl":10,"formats/pak":11,"formats/palette":12,"formats/wad":13,"gl/shader":19,"gl/texture":21,"utils":35}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var assets = require('assets');
var con = require('ui/console');
var Protocol = require('protocol');
var World = require('world');

var Client = function() {
    this.viewEntity = -1;
    this.time = { oldServerTime: 0, serverTime: 0, oldClientTime: 0, clientTime: 0 };
    this.world = new World();
};

Client.prototype.playDemo = function(name) {
    var demo = assets.pak.load(name);
    while (demo.readUInt8() !== 10);
    this.demo = demo;
};

Client.prototype.readFromServer = function() {
    var demo = this.demo;
    if (!demo || demo.eof()) return;

    var messageSize = demo.readInt32();

    var angles = [demo.readFloat(), demo.readFloat(), demo.readFloat()];
    if (this.viewEntity !== -1) {
        var ve = this.world.entities[this.viewEntity];
        vec3.set(ve.state.angles, angles[0], angles[1], angles[2]);
    }

    var msg = demo.read(messageSize);
    var cmd = 0;
    while (cmd !== -1 && !msg.eof()) {
        cmd = msg.readUInt8();
        if (cmd & 128) {
            this.parseFastUpdate(cmd & 127, msg);
            continue;
        }

        switch (cmd) {
            case Protocol.serverDisconnect:
                console.log('DISCONNECT!');
                this.demo = null;
                return;
            case Protocol.serverUpdateStat:
                var stat = msg.readUInt8();
                var value = msg.readInt32();
                break;
            case Protocol.serverSetView:
                this.viewEntity = msg.readInt16();
                break;
            case Protocol.serverTime:
                this.time.oldServerTime = this.time.serverTime;
                this.time.serverTime = msg.readFloat();
                break;
            case Protocol.serverSetAngle:
                var x = msg.readInt8() * 1.40625;
                var y = msg.readInt8() * 1.40625;
                var z = msg.readInt8() * 1.40625;
                break;
            case Protocol.serverSound:
                this.parseSound(msg);
                break;
            case Protocol.serverPrint:
                con.print(msg.readCString());
                break;
            case Protocol.serverLightStyle:
                var style = msg.readUInt8();
                var pattern = msg.readCString();
                break;
            case Protocol.serverClientData:
                this.parseClientData(msg);
                break;
            case Protocol.serverUpdateName:
                var client = msg.readUInt8();
                var name = msg.readCString();
                break;
            case Protocol.serverUpdateFrags:
                var client = msg.readUInt8();
                var frags = msg.readInt16();
                break;
            case Protocol.serverUpdateColors:
                var client = msg.readUInt8();
                var colors = msg.readUInt8();
                break;
            case Protocol.serverParticle:
                this.parseParticle(msg);
                break;
            case Protocol.serverStuffText:
                console.log('serverStuffText: ' + msg.readCString());
                break;
            case Protocol.serverTempEntity:
                this.parseTempEntity(msg);
                break;
            case Protocol.serverInfo:
                this.parseServerInfo(msg);
                break;
            case Protocol.serverSignonNum:
                msg.skip(1);
                break;
            case Protocol.serverCdTrack:
                msg.skip(2);
                break;
            case Protocol.serverSpawnStatic:
                this.world.spawnStatic(this.parseBaseline(msg));
                break;
            case Protocol.serverKilledMonster:
                break;
            case Protocol.serverDamage:
                this.parseDamage(msg);
                break;
            case Protocol.serverFoundSecret:
                break;
            case Protocol.serverSpawnBaseline:
                this.world.spawnEntity(msg.readInt16(), this.parseBaseline(msg));
                break;
            case Protocol.serverCenterPrint:
                con.print('CENTER: ' + msg.readCString());
                break;
            case Protocol.serverSpawnStaticSound:
                msg.skip(9);
                break;
            default: throw 'Unknown cmd: ' + cmd;
        }
    }
};

Client.prototype.update = function(time) {
    if (!time) return;

    this.time.oldClientTime = this.time.clientTime;
    this.time.clientTime = time / 1000;

    if (this.time.clientTime > this.time.serverTime)
        this.readFromServer();

    var serverDelta = this.time.serverTime - this.time.oldServerTime || 0.1;
    if (serverDelta > 0.1) {
        this.time.oldServerTime = this.time.serverTime - 0.1;
        serverDelta = 0.1;
    }
    var dt = (this.time.clientTime - this.time.oldServerTime) / serverDelta;
    if (dt > 1.0) dt = 1.0;

    this.world.update(dt);
};

Client.prototype.parseServerInfo = function(msg) {
    msg.skip(6);
    var mapName = msg.readCString();

    while(true) {
        var modelName = msg.readCString();
        if (!modelName) break;
        this.world.loadModel(modelName);
    }
    while(true) {
        var soundName = msg.readCString();
        if (!soundName) break;
        //console.log(soundName);
    }
};

Client.prototype.parseClientData = function(msg) {
    var bits = msg.readInt16();
    if (bits & Protocol.clientViewHeight)
        msg.readUInt8();

    if (bits & Protocol.clientIdealPitch)
        msg.readInt8();

    for (var i = 0; i < 3; i++) {

        if (bits & (Protocol.clientPunch1 << i))
            msg.readInt8();

        if (bits & (Protocol.clientVelocity1 << i))
            msg.readInt8();
    }

    msg.readInt32();

    if (bits & Protocol.clientWeaponFrame)
        msg.readUInt8();

    if (bits & Protocol.clientArmor)
        msg.readUInt8();

    if (bits & Protocol.clientWeapon)
        msg.readUInt8();

    msg.readInt16();
    msg.readUInt8();
    msg.readString(5);
};

Client.prototype.parseFastUpdate = function(cmd, msg) {
    if (cmd & Protocol.fastUpdateMoreBits)
        cmd = cmd | (msg.readUInt8() << 8);

    var entityNo = (cmd & Protocol.fastUpdateLongEntity) ?
        msg.readInt16() : msg.readUInt8();


    // TODO: Move entity fast updates into world.js.
    var entity = this.world.entities[entityNo];
    entity.time = this.time.serverTime;


    if (cmd & Protocol.fastUpdateModel) {
        entity.state.modelIndex = msg.readUInt8();
    }
    if (cmd & Protocol.fastUpdateFrame)
        entity.state.frame = msg.readUInt8();
    //else
    //    entity.state.frame = entity.baseline.frame;

    if (cmd & Protocol.fastUpdateColorMap)
        msg.readUInt8();

    if (cmd & Protocol.fastUpdateSkin)
        msg.readUInt8();
    if (cmd & Protocol.fastUpdateEffects)
        msg.readUInt8();


    for (var i = 0; i < 3; i++) {
        entity.priorState.angles[i] = entity.nextState.angles[i];
        entity.priorState.origin[i] = entity.nextState.origin[i];
    }

    if (cmd & Protocol.fastUpdateOrigin1)
        entity.nextState.origin[0] = msg.readInt16() * 0.125;
    if (cmd & Protocol.fastUpdateAngle1)
        entity.nextState.angles[0] = msg.readInt8() * 1.40625;
    if (cmd & Protocol.fastUpdateOrigin2)
        entity.nextState.origin[1] = msg.readInt16() * 0.125;
    if (cmd & Protocol.fastUpdateAngle2)
        entity.nextState.angles[1] = msg.readInt8() * 1.40625;
    if (cmd & Protocol.fastUpdateOrigin3)
        entity.nextState.origin[2] = msg.readInt16() * 0.125;
    if (cmd & Protocol.fastUpdateAngle3)
        entity.nextState.angles[2] = msg.readInt8() * 1.40625;
};

Client.prototype.parseSound = function(msg) {
    var bits = msg.readUInt8();
    var volume = (bits & Protocol.soundVolume) ? msg.readUInt8() : 255;
    var attenuation = (bits & Protocol.soundAttenuation) ? msg.readUInt8() / 64.0 : 1.0;
    var channel = msg.readInt16();
    var soundIndex = msg.readUInt8();

    var pos = vec3.create();
    pos[0] = msg.readInt16() * 0.125;
    pos[1] = msg.readInt16() * 0.125;
    pos[2] = msg.readInt16() * 0.125;
};

Client.prototype.parseTempEntity = function(msg) {
    var type = msg.readUInt8();
    var pos = vec3.create();
    switch(type) {
        case Protocol.tempGunShot:
        case Protocol.tempWizSpike:
        case Protocol.tempSpike:
        case Protocol.tempSuperSpike:
		case Protocol.tempTeleport:
		case Protocol.tempExplosion:
            pos[0] = msg.readInt16() * 0.125;
            pos[1] = msg.readInt16() * 0.125;
            pos[2] = msg.readInt16() * 0.125;
            break;
		default:
            throw 'Unknown temp. entity encountered: ' + type;
    }
};

Client.prototype.parseDamage = function(msg) {
    var armor = msg.readUInt8();
    var blood = msg.readUInt8();

    var pos = vec3.create();
    pos[0] = msg.readInt16() * 0.125;
    pos[1] = msg.readInt16() * 0.125;
    pos[2] = msg.readInt16() * 0.125;
};

Client.prototype.parseParticle = function(msg) {
    var pos = vec3.create();
    var angles = vec3.create();
    pos[0] = msg.readInt16() * 0.125;
    pos[1] = msg.readInt16() * 0.125;
    pos[2] = msg.readInt16() * 0.125;
    angles[0] = msg.readInt8() * 0.0625;
    angles[1] = msg.readInt8() * 0.0625;
    angles[2] = msg.readInt8() * 0.0625;
    var count = msg.readUInt8();
    var color = msg.readUInt8();
};

Client.prototype.parseBaseline = function(msg) {
    var baseline = {
        modelIndex: msg.readUInt8(),
        frame: msg.readUInt8(),
        colorMap: msg.readUInt8(),
        skin: msg.readUInt8(),
        origin: vec3.create(),
        angles: vec3.create()
    };
    baseline.origin[0] = msg.readInt16() * 0.125;
    baseline.angles[0] = msg.readInt8() * 1.40625;
    baseline.origin[1] = msg.readInt16() * 0.125;
    baseline.angles[1] = msg.readInt8() * 1.40625;
    baseline.origin[2] = msg.readInt16() * 0.125;
    baseline.angles[2] = msg.readInt8() * 1.40625;
    return baseline;
};

module.exports = exports = Client;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/client.js","/")
},{"1YiZ5S":5,"assets":6,"buffer":2,"protocol":31,"ui/console":33,"world":36}],8:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Buffer = require('buffer').Buffer;

var File = function(data) {
    this.buffer = new Buffer(data);
    this.offset = 0;
};

File.prototype.tell = function() {
    return this.offset;
};

File.prototype.seek = function(offset) {
    this.offset = offset;
};

File.prototype.skip = function(bytes) {
    this.offset += bytes;
};

File.prototype.eof = function() {
    return this.offset >= this.buffer.length;
};

File.prototype.slice = function(offset, length) {
    return new File(this.buffer.slice(offset, offset + length));
};

File.prototype.read = function(length) {
    var result = new File(this.buffer.slice(this.offset, this.offset + length));
    this.offset += length;
    return result;
};

File.prototype.readString = function(length) {
    var result = '';
    var terminated = false;
    for (var i = 0; i < length; i++) {
        var byte = this.buffer.readUInt8(this.offset++);
        if (byte === 0x0) terminated = true;
        if (!terminated)
            result += String.fromCharCode(byte);
    }
    return result;
};

File.prototype.readCString = function() {
    var result = '';
    for (var i = 0; i < 128; i++) {
        var byte = this.buffer.readUInt8(this.offset++);
        if (byte === 0x0) return result;
        result += String.fromCharCode(byte);
    }
    return result;
};

File.prototype.readUInt8 = function() {
    return this.buffer.readUInt8(this.offset++);
};

File.prototype.readInt8 = function() {
    return this.buffer.readInt8(this.offset++);
};

File.prototype.readUInt16 = function() {
    var result = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return result;
};

File.prototype.readInt16 = function() {
    var result = this.buffer.readInt16LE(this.offset);
    this.offset += 2;
    return result;
};

File.prototype.readUInt32 = function() {
    var result = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return result;
};

File.prototype.readInt32 = function() {
    var result = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return result;
};

File.prototype.readFloat = function() {
    var result = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return result;
};

module.exports = exports = File;

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/file.js","/")
},{"1YiZ5S":5,"buffer":2}],9:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var Bsp = function(file) {
    var header = {
        version: file.readInt32(),
        entities: {offset: file.readInt32(), size: file.readInt32()},
        planes: {offset: file.readInt32(), size: file.readInt32()},
        miptexs: {offset: file.readInt32(), size: file.readInt32()},
        vertices: {offset: file.readInt32(), size: file.readInt32()},
        visilist: {offset: file.readInt32(), size: file.readInt32()},
        nodes: {offset: file.readInt32(), size: file.readInt32()},
        texinfos: {offset: file.readInt32(), size: file.readInt32()},
        faces: {offset: file.readInt32(), size: file.readInt32()},
        lightmaps: {offset: file.readInt32(), size: file.readInt32()},
        clipnodes: {offset: file.readInt32(), size: file.readInt32()},
        leaves: {offset: file.readInt32(), size: file.readInt32()},
        lfaces: {offset: file.readInt32(), size: file.readInt32()},
        edges: {offset: file.readInt32(), size: file.readInt32()},
        ledges: {offset: file.readInt32(), size: file.readInt32()},
        models: {offset: file.readInt32(), size: file.readInt32()}
    };

    this.loadTextures(file, header.miptexs);
    this.loadTexInfos(file, header.texinfos);
    this.loadLightMaps(file, header.lightmaps);

    this.loadModels(file, header.models);
    this.loadVertices(file, header.vertices);
    this.loadEdges(file, header.edges);
    this.loadSurfaceEdges(file, header.ledges);
    this.loadSurfaces(file, header.faces);
};

Bsp.surfaceFlags = {
    planeBack: 2, drawSky: 4, drawSprite: 8, drawTurb: 16,
    drawTiled: 32, drawBackground: 64, underwater: 128
};

Bsp.prototype.loadVertices = function(file, lump) {
    this.vertexCount = lump.size / 12;
    this.vertices = [];
    file.seek(lump.offset);
    for (var i = 0; i < this.vertexCount; i++) {
        this.vertices.push({
            x: file.readFloat(),
            y: file.readFloat(),
            z: file.readFloat()
        });
    }
};

Bsp.prototype.loadEdges = function(file, lump) {
    var edgeCount = lump.size / 4;
    this.edges = [];
    file.seek(lump.offset);
    for (var i = 0; i < edgeCount * 4; i++)
        this.edges.push(file.readUInt16());
};

Bsp.prototype.loadSurfaceEdges = function(file, lump) {
    var edgeListCount = lump.size / 4;
    this.edgeList = [];
    file.seek(lump.offset);
    for (var i = 0; i < edgeListCount; i++) {
        this.edgeList.push(file.readInt32());
    }
};

Bsp.prototype.calculateSurfaceExtents = function(surface) {
    var minS = 99999;
    var maxS = -99999;
    var minT = 99999;
    var maxT = -99999;

    for (var i = 0; i < surface.edgeCount; i++) {
        var edgeIndex = this.edgeList[surface.edgeStart + i];
        var vi = edgeIndex >= 0 ? this.edges[edgeIndex * 2] : this.edges[-edgeIndex * 2 + 1];
        var v = [this.vertices[vi].x, this.vertices[vi].y, this.vertices[vi].z];
        var texInfo = this.texInfos[surface.texInfoId];

        var s = vec3.dot(v, texInfo.vectorS) + texInfo.distS;
        minS = Math.min(minS, s);
        maxS = Math.max(maxS, s);

        var t = vec3.dot(v, texInfo.vectorT) + texInfo.distT;
        minT = Math.min(minT, t);
        maxT = Math.max(maxT, t);
    }

    /* Convert to ints */
    minS = Math.floor(minS / 16);
    minT = Math.floor(minT / 16);
    maxS = Math.ceil(maxS / 16);
    maxT = Math.ceil(maxT / 16);

    surface.textureMins = [minS * 16, minT * 16];
    surface.extents = [(maxS - minS) * 16, (maxT - minT) * 16];
};

Bsp.prototype.loadSurfaces = function (file, lump) {

    var surfaceCount = lump.size / 20;
    this.surfaces = [];
    file.seek(lump.offset);
    for (var i = 0; i < surfaceCount; i++) {
        var surface = {};
        surface.planeId = file.readUInt16();
        surface.side = file.readUInt16();
        surface.edgeStart = file.readInt32();
        surface.edgeCount = file.readInt16();
        surface.texInfoId = file.readUInt16();

        surface.lightStyles = [file.readUInt8(), file.readUInt8(), file.readUInt8(), file.readUInt8()];
        surface.lightMapOffset = file.readInt32();
        surface.flags = 0;

        this.calculateSurfaceExtents(surface);
        this.surfaces.push(surface);
    }
};

Bsp.prototype.loadTextures = function(file, lump) {
    file.seek(lump.offset);
    var textureCount = file.readInt32();

    this.textures = [];
    for (var i = 0; i < textureCount; i++) {
        var textureOffset = file.readInt32();
        var originalOffset = file.tell();
        file.seek(lump.offset + textureOffset);
        var texture = {
            name: file.readString(16),
            width: file.readUInt32(),
            height: file.readUInt32(),
        };
        var offset = lump.offset + textureOffset + file.readUInt32();
        texture.data = file.slice(offset, texture.width * texture.height);
        this.textures.push(texture);

        file.seek(originalOffset);
    }
};

Bsp.prototype.loadTexInfos = function(file, lump) {
    file.seek(lump.offset);
    var texInfoCount = lump.size / 40;
    this.texInfos = [];
    for (var i = 0; i < texInfoCount; i++) {
        var info = {};
        info.vectorS = [file.readFloat(), file.readFloat(), file.readFloat()];
        info.distS = file.readFloat();
        info.vectorT = [file.readFloat(), file.readFloat(), file.readFloat()];
        info.distT = file.readFloat();
        info.textureId = file.readUInt32();
        info.animated = file.readUInt32() == 1;
        this.texInfos.push(info);
    }
};

Bsp.prototype.loadModels = function(file, lump) {
    file.seek(lump.offset);
    var modelCount = lump.size / 64;
    this.models = [];
    for (var i = 0; i < modelCount; i++) {

        var model = {};
        model.mins = vec3.create([file.readFloat(), file.readFloat(), file.readFloat()]);
        model.maxes = vec3.create([file.readFloat(), file.readFloat(), file.readFloat()]);
        model.origin = vec3.create([file.readFloat(), file.readFloat(), file.readFloat()]);
        model.bspNode = file.readInt32();
        model.clipNode1 = file.readInt32();
        model.clipNode2 = file.readInt32();
        file.readInt32(); // Skip for now.
        model.visLeafs = file.readInt32();
        model.firstSurface = file.readInt32();
        model.surfaceCount = file.readInt32();
        this.models.push(model);
    }
};


Bsp.prototype.loadLightMaps = function (file, lump) {
    file.seek(lump.offset);
    this.lightMaps = [];
    for (var i = 0; i < lump.size; i++)
        this.lightMaps.push(file.readUInt8());
};

module.exports = exports = Bsp;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/formats/bsp.js","/formats")
},{"1YiZ5S":5,"buffer":2}],10:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var Alias = { single: 0, group: 1};

var Mdl = function(name, file) {
    this.name = name;
    this.loadHeader(file);
    this.loadSkins(file);
    this.loadTexCoords(file);
    this.loadFaces(file);
    this.loadFrames(file);
};

Mdl.prototype.loadHeader = function(file) {
    this.id = file.readString(4);
    this.version = file.readUInt32();
    this.scale = vec3.fromValues(file.readFloat(), file.readFloat(), file.readFloat());
    this.origin = vec3.fromValues(file.readFloat(), file.readFloat(), file.readFloat());
    this.radius = file.readFloat();
    this.eyePosition = [file.readFloat(), file.readFloat(), file.readFloat()];
    this.skinCount = file.readInt32();
    this.skinWidth = file.readInt32();
    this.skinHeight = file.readInt32();
    this.vertexCount = file.readInt32();
    this.faceCount = file.readInt32();
    this.frameCount = file.readInt32();
    this.syncType = file.readInt32();
    this.flags = file.readInt32();
    this.averageFaceSize = file.readFloat();
};


Mdl.prototype.loadSkins = function(file) {
    file.seek(0x54); //baseskin offset, where skins start.
    this.skins = [];
    for (var i = 0; i < this.skinCount; i++) {
        var group = file.readInt32();
        if (group !== Alias.single) {
            console.log('Warning: Multiple skins not supported yet.');
        }
        var data = file.read(this.skinWidth * this.skinHeight);

        this.skins.push(data);
    }
};

Mdl.prototype.loadTexCoords = function(file) {
    this.texCoords = [];
    for (var i = 0; i < this.vertexCount; i++) {
        var texCoord = {};
        texCoord.onSeam = file.readInt32() == 0x20;
        texCoord.s = file.readInt32();
        texCoord.t = file.readInt32();
        this.texCoords.push(texCoord);
    }
};

Mdl.prototype.loadFaces = function(file) {
    this.faces = [];
    for (var i = 0; i < this.faceCount; i++) {
        var face = {};
        face.isFrontFace = file.readInt32() == 1;
        face.indices = [file.readInt32(), file.readInt32(), file.readInt32()];
        this.faces.push(face);
    }
    return true;
};

Mdl.prototype.loadFrames = function(file) {
    this.frames = [];
    this.animations = [];
    for (var i = 0; i < this.frameCount; i++) {
        var type = file.readInt32();
        switch (type) {
            case Alias.single:
                if (this.animations.length == 0)
                    this.animations.push({ firstFrame: 0, frameCount: this.frameCount });

                this.frames.push(this.loadSingleFrame(file));
                break;
            case Alias.group:
                var frames = this.loadGroupFrame(file);
                this.animations.push({ firstFrame: this.frames.length, frameCount: frames.length });

                for (var f = 0; f < frames.length; f++)
                    this.frames.push(frames[f]);
                break;
            default:
                console.warn('Warning: Unknown frame type: ' + type + ' found in ' + this.name);
                return false;
        }
    }

    // Reset framecounter to actual full framecount including all flatten groups.
    this.frameCount = this.frames.length;
    return true;
};

Mdl.prototype.loadSingleFrame = function(file) {
    var frame = {};
    frame.type = Alias.single;
    frame.bbox = [
        file.readUInt8(), file.readUInt8(), file.readUInt8(), file.readUInt8(),
        file.readUInt8(), file.readUInt8(), file.readUInt8(), file.readUInt8()
    ];

    frame.name = file.readString(16);
    frame.vertices = [];
    frame.poseCount = 1;
    frame.interval = 0;
    for (var v = 0; v < this.vertexCount; v++) {
        var vertex = [
            this.scale[0] * file.readUInt8() + this.origin[0],
            this.scale[1] * file.readUInt8() + this.origin[1],
            this.scale[2] * file.readUInt8() + this.origin[2]];
        frame.vertices.push([vertex[0], vertex[1], vertex[2]]);
        file.readUInt8(); // Don't care about normal for now
    }
    return frame;
};

Mdl.prototype.loadGroupFrame = function (file) {
    var groupFrame = {};
    groupFrame.type = Alias.group;
    groupFrame.poseCount = file.readUInt32();
    groupFrame.bbox = [
        file.readUInt8(), file.readUInt8(), file.readUInt8(), file.readUInt8(),
        file.readUInt8(), file.readUInt8(), file.readUInt8(), file.readUInt8()
    ];

    var intervals = [];
    for (var i = 0; i < groupFrame.poseCount; i++)
        intervals.push(file.readFloat());

    var frames = [];
    for (var f = 0; f < groupFrame.poseCount; f++) {
        var frame = this.loadSingleFrame(file);
        frame.interval = intervals[i];
        frames.push(frame);
    }
    return frames;
};



module.exports = exports = Mdl;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/formats/mdl.js","/formats")
},{"1YiZ5S":5,"buffer":2}],11:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var File = require('file');
var Wad = require('formats/wad');
var Palette = require('formats/palette');

var Pak = function(data) {
    var file = new File(data);

    if (file.readString(4) !== 'PACK')
        throw 'Error: Corrupt PAK file.';

    var indexOffset = file.readUInt32();
    var indexFileCount = file.readUInt32() / 64;

    file.seek(indexOffset);
    this.index = {};
    for (var i = 0; i < indexFileCount; i++) {
        var path = file.readString(56);
        var offset = file.readUInt32();
        var size = file.readUInt32();
        this.index[path] = { offset: offset, size: size };
    }
    console.log('PAK: Loaded %i entries.', indexFileCount);
    this.file = file;
};

Pak.prototype.load = function(name) {
    var entry = this.index[name];
    if (!entry)
        throw 'Error: Can\'t find entry in PAK: ' + name;
    return this.file.slice(entry.offset, entry.size);
};

module.exports = exports = Pak;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/formats/pak.js","/formats")
},{"1YiZ5S":5,"buffer":2,"file":8,"formats/palette":12,"formats/wad":13}],12:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var Palette = function(file) {
    this.colors = [];
    for (var i = 0; i < 256; i++) {
        this.colors.push({
            r: file.readUInt8(),
            g: file.readUInt8(),
            b: file.readUInt8()
        });
    }
};

Palette.prototype.unpack = function(file, width, height, alpha) {
    var pixels = new Uint8Array(4 * width * height);
    for (var i = 0; i < width * height; i++) {
        var index = file.readUInt8();
        var color = this.colors[index];
        pixels[i*4] = color.r;
        pixels[i*4+1] = color.g;
        pixels[i*4+2] = color.b;
        pixels[i*4+3] = (alpha && !index) ? 0 : 255;
    }
    return pixels;
};

module.exports = exports = Palette;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/formats/palette.js","/formats")
},{"1YiZ5S":5,"buffer":2}],13:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var Wad = function(file) {
    this.lumps = [];
    if (file.readString(4) !== 'WAD2')
        throw 'Error: Corrupt WAD-file encountered.';

    var lumpCount = file.readUInt32();
    var offset = file.readUInt32();

    file.seek(offset);
    var index = [];
    for (var i = 0; i < lumpCount; i++) {
        var offset = file.readUInt32();
        file.skip(4);
        var size = file.readUInt32();
        var type = file.readUInt8();
        file.skip(3);
        var name = file.readString(16);
        index.push({ name: name, offset: offset, size: size });
    }

    this.lumps = {};
    for (var i = 0; i < index.length; i++) {
        var entry = index[i];
        this.lumps[entry.name] = file.slice(entry.offset, entry.size);
    }
    console.log('WAD: Loaded %s lumps.', lumpCount);
};

Wad.prototype.get = function(name) {
    var file = this.lumps[name];
    if (!file)
        throw 'Error: No such entry found in WAD: ' + name;
    return file;
};

module.exports = exports = Wad;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/formats/wad.js","/formats")
},{"1YiZ5S":5,"buffer":2}],14:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var utils = require('utils');

var Texture = function(file, options) {
    var options = options || {};
    options.alpha = options.alpha || false;
    options.format = options.format || gl.RGBA;
    options.type = options.type || gl.UNSIGNED_BYTE;
    options.filter = options.filter || gl.LINEAR;
    options.wrap = options.wrap || gl.CLAMP_TO_EDGE;

    this.id = gl.createTexture();
    this.width = options.width || file.readUInt32();
    this.height = options.height || file.readUInt32();
    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap);

    if (file) {
        if (!options.palette)
            throw 'Error: No palette specified in options.';

        var pixels = options.palette.unpack(file, this.width, this.height, options.alpha);
        var npot = utils.isPowerOf2(this.width) && utils.isPowerOf2(this.height);
        if (!npot && options.wrap === gl.REPEAT) {
            var newWidth = utils.nextPowerOf2(this.width);
            var newHeight = utils.nextPowerOf2(this.height);
            pixels = this.resample(pixels, this.width, this.height, newWidth, newHeight);
            gl.texImage2D(gl.TEXTURE_2D, 0, options.format, newWidth, newHeight,
                0, options.format, options.type, pixels);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, options.format, this.width, this.height,
                0, options.format, options.type, pixels);
        }
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, options.format, this.width, this.height,
            0, options.format, options.type, null);
    }
};

Texture.prototype.drawTo = function (callback) {
    var v = gl.getParameter(gl.VIEWPORT);

    /* Setup shared buffers for render target drawing */
    if (typeof Texture.frameBuffer == 'undefined') {
        Texture.frameBuffer = gl.createFramebuffer();
        Texture.renderBuffer = gl.createRenderbuffer();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, Texture.frameBuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, Texture.renderBuffer);
    if (this.width != Texture.renderBuffer.width || this.height != Texture.renderBuffer.height) {
        Texture.renderBuffer.width = this.width;
        Texture.renderBuffer.height = this.height;
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, Texture.renderBuffer);
    gl.viewport(0, 0, this.width, this.height);

    var ortho = mat4.ortho(mat4.create(), 0, this.width, 0, this.height, -10, 10);
    callback(ortho);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.viewport(v[0], v[1], v[2], v[3]);
};

Texture.prototype.resample = function(pixels, width, height, newWidth, newHeight) {
    var src = document.createElement('canvas');
    src.width = width;
    src.height = height;
    var context = src.getContext('2d');
    var imageData = context.createImageData(width, height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    var dest = document.createElement('canvas');
    dest.width = newWidth;
    dest.height = newHeight;
    context = dest.getContext('2d');
    context.drawImage(src, 0, 0, dest.width, dest.height);
    var image = context.getImageData(0, 0, dest.width, dest.height);
    return new Uint8Array(image.data);
};

Texture.prototype.bind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_2D, this.id);
};

Texture.prototype.unbind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_2D, null);
};

Texture.prototype.asDataUrl = function() {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);

    var width = this.width;
    var height = this.height;

    // Read the contents of the framebuffer
    var data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.deleteFramebuffer(framebuffer);

    // Create a 2D canvas to store the result
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

module.exports = exports = Texture;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/Texture.js","/gl")
},{"1YiZ5S":5,"buffer":2,"utils":35}],15:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Texture = require('gl/texture');

var Atlas = function (width, height) {
    this.width = width || 512;
    this.height = height || 512;
    this.tree = { children: [], x: 0, y: 0, width: width, height: height };
    this.subTextures = [];
    this.texture = null;
};

Atlas.prototype.getSubTexture = function (subTextureId) {
    return this.subTextures[subTextureId];
};

Atlas.prototype.addSubTexture = function (texture) {
    var node = this.getFreeNode(this.tree, texture);
    if (node == null)
        throw 'Error: Unable to pack sub texture! It simply won\'t fit. :/';
    node.texture = texture;
    this.subTextures.push({
        texture: node.texture,
        x: node.x, y: node.y,
        width: node.width, height: node.height,
        s1: node.x / this.tree.width,
        t1: node.y / this.tree.height,
        s2: (node.x + node.width) / this.tree.width,
        t2: (node.y + node.height) / this.tree.height
    });
    return this.subTextures.length - 1;
};

Atlas.prototype.reuseSubTexture = function (s1, t1, s2, t2) {
    this.subTextures.push({ s1: s1, t1: t1, s2: s2, t2: t2 });
};

Atlas.prototype.compile = function(shader) {

    var buffer = new Float32Array(this.subTextures.length * 6 * 5); // x,y,z,s,t
    var width = this.tree.width;
    var height = this.tree.height;
    var offset = 0;
    var subTextures = this.subTextures;
    for (var i = 0; i < subTextures.length; i++) {
        var subTexture = subTextures[i];
        this.addSprite(buffer, offset,
            subTexture.x, subTexture.y,
            subTexture.width, subTexture.height);
        offset += (6 * 5);
    }

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

    var texture = new Texture(null, { width: width, height: height/*, filter: gl.NEAREST */ });
    texture.drawTo(function (projectionMatrix) {
        shader.use();
        gl.enableVertexAttribArray(shader.attributes.vertexAttribute);
        gl.enableVertexAttribArray(shader.attributes.texCoordsAttribute);
        gl.vertexAttribPointer(shader.attributes.vertexAttribute, 3, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(shader.attributes.texCoordsAttribute, 2, gl.FLOAT, false, 20, 12);
        gl.uniformMatrix4fv(shader.uniforms.projectionMatrix, false, projectionMatrix);
        for (var i = 0; i < subTextures.length; i++) {
            var subTexture = subTextures[i];
            if (!subTexture.texture)
                continue;

            gl.bindTexture(gl.TEXTURE_2D, subTexture.texture.id);
            gl.drawArrays(gl.TRIANGLES, i * 6, 6);

            gl.deleteTexture(subTexture.texture.id);
            subTexture.texture = null;
        }
    });
    this.texture = texture;
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(vertexBuffer);
    this.tree = null;
};

Atlas.prototype.addSprite = function (data, offset, x, y, width, height) {
    var z = 0;
    data[offset + 0] = x; data[offset + 1] = y; data[offset + 2] = z;
    data[offset + 3] = 0; data[offset + 4] = 0;
    data[offset + 5] = x + width; data[offset + 6] = y; data[offset + 7] = z;
    data[offset + 8] = 1; data[offset + 9] = 0;
    data[offset + 10] = x + width; data[offset + 11] = y + height; data[offset + 12] = z;
    data[offset + 13] = 1; data[offset + 14] = 1;
    data[offset + 15] = x + width; data[offset + 16] = y + height; data[offset + 17] = z;
    data[offset + 18] = 1; data[offset + 19] = 1;
    data[offset + 20] = x; data[offset + 21] = y + height; data[offset + 22] = z;
    data[offset + 23] = 0; data[offset + 24] = 1;
    data[offset + 25] = x; data[offset + 26] = y; data[offset + 27] = z;
    data[offset + 28] = 0; data[offset + 29] = 0;
};

Atlas.prototype.getFreeNode = function (node, texture) {
    if (node.children[0] || node.children[1]) {
        var result = this.getFreeNode(node.children[0], texture);
        if (result)
            return result;

        return this.getFreeNode(node.children[1], texture);
    }

    if (node.texture)
        return null;
    if (node.width < texture.width || node.height < texture.height)
        return null;
    if (node.width == texture.width && node.height == texture.height)
        return node;

    var dw = node.width - texture.width;
    var dh = node.height - texture.height;

    if (dw > dh) {
        node.children[0] = { children: [null, null],
            x: node.x,
            y: node.y,
            width: texture.width,
            height: node.height
        };
        node.children[1] = { children: [null, null],
            x: node.x + texture.width,
            y: node.y,
            width: node.width - texture.width,
            height: node.height
        };
    } else {
        node.children[0] = { children: [null, null],
            x: node.x,
            y: node.y,
            width: node.width,
            height: texture.height
        };
        node.children[1] = { children: [null, null],
            x: node.x,
            y: node.y + texture.height,
            width: node.width,
            height: node.height - texture.height
        };
    }
    return this.getFreeNode(node.children[0], texture);
};

module.exports = exports = Atlas;

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/atlas.js","/gl")
},{"1YiZ5S":5,"buffer":2,"gl/texture":21}],16:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var Font = function (texture, charWidth, charHeight) {
    this.texture = texture;
    this.charWidth = charWidth || 8;
    this.charHeight = charHeight || 8;
    this.data = new Float32Array(6 * 5 * 4 * 1024); // <= 1024 max characters.
    this.vertexBuffer = gl.createBuffer();
    this.vertexBuffer.name = 'spriteFont';
    this.offset = 0;
    this.elementCount = 0;
};

Font.prototype.addVertex = function(x, y, u, v) {
    this.data[this.offset++] = x;
    this.data[this.offset++] = y;
    this.data[this.offset++] = 0;
    this.data[this.offset++] = u;
    this.data[this.offset++] = v;
};

Font.prototype.drawCharacter = function(x, y, index) {
    if (index == 32 || y < 0 || x < 0 || x > gl.width || y > gl.height)
        return;

    index &= 255;
    var row = index >> 4;
    var column = index & 15;

    var frow = row * 0.0625;
    var fcol = column * 0.0625;
    var size = 0.0625;

    this.addVertex(x, y, fcol, frow);
    this.addVertex(x + this.charWidth, y, fcol + size, frow);
    this.addVertex(x + this.charWidth, y + this.charHeight, fcol + size,  frow + size);
    this.addVertex(x + this.charWidth, y + this.charHeight, fcol + size,  frow + size);
    this.addVertex(x, y + this.charHeight, fcol, frow + size);
    this.addVertex(x, y, fcol, frow);
    this.elementCount += 6;
};

Font.prototype.drawString = function(x, y, str, mode) {
    var offset = mode ? 128 : 0;
    for (var i = 0; i < str.length; i++)
        this.drawCharacter(x + ((i + 1) * this.charWidth), y, str.charCodeAt(i) + offset);
};

Font.prototype.render = function(shader, p) {
    if (!this.elementCount)
        return;

    shader.use();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STREAM_DRAW);
    gl.vertexAttribPointer(shader.attributes.vertexAttribute, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(shader.attributes.texCoordsAttribute, 2, gl.FLOAT, false, 20, 12);
    gl.enableVertexAttribArray(shader.attributes.vertexAttribute);
    gl.enableVertexAttribArray(shader.attributes.texCoordsAttribute);

    gl.uniformMatrix4fv(shader.uniforms.projectionMatrix, false, p);

    gl.bindTexture(gl.TEXTURE_2D, this.texture.id);
    gl.drawArrays(gl.TRIANGLES, 0, this.elementCount);


    this.elementCount = 0;
    this.offset = 0;

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

module.exports = exports = Font;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/font.js","/gl")
},{"1YiZ5S":5,"buffer":2}],17:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var glMatrix = require('lib/gl-matrix-min.js');

var gl = function() {};

gl.init = function(id) {

    var canvas = document.getElementById(id);
    if (!canvas)
        throw 'Error: No canvas element found.';

    var options = {};
    var gl = canvas.getContext('webgl', options);
    if (!gl)
        throw 'Error: No WebGL support found.';
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;


    gl.width = canvas.width;
    gl.height = canvas.height;
    gl.clearColor(0, 0, 0, 1);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthFunc(gl.LEQUAL);
    //gl.cullFace(gl.FRONT);
    gl.viewport(0, 0, gl.width, gl.height);

    window.vec2 = glMatrix.vec2;
    window.vec3 = glMatrix.vec3;
    window.mat4 = glMatrix.mat4;
    window.gl = gl;

    return gl;
};

module.exports = exports = gl;


}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/gl.js","/gl")
},{"1YiZ5S":5,"buffer":2,"lib/gl-matrix-min.js":25}],18:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var LightMap = function(data, offset, width, height) {
    this.width = width;
    this.height = height;
    this.id = gl.createTexture();

    var pixels = new Uint8Array(width * height * 3);
    for (var i = 0; i < width * height; i++) {
        var intensity = data[offset + i];
        intensity = !intensity ? 0 : intensity;
        pixels[i * 3 + 0] = intensity;
        pixels[i * 3 + 1] = intensity;
        pixels[i * 3 + 2] = intensity;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.width, this.height, 0, gl.RGB, gl.UNSIGNED_BYTE, pixels);
};

LightMap.prototype.bind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_2D, this.id);
};

LightMap.prototype.unbind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_2D, null);
};

LightMap.prototype.asDataUrl = function() {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);

    var width = this.width;
    var height = this.height;

    // Read the contents of the framebuffer
    var data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.deleteFramebuffer(framebuffer);

    // Create a 2D canvas to store the result
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

module.exports = exports = LightMap;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/lightmap.js","/gl")
},{"1YiZ5S":5,"buffer":2}],19:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw 'Error: Shader compile error: ' + gl.getShaderInfoLog(shader);
    }
    return shader;
}

var Shader = function(source) {
    var vertexStart = source.indexOf('[vertex]');
    var fragmentStart = source.indexOf('[fragment]');
    if (vertexStart === -1 || fragmentStart === -1)
        throw 'Error: Missing [fragment] and/or [vertex] markers in shader.';

    var vertexSource = source.substring(vertexStart + 8, fragmentStart);
    var fragmentSource = source.substring(fragmentStart + 10);
    this.compile(vertexSource, fragmentSource);
};

Shader.prototype.compile = function(vertexSource, fragmentSource) {
    var program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw 'Error: Shader linking error: ' + gl.getProgramInfoLog(program);

    var sources = vertexSource + fragmentSource;
    var lines = sources.match(/(uniform|attribute)\s+\w+\s+\w+(?=;)/g);
    this.uniforms = {};
    this.attributes = {};
    this.samplers = [];
    for (var i in lines) {
        var tokens = lines[i].split(' ');
        var name = tokens[2];
        var type = tokens[1];
        switch (tokens[0]) {
            case 'attribute':
                var attributeLocation = gl.getAttribLocation(program, name);
                this.attributes[name] = attributeLocation;
                break;
            case 'uniform':
                var location = gl.getUniformLocation(program, name);
                if (type === 'sampler2D')
                    this.samplers.push(location);
                this.uniforms[name] = location;
                break;
            default:
                throw 'Invalid attribute/uniform found: ' + tokens[1];
        }
    }
    this.program = program;
};

Shader.prototype.use = function() {
    gl.useProgram(this.program);
};

module.exports = exports = Shader;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/shader.js","/gl")
},{"1YiZ5S":5,"buffer":2}],20:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Atlas = require('gl/atlas');

var Sprites = function (width, height, spriteCount) {
    this.spriteComponents = 9; // xyz, uv, rgba
    this.spriteVertices = 6;
    this.maxSprites = spriteCount || 128;
    this.textures = new Atlas(width, height);
    this.spriteCount = 0;
    this.data = new Float32Array(this.maxSprites * this.spriteComponents * this.spriteVertices);
    this.vertexBuffer = gl.createBuffer();
    this.dirty = false;
};

Sprites.prototype.drawSprite = function (texture, x, y, width, height, r, g, b, a) {
    var z = 0;
    var data = this.data;
    var offset = this.spriteCount * this.spriteVertices * this.spriteComponents;
    var t = this.textures.getSubTexture(texture);
    width = width || t.width;
    height = height || t.height;

    data[offset + 0] = x;
    data[offset + 1] = y;
    data[offset + 2] = z;
    data[offset + 3] = t.s1;
    data[offset + 4] = t.t1;
    data[offset + 5] = r;
    data[offset + 6] = g;
    data[offset + 7] = b;
    data[offset + 8] = a;

    data[offset + 9] = x + width;
    data[offset + 10] = y;
    data[offset + 11] = z;
    data[offset + 12] = t.s2;
    data[offset + 13] = t.t1;
    data[offset + 14] = r;
    data[offset + 15] = g;
    data[offset + 16] = b;
    data[offset + 17] = a;

    data[offset + 18] = x + width;
    data[offset + 19] = y + height;
    data[offset + 20] = z;
    data[offset + 21] = t.s2;
    data[offset + 22] = t.t2;
    data[offset + 23] = r;
    data[offset + 24] = g;
    data[offset + 25] = b;
    data[offset + 26] = a;

    data[offset + 27] = x + width;
    data[offset + 28] = y + height;
    data[offset + 29] = z;
    data[offset + 30] = t.s2;
    data[offset + 31] = t.t2;
    data[offset + 32] = r;
    data[offset + 33] = g;
    data[offset + 34] = b;
    data[offset + 35] = a;

    data[offset + 36] = x;
    data[offset + 37] = y + height;
    data[offset + 38] = z;
    data[offset + 39] = t.s1;
    data[offset + 40] = t.t2;
    data[offset + 41] = r;
    data[offset + 42] = g;
    data[offset + 43] = b;
    data[offset + 44] = a;

    data[offset + 45] = x;
    data[offset + 46] = y;
    data[offset + 47] = z;
    data[offset + 48] = t.s1;
    data[offset + 49] = t.t1;
    data[offset + 50] = r;
    data[offset + 51] = g;
    data[offset + 52] = b;
    data[offset + 53] = a;

    this.dirty = true;
    return this.spriteCount++;
};

Sprites.prototype.clear = function () {
    this.spriteCount = 0;
};

Sprites.prototype.render = function (shader, p, firstSprite, spriteCount) {
    if (this.spriteCount <= 0)
        return;

    firstSprite = firstSprite || 0;
    spriteCount = spriteCount || this.spriteCount;

    shader.use();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    gl.enableVertexAttribArray(shader.attributes.vertexAttribute);
    gl.enableVertexAttribArray(shader.attributes.texCoordsAttribute);
    gl.enableVertexAttribArray(shader.attributes.colorsAttribute);

    gl.vertexAttribPointer(shader.attributes.vertexAttribute, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(shader.attributes.texCoordsAttribute, 2, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(shader.attributes.colorsAttribute, 4, gl.FLOAT, false, 36, 20);

    gl.uniformMatrix4fv(shader.uniforms.projectionMatrix, false, p);

    if (this.dirty) {
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
        this.dirty = false;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.textures.texture.id);
    gl.drawArrays(gl.TRIANGLES, firstSprite * this.spriteVertices, spriteCount * this.spriteVertices);
};

module.exports = exports = Sprites;

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/sprites.js","/gl")
},{"1YiZ5S":5,"buffer":2,"gl/atlas":15}],21:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var utils = require('utils');

var Texture = function(file, options) {
    var options = options || {};
    options.alpha = options.alpha || false;
    options.format = options.format || gl.RGBA;
    options.type = options.type || gl.UNSIGNED_BYTE;
    options.filter = options.filter || gl.LINEAR;
    options.wrap = options.wrap || gl.CLAMP_TO_EDGE;

    this.id = gl.createTexture();
    this.width = options.width || file.readUInt32();
    this.height = options.height || file.readUInt32();
    gl.bindTexture(gl.TEXTURE_2D, this.id);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrap);

    if (file) {
        if (!options.palette)
            throw 'Error: No palette specified in options.';

        var pixels = options.palette.unpack(file, this.width, this.height, options.alpha);
        var npot = utils.isPowerOf2(this.width) && utils.isPowerOf2(this.height);
        if (!npot && options.wrap === gl.REPEAT) {
            var newWidth = utils.nextPowerOf2(this.width);
            var newHeight = utils.nextPowerOf2(this.height);
            pixels = this.resample(pixels, this.width, this.height, newWidth, newHeight);
            gl.texImage2D(gl.TEXTURE_2D, 0, options.format, newWidth, newHeight,
                0, options.format, options.type, pixels);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, options.format, this.width, this.height,
                0, options.format, options.type, pixels);
        }
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, options.format, this.width, this.height,
            0, options.format, options.type, null);
    }
};

Texture.prototype.drawTo = function (callback) {
    var v = gl.getParameter(gl.VIEWPORT);

    /* Setup shared buffers for render target drawing */
    if (typeof Texture.frameBuffer == 'undefined') {
        Texture.frameBuffer = gl.createFramebuffer();
        Texture.renderBuffer = gl.createRenderbuffer();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, Texture.frameBuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, Texture.renderBuffer);
    if (this.width != Texture.renderBuffer.width || this.height != Texture.renderBuffer.height) {
        Texture.renderBuffer.width = this.width;
        Texture.renderBuffer.height = this.height;
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, Texture.renderBuffer);
    gl.viewport(0, 0, this.width, this.height);

    var ortho = mat4.ortho(mat4.create(), 0, this.width, 0, this.height, -10, 10);
    callback(ortho);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.viewport(v[0], v[1], v[2], v[3]);
};

Texture.prototype.resample = function(pixels, width, height, newWidth, newHeight) {
    var src = document.createElement('canvas');
    src.width = width;
    src.height = height;
    var context = src.getContext('2d');
    var imageData = context.createImageData(width, height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    var dest = document.createElement('canvas');
    dest.width = newWidth;
    dest.height = newHeight;
    context = dest.getContext('2d');
    context.drawImage(src, 0, 0, dest.width, dest.height);
    var image = context.getImageData(0, 0, dest.width, dest.height);
    return new Uint8Array(image.data);
};

Texture.prototype.bind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_2D, this.id);
};

Texture.prototype.unbind = function(unit) {
    gl.activeTexture(gl.TEXTURE0 + (unit || 0));
    gl.bindTexture(gl.TEXTURE_2D, null);
};

Texture.prototype.asDataUrl = function() {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);

    var width = this.width;
    var height = this.height;

    // Read the contents of the framebuffer
    var data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.deleteFramebuffer(framebuffer);

    // Create a 2D canvas to store the result
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

module.exports = exports = Texture;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/gl/texture.js","/gl")
},{"1YiZ5S":5,"buffer":2,"utils":35}],22:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var con = require('ui/console');

var keys = { left: 37, right: 39, up: 38, down: 40, a: 65, z: 90 };

var Input = function(console) {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.flyUp = false;
    this.flyDown = false;
    var self = this;
    document.addEventListener('keydown', function(event) {
        con.input(event.keyCode);
        self.keyDown(event);
    }, true);
    document.addEventListener('keyup',
        function(event) { self.keyUp(event); }, true);
};

Input.prototype.keyDown = function(event) {
    switch (event.keyCode) {
        case keys.left: this.left = true; break;
        case keys.right: this.right = true; break;
        case keys.up: this.up = true; break;
        case keys.down: this.down = true; break;
        case keys.a: this.flyUp = true; break;
        case keys.z: this.flyDown = true; break;
    }
};

Input.prototype.keyUp = function(event) {
    switch (event.keyCode) {
        case keys.left: this.left = false; break;
        case keys.right: this.right = false; break;
        case keys.up: this.up = false; break;
        case keys.down: this.down = false; break;
        case keys.a: this.flyUp = false; break;
        case keys.z: this.flyDown = false; break;
    }
};

module.exports = exports = Input;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/input.js","/")
},{"1YiZ5S":5,"buffer":2,"ui/console":33}],23:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){


var Dialog = function(id) {
    this.id = id;
};

Dialog.prototype.hide = function() {
    var e = document.getElementById(this.id);
    e.style.display = 'none';
};

Dialog.prototype.show = function() {
    var e = document.getElementById(this.id);
    e.style.display = 'block';
};

Dialog.prototype.setCaption = function(text) {
    var caption = document.querySelectorAll('#' + this.id + ' p')[0];
    caption.innerHTML = text;

    var button = document.querySelectorAll('#' + this.id + ' button')[0];
    button.style.display = 'none';
};

Dialog.prototype.error = function(text) {
    var caption = document.querySelectorAll('#' + this.id + ' p')[0];
    caption.innerHTML = text;

    var button = document.querySelectorAll('#' + this.id + ' button')[0];
    button.style.display = 'inline-block';
};

module.exports = exports = Dialog;

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/installer/dialog.js","/installer")
},{"1YiZ5S":5,"buffer":2}],24:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Dialog = require('installer/dialog');
var zip = require('lib/zip.js').zip;
var Lh4 = require('lib/lh4.js');
var assets = require('assets');

var Installer = function() {
    this.dialog = new Dialog('dialog');
    this.isLocal = window.location.hostname.indexOf('localhost') !== -1;
};

Installer.localUrl = 'data/pak0.pak'; //''data/quake106.zip';
Installer.crossOriginProxyUrl = 'http://crossorigin.me/';
Installer.mirrors = [ // TODO: Add more valid quake shareware mirrors.
    'http://www.gamers.org/pub/games/quake/idstuff/quake/quake106.zip'
];

Installer.prototype.error = function(message) {
    this.dialog.error(message);
};

Installer.prototype.download = function(done) {
    this.dialog.setCaption('Downloading shareware version of Quake (quake106.zip)...');
    var url = this.isLocal ?
        Installer.localUrl :
        Installer.crossOriginProxyUrl + Installer.mirrors[0];
    var unpacked = url.indexOf('pak') !== -1;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.responseType = 'arraybuffer';

    var self = this;
    xhr.onreadystatechange = function() {
        self.dialog.setCaption('Download completed. Processing file...', this.readyState);
        xhr.onreadystatechange = null;
    };

    xhr.onload = function(e) {
        if (this.status === 200) {

            if (!unpacked) {
                self.unpack(this.response, done);
            } else {
                self.finalize(new Uint8Array(this.response), done);
            }
        } else {
            self.error('Download failed. Try again.');
        }
    };
    xhr.send();
};

Installer.prototype.unpack = function(response, done) {
    var blob = new Blob([response]);
    var self = this;
    zip.workerScriptsPath = 'js/lib/';
    zip.createReader(new zip.BlobReader(blob), function(reader) {
        reader.getEntries(function(entries) {
            if (entries.length <= 0 || entries[0].filename !== 'resource.1') {
                self.dialog.error('Downloaded archive was corrupt.');
                return;
            }
            var entry = entries[0];
            var writer = new zip.ArrayWriter(entry.uncompressedSize);
            self.dialog.setCaption('Extracting zip resources...');
            entry.getData(writer, function(buffer) {
                self.dialog.setCaption('Extracting lha resources...');
                var lha = new Lh4.LhaReader(new Lh4.LhaArrayReader(buffer));
                var data = lha.extract(3);
                self.finalize(data, done);
            });
        });
    });
};

Installer.prototype.finalize = function(data, done) {
    assets.setPak(data);
    this.dialog.setCaption('Starting up Quake...');
    this.dialog.hide();
    done();
};

Installer.prototype.start = function(done) {
    this.dialog.setCaption("Initiating download...");
    this.dialog.show();
    this.download(done);
};

module.exports = exports = new Installer();






}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/installer/installer.js","/installer")
},{"1YiZ5S":5,"assets":6,"buffer":2,"installer/dialog":23,"lib/lh4.js":26,"lib/zip.js":27}],25:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.2.1
 */
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */
(function(e){"use strict";var t={};typeof exports=="undefined"?typeof define=="function"&&typeof define.amd=="object"&&define.amd?(t.exports={},define(function(){return t.exports})):t.exports=typeof window!="undefined"?window:e:t.exports=exports,function(e){if(!t)var t=1e-6;if(!n)var n=typeof Float32Array!="undefined"?Float32Array:Array;if(!r)var r=Math.random;var i={};i.setMatrixArrayType=function(e){n=e},typeof e!="undefined"&&(e.glMatrix=i);var s=Math.PI/180;i.toRadian=function(e){return e*s};var o={};o.create=function(){var e=new n(2);return e[0]=0,e[1]=0,e},o.clone=function(e){var t=new n(2);return t[0]=e[0],t[1]=e[1],t},o.fromValues=function(e,t){var r=new n(2);return r[0]=e,r[1]=t,r},o.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e},o.set=function(e,t,n){return e[0]=t,e[1]=n,e},o.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e},o.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e},o.sub=o.subtract,o.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e},o.mul=o.multiply,o.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e},o.div=o.divide,o.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e},o.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e},o.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e},o.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e},o.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1];return Math.sqrt(n*n+r*r)},o.dist=o.distance,o.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1];return n*n+r*r},o.sqrDist=o.squaredDistance,o.length=function(e){var t=e[0],n=e[1];return Math.sqrt(t*t+n*n)},o.len=o.length,o.squaredLength=function(e){var t=e[0],n=e[1];return t*t+n*n},o.sqrLen=o.squaredLength,o.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e},o.normalize=function(e,t){var n=t[0],r=t[1],i=n*n+r*r;return i>0&&(i=1/Math.sqrt(i),e[0]=t[0]*i,e[1]=t[1]*i),e},o.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]},o.cross=function(e,t,n){var r=t[0]*n[1]-t[1]*n[0];return e[0]=e[1]=0,e[2]=r,e},o.lerp=function(e,t,n,r){var i=t[0],s=t[1];return e[0]=i+r*(n[0]-i),e[1]=s+r*(n[1]-s),e},o.random=function(e,t){t=t||1;var n=r()*2*Math.PI;return e[0]=Math.cos(n)*t,e[1]=Math.sin(n)*t,e},o.transformMat2=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i,e[1]=n[1]*r+n[3]*i,e},o.transformMat2d=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[2]*i+n[4],e[1]=n[1]*r+n[3]*i+n[5],e},o.transformMat3=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[3]*i+n[6],e[1]=n[1]*r+n[4]*i+n[7],e},o.transformMat4=function(e,t,n){var r=t[0],i=t[1];return e[0]=n[0]*r+n[4]*i+n[12],e[1]=n[1]*r+n[5]*i+n[13],e},o.forEach=function(){var e=o.create();return function(t,n,r,i,s,o){var u,a;n||(n=2),r||(r=0),i?a=Math.min(i*n+r,t.length):a=t.length;for(u=r;u<a;u+=n)e[0]=t[u],e[1]=t[u+1],s(e,e,o),t[u]=e[0],t[u+1]=e[1];return t}}(),o.str=function(e){return"vec2("+e[0]+", "+e[1]+")"},typeof e!="undefined"&&(e.vec2=o);var u={};u.create=function(){var e=new n(3);return e[0]=0,e[1]=0,e[2]=0,e},u.clone=function(e){var t=new n(3);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t},u.fromValues=function(e,t,r){var i=new n(3);return i[0]=e,i[1]=t,i[2]=r,i},u.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e},u.set=function(e,t,n,r){return e[0]=t,e[1]=n,e[2]=r,e},u.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e},u.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e},u.sub=u.subtract,u.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e[2]=t[2]*n[2],e},u.mul=u.multiply,u.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e[2]=t[2]/n[2],e},u.div=u.divide,u.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e[2]=Math.min(t[2],n[2]),e},u.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e[2]=Math.max(t[2],n[2]),e},u.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e},u.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e},u.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2];return Math.sqrt(n*n+r*r+i*i)},u.dist=u.distance,u.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2];return n*n+r*r+i*i},u.sqrDist=u.squaredDistance,u.length=function(e){var t=e[0],n=e[1],r=e[2];return Math.sqrt(t*t+n*n+r*r)},u.len=u.length,u.squaredLength=function(e){var t=e[0],n=e[1],r=e[2];return t*t+n*n+r*r},u.sqrLen=u.squaredLength,u.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e},u.normalize=function(e,t){var n=t[0],r=t[1],i=t[2],s=n*n+r*r+i*i;return s>0&&(s=1/Math.sqrt(s),e[0]=t[0]*s,e[1]=t[1]*s,e[2]=t[2]*s),e},u.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]},u.cross=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=n[0],u=n[1],a=n[2];return e[0]=i*a-s*u,e[1]=s*o-r*a,e[2]=r*u-i*o,e},u.lerp=function(e,t,n,r){var i=t[0],s=t[1],o=t[2];return e[0]=i+r*(n[0]-i),e[1]=s+r*(n[1]-s),e[2]=o+r*(n[2]-o),e},u.random=function(e,t){t=t||1;var n=r()*2*Math.PI,i=r()*2-1,s=Math.sqrt(1-i*i)*t;return e[0]=Math.cos(n)*s,e[1]=Math.sin(n)*s,e[2]=i*t,e},u.transformMat4=function(e,t,n){var r=t[0],i=t[1],s=t[2];return e[0]=n[0]*r+n[4]*i+n[8]*s+n[12],e[1]=n[1]*r+n[5]*i+n[9]*s+n[13],e[2]=n[2]*r+n[6]*i+n[10]*s+n[14],e},u.transformMat3=function(e,t,n){var r=t[0],i=t[1],s=t[2];return e[0]=r*n[0]+i*n[3]+s*n[6],e[1]=r*n[1]+i*n[4]+s*n[7],e[2]=r*n[2]+i*n[5]+s*n[8],e},u.transformQuat=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=n[0],u=n[1],a=n[2],f=n[3],l=f*r+u*s-a*i,c=f*i+a*r-o*s,h=f*s+o*i-u*r,p=-o*r-u*i-a*s;return e[0]=l*f+p*-o+c*-a-h*-u,e[1]=c*f+p*-u+h*-o-l*-a,e[2]=h*f+p*-a+l*-u-c*-o,e},u.rotateX=function(e,t,n,r){var i=[],s=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],s[0]=i[0],s[1]=i[1]*Math.cos(r)-i[2]*Math.sin(r),s[2]=i[1]*Math.sin(r)+i[2]*Math.cos(r),e[0]=s[0]+n[0],e[1]=s[1]+n[1],e[2]=s[2]+n[2],e},u.rotateY=function(e,t,n,r){var i=[],s=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],s[0]=i[2]*Math.sin(r)+i[0]*Math.cos(r),s[1]=i[1],s[2]=i[2]*Math.cos(r)-i[0]*Math.sin(r),e[0]=s[0]+n[0],e[1]=s[1]+n[1],e[2]=s[2]+n[2],e},u.rotateZ=function(e,t,n,r){var i=[],s=[];return i[0]=t[0]-n[0],i[1]=t[1]-n[1],i[2]=t[2]-n[2],s[0]=i[0]*Math.cos(r)-i[1]*Math.sin(r),s[1]=i[0]*Math.sin(r)+i[1]*Math.cos(r),s[2]=i[2],e[0]=s[0]+n[0],e[1]=s[1]+n[1],e[2]=s[2]+n[2],e},u.forEach=function(){var e=u.create();return function(t,n,r,i,s,o){var u,a;n||(n=3),r||(r=0),i?a=Math.min(i*n+r,t.length):a=t.length;for(u=r;u<a;u+=n)e[0]=t[u],e[1]=t[u+1],e[2]=t[u+2],s(e,e,o),t[u]=e[0],t[u+1]=e[1],t[u+2]=e[2];return t}}(),u.str=function(e){return"vec3("+e[0]+", "+e[1]+", "+e[2]+")"},typeof e!="undefined"&&(e.vec3=u);var a={};a.create=function(){var e=new n(4);return e[0]=0,e[1]=0,e[2]=0,e[3]=0,e},a.clone=function(e){var t=new n(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t},a.fromValues=function(e,t,r,i){var s=new n(4);return s[0]=e,s[1]=t,s[2]=r,s[3]=i,s},a.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e},a.set=function(e,t,n,r,i){return e[0]=t,e[1]=n,e[2]=r,e[3]=i,e},a.add=function(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e[3]=t[3]+n[3],e},a.subtract=function(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e[3]=t[3]-n[3],e},a.sub=a.subtract,a.multiply=function(e,t,n){return e[0]=t[0]*n[0],e[1]=t[1]*n[1],e[2]=t[2]*n[2],e[3]=t[3]*n[3],e},a.mul=a.multiply,a.divide=function(e,t,n){return e[0]=t[0]/n[0],e[1]=t[1]/n[1],e[2]=t[2]/n[2],e[3]=t[3]/n[3],e},a.div=a.divide,a.min=function(e,t,n){return e[0]=Math.min(t[0],n[0]),e[1]=Math.min(t[1],n[1]),e[2]=Math.min(t[2],n[2]),e[3]=Math.min(t[3],n[3]),e},a.max=function(e,t,n){return e[0]=Math.max(t[0],n[0]),e[1]=Math.max(t[1],n[1]),e[2]=Math.max(t[2],n[2]),e[3]=Math.max(t[3],n[3]),e},a.scale=function(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e[3]=t[3]*n,e},a.scaleAndAdd=function(e,t,n,r){return e[0]=t[0]+n[0]*r,e[1]=t[1]+n[1]*r,e[2]=t[2]+n[2]*r,e[3]=t[3]+n[3]*r,e},a.distance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2],s=t[3]-e[3];return Math.sqrt(n*n+r*r+i*i+s*s)},a.dist=a.distance,a.squaredDistance=function(e,t){var n=t[0]-e[0],r=t[1]-e[1],i=t[2]-e[2],s=t[3]-e[3];return n*n+r*r+i*i+s*s},a.sqrDist=a.squaredDistance,a.length=function(e){var t=e[0],n=e[1],r=e[2],i=e[3];return Math.sqrt(t*t+n*n+r*r+i*i)},a.len=a.length,a.squaredLength=function(e){var t=e[0],n=e[1],r=e[2],i=e[3];return t*t+n*n+r*r+i*i},a.sqrLen=a.squaredLength,a.negate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=-t[3],e},a.normalize=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n*n+r*r+i*i+s*s;return o>0&&(o=1/Math.sqrt(o),e[0]=t[0]*o,e[1]=t[1]*o,e[2]=t[2]*o,e[3]=t[3]*o),e},a.dot=function(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]+e[3]*t[3]},a.lerp=function(e,t,n,r){var i=t[0],s=t[1],o=t[2],u=t[3];return e[0]=i+r*(n[0]-i),e[1]=s+r*(n[1]-s),e[2]=o+r*(n[2]-o),e[3]=u+r*(n[3]-u),e},a.random=function(e,t){return t=t||1,e[0]=r(),e[1]=r(),e[2]=r(),e[3]=r(),a.normalize(e,e),a.scale(e,e,t),e},a.transformMat4=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3];return e[0]=n[0]*r+n[4]*i+n[8]*s+n[12]*o,e[1]=n[1]*r+n[5]*i+n[9]*s+n[13]*o,e[2]=n[2]*r+n[6]*i+n[10]*s+n[14]*o,e[3]=n[3]*r+n[7]*i+n[11]*s+n[15]*o,e},a.transformQuat=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=n[0],u=n[1],a=n[2],f=n[3],l=f*r+u*s-a*i,c=f*i+a*r-o*s,h=f*s+o*i-u*r,p=-o*r-u*i-a*s;return e[0]=l*f+p*-o+c*-a-h*-u,e[1]=c*f+p*-u+h*-o-l*-a,e[2]=h*f+p*-a+l*-u-c*-o,e},a.forEach=function(){var e=a.create();return function(t,n,r,i,s,o){var u,a;n||(n=4),r||(r=0),i?a=Math.min(i*n+r,t.length):a=t.length;for(u=r;u<a;u+=n)e[0]=t[u],e[1]=t[u+1],e[2]=t[u+2],e[3]=t[u+3],s(e,e,o),t[u]=e[0],t[u+1]=e[1],t[u+2]=e[2],t[u+3]=e[3];return t}}(),a.str=function(e){return"vec4("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+")"},typeof e!="undefined"&&(e.vec4=a);var f={};f.create=function(){var e=new n(4);return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e},f.clone=function(e){var t=new n(4);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t},f.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e},f.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e},f.transpose=function(e,t){if(e===t){var n=t[1];e[1]=t[2],e[2]=n}else e[0]=t[0],e[1]=t[2],e[2]=t[1],e[3]=t[3];return e},f.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n*s-i*r;return o?(o=1/o,e[0]=s*o,e[1]=-r*o,e[2]=-i*o,e[3]=n*o,e):null},f.adjoint=function(e,t){var n=t[0];return e[0]=t[3],e[1]=-t[1],e[2]=-t[2],e[3]=n,e},f.determinant=function(e){return e[0]*e[3]-e[2]*e[1]},f.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=n[0],a=n[1],f=n[2],l=n[3];return e[0]=r*u+s*a,e[1]=i*u+o*a,e[2]=r*f+s*l,e[3]=i*f+o*l,e},f.mul=f.multiply,f.rotate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a+s*u,e[1]=i*a+o*u,e[2]=r*-u+s*a,e[3]=i*-u+o*a,e},f.scale=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=n[0],a=n[1];return e[0]=r*u,e[1]=i*u,e[2]=s*a,e[3]=o*a,e},f.str=function(e){return"mat2("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+")"},f.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2))},f.LDU=function(e,t,n,r){return e[2]=r[2]/r[0],n[0]=r[0],n[1]=r[1],n[3]=r[3]-e[2]*n[1],[e,t,n]},typeof e!="undefined"&&(e.mat2=f);var l={};l.create=function(){var e=new n(6);return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e[4]=0,e[5]=0,e},l.clone=function(e){var t=new n(6);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t},l.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e},l.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=1,e[4]=0,e[5]=0,e},l.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=n*s-r*i;return a?(a=1/a,e[0]=s*a,e[1]=-r*a,e[2]=-i*a,e[3]=n*a,e[4]=(i*u-s*o)*a,e[5]=(r*o-n*u)*a,e):null},l.determinant=function(e){return e[0]*e[3]-e[1]*e[2]},l.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=n[0],l=n[1],c=n[2],h=n[3],p=n[4],d=n[5];return e[0]=r*f+s*l,e[1]=i*f+o*l,e[2]=r*c+s*h,e[3]=i*c+o*h,e[4]=r*p+s*d+u,e[5]=i*p+o*d+a,e},l.mul=l.multiply,l.rotate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=Math.sin(n),l=Math.cos(n);return e[0]=r*l+s*f,e[1]=i*l+o*f,e[2]=r*-f+s*l,e[3]=i*-f+o*l,e[4]=u,e[5]=a,e},l.scale=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=n[0],l=n[1];return e[0]=r*f,e[1]=i*f,e[2]=s*l,e[3]=o*l,e[4]=u,e[5]=a,e},l.translate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=n[0],l=n[1];return e[0]=r,e[1]=i,e[2]=s,e[3]=o,e[4]=r*f+s*l+u,e[5]=i*f+o*l+a,e},l.str=function(e){return"mat2d("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+", "+e[4]+", "+e[5]+")"},l.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2)+Math.pow(e[4],2)+Math.pow(e[5],2)+1)},typeof e!="undefined"&&(e.mat2d=l);var c={};c.create=function(){var e=new n(9);return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e},c.fromMat4=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[4],e[4]=t[5],e[5]=t[6],e[6]=t[8],e[7]=t[9],e[8]=t[10],e},c.clone=function(e){var t=new n(9);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t},c.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e},c.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e},c.transpose=function(e,t){if(e===t){var n=t[1],r=t[2],i=t[5];e[1]=t[3],e[2]=t[6],e[3]=n,e[5]=t[7],e[6]=r,e[7]=i}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8];return e},c.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=l*o-u*f,h=-l*s+u*a,p=f*s-o*a,d=n*c+r*h+i*p;return d?(d=1/d,e[0]=c*d,e[1]=(-l*r+i*f)*d,e[2]=(u*r-i*o)*d,e[3]=h*d,e[4]=(l*n-i*a)*d,e[5]=(-u*n+i*s)*d,e[6]=p*d,e[7]=(-f*n+r*a)*d,e[8]=(o*n-r*s)*d,e):null},c.adjoint=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8];return e[0]=o*l-u*f,e[1]=i*f-r*l,e[2]=r*u-i*o,e[3]=u*a-s*l,e[4]=n*l-i*a,e[5]=i*s-n*u,e[6]=s*f-o*a,e[7]=r*a-n*f,e[8]=n*o-r*s,e},c.determinant=function(e){var t=e[0],n=e[1],r=e[2],i=e[3],s=e[4],o=e[5],u=e[6],a=e[7],f=e[8];return t*(f*s-o*a)+n*(-f*i+o*u)+r*(a*i-s*u)},c.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=n[0],p=n[1],d=n[2],v=n[3],m=n[4],g=n[5],y=n[6],b=n[7],w=n[8];return e[0]=h*r+p*o+d*f,e[1]=h*i+p*u+d*l,e[2]=h*s+p*a+d*c,e[3]=v*r+m*o+g*f,e[4]=v*i+m*u+g*l,e[5]=v*s+m*a+g*c,e[6]=y*r+b*o+w*f,e[7]=y*i+b*u+w*l,e[8]=y*s+b*a+w*c,e},c.mul=c.multiply,c.translate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=n[0],p=n[1];return e[0]=r,e[1]=i,e[2]=s,e[3]=o,e[4]=u,e[5]=a,e[6]=h*r+p*o+f,e[7]=h*i+p*u+l,e[8]=h*s+p*a+c,e},c.rotate=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=Math.sin(n),p=Math.cos(n);return e[0]=p*r+h*o,e[1]=p*i+h*u,e[2]=p*s+h*a,e[3]=p*o-h*r,e[4]=p*u-h*i,e[5]=p*a-h*s,e[6]=f,e[7]=l,e[8]=c,e},c.scale=function(e,t,n){var r=n[0],i=n[1];return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=i*t[3],e[4]=i*t[4],e[5]=i*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e},c.fromMat2d=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=0,e[3]=t[2],e[4]=t[3],e[5]=0,e[6]=t[4],e[7]=t[5],e[8]=1,e},c.fromQuat=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n+n,u=r+r,a=i+i,f=n*o,l=r*o,c=r*u,h=i*o,p=i*u,d=i*a,v=s*o,m=s*u,g=s*a;return e[0]=1-c-d,e[3]=l-g,e[6]=h+m,e[1]=l+g,e[4]=1-f-d,e[7]=p-v,e[2]=h-m,e[5]=p+v,e[8]=1-f-c,e},c.normalFromMat4=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=t[9],h=t[10],p=t[11],d=t[12],v=t[13],m=t[14],g=t[15],y=n*u-r*o,b=n*a-i*o,w=n*f-s*o,E=r*a-i*u,S=r*f-s*u,x=i*f-s*a,T=l*v-c*d,N=l*m-h*d,C=l*g-p*d,k=c*m-h*v,L=c*g-p*v,A=h*g-p*m,O=y*A-b*L+w*k+E*C-S*N+x*T;return O?(O=1/O,e[0]=(u*A-a*L+f*k)*O,e[1]=(a*C-o*A-f*N)*O,e[2]=(o*L-u*C+f*T)*O,e[3]=(i*L-r*A-s*k)*O,e[4]=(n*A-i*C+s*N)*O,e[5]=(r*C-n*L-s*T)*O,e[6]=(v*x-m*S+g*E)*O,e[7]=(m*w-d*x-g*b)*O,e[8]=(d*S-v*w+g*y)*O,e):null},c.str=function(e){return"mat3("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+", "+e[4]+", "+e[5]+", "+e[6]+", "+e[7]+", "+e[8]+")"},c.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2)+Math.pow(e[4],2)+Math.pow(e[5],2)+Math.pow(e[6],2)+Math.pow(e[7],2)+Math.pow(e[8],2))},typeof e!="undefined"&&(e.mat3=c);var h={};h.create=function(){var e=new n(16);return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},h.clone=function(e){var t=new n(16);return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],t},h.copy=function(e,t){return e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},h.identity=function(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},h.transpose=function(e,t){if(e===t){var n=t[1],r=t[2],i=t[3],s=t[6],o=t[7],u=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=s,e[11]=t[14],e[12]=i,e[13]=o,e[14]=u}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e},h.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=t[9],h=t[10],p=t[11],d=t[12],v=t[13],m=t[14],g=t[15],y=n*u-r*o,b=n*a-i*o,w=n*f-s*o,E=r*a-i*u,S=r*f-s*u,x=i*f-s*a,T=l*v-c*d,N=l*m-h*d,C=l*g-p*d,k=c*m-h*v,L=c*g-p*v,A=h*g-p*m,O=y*A-b*L+w*k+E*C-S*N+x*T;return O?(O=1/O,e[0]=(u*A-a*L+f*k)*O,e[1]=(i*L-r*A-s*k)*O,e[2]=(v*x-m*S+g*E)*O,e[3]=(h*S-c*x-p*E)*O,e[4]=(a*C-o*A-f*N)*O,e[5]=(n*A-i*C+s*N)*O,e[6]=(m*w-d*x-g*b)*O,e[7]=(l*x-h*w+p*b)*O,e[8]=(o*L-u*C+f*T)*O,e[9]=(r*C-n*L-s*T)*O,e[10]=(d*S-v*w+g*y)*O,e[11]=(c*w-l*S-p*y)*O,e[12]=(u*N-o*k-a*T)*O,e[13]=(n*k-r*N+i*T)*O,e[14]=(v*b-d*E-m*y)*O,e[15]=(l*E-c*b+h*y)*O,e):null},h.adjoint=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=t[4],u=t[5],a=t[6],f=t[7],l=t[8],c=t[9],h=t[10],p=t[11],d=t[12],v=t[13],m=t[14],g=t[15];return e[0]=u*(h*g-p*m)-c*(a*g-f*m)+v*(a*p-f*h),e[1]=-(r*(h*g-p*m)-c*(i*g-s*m)+v*(i*p-s*h)),e[2]=r*(a*g-f*m)-u*(i*g-s*m)+v*(i*f-s*a),e[3]=-(r*(a*p-f*h)-u*(i*p-s*h)+c*(i*f-s*a)),e[4]=-(o*(h*g-p*m)-l*(a*g-f*m)+d*(a*p-f*h)),e[5]=n*(h*g-p*m)-l*(i*g-s*m)+d*(i*p-s*h),e[6]=-(n*(a*g-f*m)-o*(i*g-s*m)+d*(i*f-s*a)),e[7]=n*(a*p-f*h)-o*(i*p-s*h)+l*(i*f-s*a),e[8]=o*(c*g-p*v)-l*(u*g-f*v)+d*(u*p-f*c),e[9]=-(n*(c*g-p*v)-l*(r*g-s*v)+d*(r*p-s*c)),e[10]=n*(u*g-f*v)-o*(r*g-s*v)+d*(r*f-s*u),e[11]=-(n*(u*p-f*c)-o*(r*p-s*c)+l*(r*f-s*u)),e[12]=-(o*(c*m-h*v)-l*(u*m-a*v)+d*(u*h-a*c)),e[13]=n*(c*m-h*v)-l*(r*m-i*v)+d*(r*h-i*c),e[14]=-(n*(u*m-a*v)-o*(r*m-i*v)+d*(r*a-i*u)),e[15]=n*(u*h-a*c)-o*(r*h-i*c)+l*(r*a-i*u),e},h.determinant=function(e){var t=e[0],n=e[1],r=e[2],i=e[3],s=e[4],o=e[5],u=e[6],a=e[7],f=e[8],l=e[9],c=e[10],h=e[11],p=e[12],d=e[13],v=e[14],m=e[15],g=t*o-n*s,y=t*u-r*s,b=t*a-i*s,w=n*u-r*o,E=n*a-i*o,S=r*a-i*u,x=f*d-l*p,T=f*v-c*p,N=f*m-h*p,C=l*v-c*d,k=l*m-h*d,L=c*m-h*v;return g*L-y*k+b*C+w*N-E*T+S*x},h.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=t[4],a=t[5],f=t[6],l=t[7],c=t[8],h=t[9],p=t[10],d=t[11],v=t[12],m=t[13],g=t[14],y=t[15],b=n[0],w=n[1],E=n[2],S=n[3];return e[0]=b*r+w*u+E*c+S*v,e[1]=b*i+w*a+E*h+S*m,e[2]=b*s+w*f+E*p+S*g,e[3]=b*o+w*l+E*d+S*y,b=n[4],w=n[5],E=n[6],S=n[7],e[4]=b*r+w*u+E*c+S*v,e[5]=b*i+w*a+E*h+S*m,e[6]=b*s+w*f+E*p+S*g,e[7]=b*o+w*l+E*d+S*y,b=n[8],w=n[9],E=n[10],S=n[11],e[8]=b*r+w*u+E*c+S*v,e[9]=b*i+w*a+E*h+S*m,e[10]=b*s+w*f+E*p+S*g,e[11]=b*o+w*l+E*d+S*y,b=n[12],w=n[13],E=n[14],S=n[15],e[12]=b*r+w*u+E*c+S*v,e[13]=b*i+w*a+E*h+S*m,e[14]=b*s+w*f+E*p+S*g,e[15]=b*o+w*l+E*d+S*y,e},h.mul=h.multiply,h.translate=function(e,t,n){var r=n[0],i=n[1],s=n[2],o,u,a,f,l,c,h,p,d,v,m,g;return t===e?(e[12]=t[0]*r+t[4]*i+t[8]*s+t[12],e[13]=t[1]*r+t[5]*i+t[9]*s+t[13],e[14]=t[2]*r+t[6]*i+t[10]*s+t[14],e[15]=t[3]*r+t[7]*i+t[11]*s+t[15]):(o=t[0],u=t[1],a=t[2],f=t[3],l=t[4],c=t[5],h=t[6],p=t[7],d=t[8],v=t[9],m=t[10],g=t[11],e[0]=o,e[1]=u,e[2]=a,e[3]=f,e[4]=l,e[5]=c,e[6]=h,e[7]=p,e[8]=d,e[9]=v,e[10]=m,e[11]=g,e[12]=o*r+l*i+d*s+t[12],e[13]=u*r+c*i+v*s+t[13],e[14]=a*r+h*i+m*s+t[14],e[15]=f*r+p*i+g*s+t[15]),e},h.scale=function(e,t,n){var r=n[0],i=n[1],s=n[2];return e[0]=t[0]*r,e[1]=t[1]*r,e[2]=t[2]*r,e[3]=t[3]*r,e[4]=t[4]*i,e[5]=t[5]*i,e[6]=t[6]*i,e[7]=t[7]*i,e[8]=t[8]*s,e[9]=t[9]*s,e[10]=t[10]*s,e[11]=t[11]*s,e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15],e},h.rotate=function(e,n,r,i){var s=i[0],o=i[1],u=i[2],a=Math.sqrt(s*s+o*o+u*u),f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,C,k,L,A,O,M,_;return Math.abs(a)<t?null:(a=1/a,s*=a,o*=a,u*=a,f=Math.sin(r),l=Math.cos(r),c=1-l,h=n[0],p=n[1],d=n[2],v=n[3],m=n[4],g=n[5],y=n[6],b=n[7],w=n[8],E=n[9],S=n[10],x=n[11],T=s*s*c+l,N=o*s*c+u*f,C=u*s*c-o*f,k=s*o*c-u*f,L=o*o*c+l,A=u*o*c+s*f,O=s*u*c+o*f,M=o*u*c-s*f,_=u*u*c+l,e[0]=h*T+m*N+w*C,e[1]=p*T+g*N+E*C,e[2]=d*T+y*N+S*C,e[3]=v*T+b*N+x*C,e[4]=h*k+m*L+w*A,e[5]=p*k+g*L+E*A,e[6]=d*k+y*L+S*A,e[7]=v*k+b*L+x*A,e[8]=h*O+m*M+w*_,e[9]=p*O+g*M+E*_,e[10]=d*O+y*M+S*_,e[11]=v*O+b*M+x*_,n!==e&&(e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15]),e)},h.rotateX=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),s=t[4],o=t[5],u=t[6],a=t[7],f=t[8],l=t[9],c=t[10],h=t[11];return t!==e&&(e[0]=t[0],e[1]=t[1],e[2]=t[2],e[3]=t[3],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[4]=s*i+f*r,e[5]=o*i+l*r,e[6]=u*i+c*r,e[7]=a*i+h*r,e[8]=f*i-s*r,e[9]=l*i-o*r,e[10]=c*i-u*r,e[11]=h*i-a*r,e},h.rotateY=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),s=t[0],o=t[1],u=t[2],a=t[3],f=t[8],l=t[9],c=t[10],h=t[11];return t!==e&&(e[4]=t[4],e[5]=t[5],e[6]=t[6],e[7]=t[7],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=s*i-f*r,e[1]=o*i-l*r,e[2]=u*i-c*r,e[3]=a*i-h*r,e[8]=s*r+f*i,e[9]=o*r+l*i,e[10]=u*r+c*i,e[11]=a*r+h*i,e},h.rotateZ=function(e,t,n){var r=Math.sin(n),i=Math.cos(n),s=t[0],o=t[1],u=t[2],a=t[3],f=t[4],l=t[5],c=t[6],h=t[7];return t!==e&&(e[8]=t[8],e[9]=t[9],e[10]=t[10],e[11]=t[11],e[12]=t[12],e[13]=t[13],e[14]=t[14],e[15]=t[15]),e[0]=s*i+f*r,e[1]=o*i+l*r,e[2]=u*i+c*r,e[3]=a*i+h*r,e[4]=f*i-s*r,e[5]=l*i-o*r,e[6]=c*i-u*r,e[7]=h*i-a*r,e},h.fromRotationTranslation=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=r+r,a=i+i,f=s+s,l=r*u,c=r*a,h=r*f,p=i*a,d=i*f,v=s*f,m=o*u,g=o*a,y=o*f;return e[0]=1-(p+v),e[1]=c+y,e[2]=h-g,e[3]=0,e[4]=c-y,e[5]=1-(l+v),e[6]=d+m,e[7]=0,e[8]=h+g,e[9]=d-m,e[10]=1-(l+p),e[11]=0,e[12]=n[0],e[13]=n[1],e[14]=n[2],e[15]=1,e},h.fromQuat=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n+n,u=r+r,a=i+i,f=n*o,l=r*o,c=r*u,h=i*o,p=i*u,d=i*a,v=s*o,m=s*u,g=s*a;return e[0]=1-c-d,e[1]=l+g,e[2]=h-m,e[3]=0,e[4]=l-g,e[5]=1-f-d,e[6]=p+v,e[7]=0,e[8]=h+m,e[9]=p-v,e[10]=1-f-c,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e},h.frustum=function(e,t,n,r,i,s,o){var u=1/(n-t),a=1/(i-r),f=1/(s-o);return e[0]=s*2*u,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s*2*a,e[6]=0,e[7]=0,e[8]=(n+t)*u,e[9]=(i+r)*a,e[10]=(o+s)*f,e[11]=-1,e[12]=0,e[13]=0,e[14]=o*s*2*f,e[15]=0,e},h.perspective=function(e,t,n,r,i){var s=1/Math.tan(t/2),o=1/(r-i);return e[0]=s/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=(i+r)*o,e[11]=-1,e[12]=0,e[13]=0,e[14]=2*i*r*o,e[15]=0,e},h.ortho=function(e,t,n,r,i,s,o){var u=1/(t-n),a=1/(r-i),f=1/(s-o);return e[0]=-2*u,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*f,e[11]=0,e[12]=(t+n)*u,e[13]=(i+r)*a,e[14]=(o+s)*f,e[15]=1,e},h.lookAt=function(e,n,r,i){var s,o,u,a,f,l,c,p,d,v,m=n[0],g=n[1],y=n[2],b=i[0],w=i[1],E=i[2],S=r[0],x=r[1],T=r[2];return Math.abs(m-S)<t&&Math.abs(g-x)<t&&Math.abs(y-T)<t?h.identity(e):(c=m-S,p=g-x,d=y-T,v=1/Math.sqrt(c*c+p*p+d*d),c*=v,p*=v,d*=v,s=w*d-E*p,o=E*c-b*d,u=b*p-w*c,v=Math.sqrt(s*s+o*o+u*u),v?(v=1/v,s*=v,o*=v,u*=v):(s=0,o=0,u=0),a=p*u-d*o,f=d*s-c*u,l=c*o-p*s,v=Math.sqrt(a*a+f*f+l*l),v?(v=1/v,a*=v,f*=v,l*=v):(a=0,f=0,l=0),e[0]=s,e[1]=a,e[2]=c,e[3]=0,e[4]=o,e[5]=f,e[6]=p,e[7]=0,e[8]=u,e[9]=l,e[10]=d,e[11]=0,e[12]=-(s*m+o*g+u*y),e[13]=-(a*m+f*g+l*y),e[14]=-(c*m+p*g+d*y),e[15]=1,e)},h.str=function(e){return"mat4("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+", "+e[4]+", "+e[5]+", "+e[6]+", "+e[7]+", "+e[8]+", "+e[9]+", "+e[10]+", "+e[11]+", "+e[12]+", "+e[13]+", "+e[14]+", "+e[15]+")"},h.frob=function(e){return Math.sqrt(Math.pow(e[0],2)+Math.pow(e[1],2)+Math.pow(e[2],2)+Math.pow(e[3],2)+Math.pow(e[4],2)+Math.pow(e[5],2)+Math.pow(e[6],2)+Math.pow(e[6],2)+Math.pow(e[7],2)+Math.pow(e[8],2)+Math.pow(e[9],2)+Math.pow(e[10],2)+Math.pow(e[11],2)+Math.pow(e[12],2)+Math.pow(e[13],2)+Math.pow(e[14],2)+Math.pow(e[15],2))},typeof e!="undefined"&&(e.mat4=h);var p={};p.create=function(){var e=new n(4);return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e},p.rotationTo=function(){var e=u.create(),t=u.fromValues(1,0,0),n=u.fromValues(0,1,0);return function(r,i,s){var o=u.dot(i,s);return o<-0.999999?(u.cross(e,t,i),u.length(e)<1e-6&&u.cross(e,n,i),u.normalize(e,e),p.setAxisAngle(r,e,Math.PI),r):o>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(u.cross(e,i,s),r[0]=e[0],r[1]=e[1],r[2]=e[2],r[3]=1+o,p.normalize(r,r))}}(),p.setAxes=function(){var e=c.create();return function(t,n,r,i){return e[0]=r[0],e[3]=r[1],e[6]=r[2],e[1]=i[0],e[4]=i[1],e[7]=i[2],e[2]=-n[0],e[5]=-n[1],e[8]=-n[2],p.normalize(t,p.fromMat3(t,e))}}(),p.clone=a.clone,p.fromValues=a.fromValues,p.copy=a.copy,p.set=a.set,p.identity=function(e){return e[0]=0,e[1]=0,e[2]=0,e[3]=1,e},p.setAxisAngle=function(e,t,n){n*=.5;var r=Math.sin(n);return e[0]=r*t[0],e[1]=r*t[1],e[2]=r*t[2],e[3]=Math.cos(n),e},p.add=a.add,p.multiply=function(e,t,n){var r=t[0],i=t[1],s=t[2],o=t[3],u=n[0],a=n[1],f=n[2],l=n[3];return e[0]=r*l+o*u+i*f-s*a,e[1]=i*l+o*a+s*u-r*f,e[2]=s*l+o*f+r*a-i*u,e[3]=o*l-r*u-i*a-s*f,e},p.mul=p.multiply,p.scale=a.scale,p.rotateX=function(e,t,n){n*=.5;var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a+o*u,e[1]=i*a+s*u,e[2]=s*a-i*u,e[3]=o*a-r*u,e},p.rotateY=function(e,t,n){n*=.5;var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a-s*u,e[1]=i*a+o*u,e[2]=s*a+r*u,e[3]=o*a-i*u,e},p.rotateZ=function(e,t,n){n*=.5;var r=t[0],i=t[1],s=t[2],o=t[3],u=Math.sin(n),a=Math.cos(n);return e[0]=r*a+i*u,e[1]=i*a-r*u,e[2]=s*a+o*u,e[3]=o*a-s*u,e},p.calculateW=function(e,t){var n=t[0],r=t[1],i=t[2];return e[0]=n,e[1]=r,e[2]=i,e[3]=-Math.sqrt(Math.abs(1-n*n-r*r-i*i)),e},p.dot=a.dot,p.lerp=a.lerp,p.slerp=function(e,t,n,r){var i=t[0],s=t[1],o=t[2],u=t[3],a=n[0],f=n[1],l=n[2],c=n[3],h,p,d,v,m;return p=i*a+s*f+o*l+u*c,p<0&&(p=-p,a=-a,f=-f,l=-l,c=-c),1-p>1e-6?(h=Math.acos(p),d=Math.sin(h),v=Math.sin((1-r)*h)/d,m=Math.sin(r*h)/d):(v=1-r,m=r),e[0]=v*i+m*a,e[1]=v*s+m*f,e[2]=v*o+m*l,e[3]=v*u+m*c,e},p.invert=function(e,t){var n=t[0],r=t[1],i=t[2],s=t[3],o=n*n+r*r+i*i+s*s,u=o?1/o:0;return e[0]=-n*u,e[1]=-r*u,e[2]=-i*u,e[3]=s*u,e},p.conjugate=function(e,t){return e[0]=-t[0],e[1]=-t[1],e[2]=-t[2],e[3]=t[3],e},p.length=a.length,p.len=p.length,p.squaredLength=a.squaredLength,p.sqrLen=p.squaredLength,p.normalize=a.normalize,p.fromMat3=function(e,t){var n=t[0]+t[4]+t[8],r;if(n>0)r=Math.sqrt(n+1),e[3]=.5*r,r=.5/r,e[0]=(t[7]-t[5])*r,e[1]=(t[2]-t[6])*r,e[2]=(t[3]-t[1])*r;else{var i=0;t[4]>t[0]&&(i=1),t[8]>t[i*3+i]&&(i=2);var s=(i+1)%3,o=(i+2)%3;r=Math.sqrt(t[i*3+i]-t[s*3+s]-t[o*3+o]+1),e[i]=.5*r,r=.5/r,e[3]=(t[o*3+s]-t[s*3+o])*r,e[s]=(t[s*3+i]+t[i*3+s])*r,e[o]=(t[o*3+i]+t[i*3+o])*r}return e},p.str=function(e){return"quat("+e[0]+", "+e[1]+", "+e[2]+", "+e[3]+")"},typeof e!="undefined"&&(e.quat=p)}(t.exports)})(this);
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/lib/gl-matrix-min.js","/lib")
},{"1YiZ5S":5,"buffer":2}],26:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// LH4, LHA (-lh4-) extractor, no crc/sum-checks. Will extract SFX-archives as well.
// Erland Ranvinge (erland.ranvinge@gmail.com)
// Based on a mix of Nobuyasu Suehiro's Java implementation and Simon Howard's C version.

var LhaArrayReader = function(buffer) {
    this.buffer = buffer;
    this.offset = 0;
    this.subOffset = 7;
};
LhaArrayReader.SeekAbsolute = 0;
LhaArrayReader.SeekRelative = 1;

LhaArrayReader.prototype.readBits = function(bits) {
    var bitMasks = [1, 2, 4, 8, 16, 32, 64, 128];
    var byte = this.buffer[this.offset];
    var result = 0;

    for (var bitIndex = 0; bitIndex < bits; bitIndex++) {
        var bit = (byte & bitMasks[this.subOffset]) >> this.subOffset;
        result <<= 1;
        result = result | bit;
        this.subOffset--;
        if (this.subOffset < 0) {
            if (this.offset + 1 >= this.buffer.length)
                return -1;

            byte = this.buffer[++this.offset];
            this.subOffset = 7;
        }
    }
    return result;
};

LhaArrayReader.prototype.readUInt8 = function() {
    if (this.offset + 1 >= this.buffer.length)
        return -1;
    return this.buffer[this.offset++];
};
LhaArrayReader.prototype.readUInt16 = function() {
    if (this.offset + 2 >= this.buffer.length)
        return -1;
    var value =
        (this.buffer[this.offset] & 0xFF) |
        ((this.buffer[this.offset+1] << 8) & 0xFF00);
    this.offset += 2;
    return value;
};
LhaArrayReader.prototype.readUInt32 = function() {
    if (this.offset + 4 >= this.buffer.length)
        return -1;
    var value =
        (this.buffer[this.offset] & 0xFF) |
        ((this.buffer[this.offset+1] << 8) & 0xFF00) |
        ((this.buffer[this.offset+2] << 16) & 0xFF0000) |
        ((this.buffer[this.offset+3] << 24) & 0xFF000000);
    this.offset += 4;
    return value;
};
LhaArrayReader.prototype.readString = function(size) {
    if (this.offset + size >= this.buffer.length)
        return -1;
    var result = '';
    for (var i = 0; i < size; i++)
        result += String.fromCharCode(this.buffer[this.offset++]);
    return result;
};

LhaArrayReader.prototype.readLength = function() {
    var length = this.readBits(3);
    if (length == -1)
        return -1;

    if (length == 7) {
        while (this.readBits(1) != 0) {
            length++;
        }
    }
    return length;
};
LhaArrayReader.prototype.seek = function(offset, mode) {
    switch (mode) {
        case LhaArrayReader.SeekAbsolute:
            this.offset = offset;
            this.subOffset = 7;
            break;
        case LhaArrayReader.SeekRelative:
            this.offset += offset;
            this.subOffset = 7;
            break;
    }
};
LhaArrayReader.prototype.getPosition = function() {
    return this.offset;
};

var LhaArrayWriter = function(size) {
    this.offset = 0;
    this.size = size;
    this.data = new Uint8Array(size);
};

LhaArrayWriter.prototype.write = function(data) {
    this.data[this.offset++] = data;
};

var LhaTree = function() {};
LhaTree.LEAF = 1 << 15;

LhaTree.prototype.setConstant = function(code) {
    this.tree[0] = code | LhaTree.LEAF;
};

LhaTree.prototype.expand = function() {
    var endOffset = this.allocated;
    while (this.nextEntry < endOffset) {
        this.tree[this.nextEntry] = this.allocated;
        this.allocated += 2;
        this.nextEntry++;
    }
};

LhaTree.prototype.addCodesWithLength = function(codeLengths, codeLength) {
    var done = true;
    for (var i = 0; i < codeLengths.length; i++) {
        if (codeLengths[i] == codeLength) {
            var node = this.nextEntry++;
            this.tree[node] = i | LhaTree.LEAF;
        } else if (codeLengths[i] > codeLength) {
            done = false;
        }
    }
    return done;
};

LhaTree.prototype.build = function(codeLengths, size) {
    this.tree = [];
    for (var i = 0; i < size; i++)
        this.tree[i] = LhaTree.LEAF;

    this.nextEntry = 0;
    this.allocated = 1;
    var codeLength = 0;
    do {
        this.expand();
        codeLength++;
    } while (!this.addCodesWithLength(codeLengths, codeLength));
};

LhaTree.prototype.readCode = function(reader) {
    var code = this.tree[0];
    while ((code & LhaTree.LEAF) == 0) {
        var bit = reader.readBits(1);
        code = this.tree[code + bit];
    }
    return code & ~LhaTree.LEAF;
};

var LhaRingBuffer = function(size) {
    this.data = [];
    this.size = size;
    this.offset = 0;
};

LhaRingBuffer.prototype.add = function(value) {
    this.data[this.offset] = value;
    this.offset = (this.offset + 1) % this.size;
};

LhaRingBuffer.prototype.get = function(offset, length) {
    var pos = this.offset + this.size - offset - 1;
    var result = [];
    for (var i = 0; i < length; i++) {
        var code = this.data[(pos + i) % this.size];
        result.push(code);
        this.add(code);
    }
    return result;
};

var LhaReader = function(reader) {
    this.reader = reader;
    this.offsetTree = new LhaTree();
    this.codeTree = new LhaTree();
    this.ringBuffer = new LhaRingBuffer(1 << 13); // lh4 specific.
    this.entries = {};

    if (reader.readString(2) == 'MZ') { // Check for SFX header, and skip it if it exists.
        var lastBlockSize = reader.readUInt16();
        var blockCount = reader.readUInt16();
        var offset = (blockCount - 1) * 512 + (lastBlockSize != 0 ? lastBlockSize : 512);
        reader.seek(offset, LhaArrayReader.SeekAbsolute);
    } else {
        reader.seek(0, LhaArrayReader.SeekAbsolute);
    }

    for (;;) {
        var header = {};
        header.size = reader.readUInt8();
        if (header.size <= 0)
            break;

        header.checksum = reader.readUInt8();
        header.id = reader.readString(5);
        header.packedSize = reader.readUInt32();
        header.originalSize = reader.readUInt32();
        header.datetime = reader.readUInt32();
        header.attributes = reader.readUInt16();
        var filenameSize = reader.readUInt8();
        header.filename = reader.readString(filenameSize).toLowerCase();
        header.crc = reader.readUInt16();
        header.offset = reader.getPosition();
        this.entries[header.filename] = header;
        reader.seek(header.packedSize, LhaArrayReader.SeekRelative);
    }
};

LhaReader.prototype.readTempTable = function () {
    var reader = this.reader;
    var codeCount = Math.min(reader.readBits(5), 19);
    if (codeCount <= 0) {
        var constant = reader.readBits(5);
        this.offsetTree.setConstant(constant);
        return;
    }
    var codeLengths = [];
    for (var i = 0; i < codeCount; i++) {
        var codeLength = reader.readLength();
        codeLengths.push(codeLength);
        if (i == 2) { // The dreaded special bit that no-one (including me) seems to understand.
            var length = reader.readBits(2);
            while (length-- > 0) {
                codeLengths.push(0);
                i++;
            }
        }
    }
    this.offsetTree.build(codeLengths, 19 * 2);
};

LhaReader.prototype.readCodeTable = function() {
    var reader = this.reader;
    var codeCount = Math.min(reader.readBits(9), 510);
    if (codeCount <= 0) {
        var constant = reader.readBits(9);
        this.codeTree.setConstant(constant);
        return;
    }

    var codeLengths = [];
    for (var i = 0; i < codeCount; ) {
        var code = this.offsetTree.readCode(reader);
        if (code <= 2) {
            var skip = 1;
            if (code == 1)
                skip = reader.readBits(4) + 3;
            else if (code == 2)
                skip = reader.readBits(9) + 20;
            while (--skip >= 0) {
                codeLengths.push(0);
                i++;
            }
        } else {
            codeLengths.push(code - 2);
            i++;
        }
    }
    this.codeTree.build(codeLengths, 510 * 2);
};

LhaReader.prototype.readOffsetTable = function() {
    var reader = this.reader;
    var codeCount = Math.min(reader.readBits(4), 14);
    if (codeCount <= 0) {
        var constant = reader.readBits(4);
        this.offsetTree.setConstant(constant);
    } else {
        var codeLengths = [];
        for (var i = 0; i < codeCount; i++) {
            var code = reader.readLength();
            codeLengths[i] = code;
        }
        this.offsetTree.build(codeLengths, 19 * 2);
    }
};

LhaReader.prototype.extract = function(id, callback, onerror) {
    var entry = this.entries[id];
    if (!entry)
        return null;

    this.reader.seek(entry.offset, LhaArrayReader.SeekAbsolute);
    var writer = new LhaArrayWriter(entry.originalSize);
    var that = this;
    function step() { // This step solution was borrowed from ZIP-lib to prevent browser script timeout warnings.
        if (that.extractBlock(writer)) {
            if (callback)
                callback(writer.offset, writer.size);
            if (writer.offset >= writer.size)
                return;

            setTimeout(step, 1);
        }
    }
    step();
    return writer.data;
};

LhaReader.prototype.extractBlock = function(writer) {
    var reader = this.reader;
    var blockSize = reader.readBits(16);
    if (blockSize <= 0 || reader.offset >= reader.size)
        return false;

    this.readTempTable();
    this.readCodeTable();
    this.readOffsetTable();

    for (var i = 0; i < blockSize; i++) {
        var code = this.codeTree.readCode(reader);
        if (code < 256) {
            this.ringBuffer.add(code);
            writer.write(code);
        } else {
            var bits = this.offsetTree.readCode(reader);
            var offset = bits;
            if (bits >= 2) {
                var offset = reader.readBits(bits - 1);
                offset = offset + (1 << (bits - 1));
            }

            var length = code - 256 + 3;
            var chunk = this.ringBuffer.get(offset, length);
            for (var j in chunk)
                writer.write(chunk[j]); // TODO: Look at bulk-copying this.
        }
    }
    return true;
};
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/lib/lh4.js","/lib")
},{"1YiZ5S":5,"buffer":2}],27:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*
 Copyright (c) 2012 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function(obj) {

	var ERR_BAD_FORMAT = "File format is not recognized.";
	var ERR_ENCRYPTED = "File contains encrypted entry.";
	var ERR_ZIP64 = "File is using Zip64 (4gb+ file size).";
	var ERR_READ = "Error while reading zip file.";
	var ERR_WRITE = "Error while writing zip file.";
	var ERR_WRITE_DATA = "Error while writing file data.";
	var ERR_READ_DATA = "Error while reading file data.";
	var ERR_DUPLICATED_NAME = "File already exists.";
	var ERR_HTTP_RANGE = "HTTP Range not supported.";
	var CHUNK_SIZE = 512 * 1024;

	var INFLATE_JS = "inflate.js";
	var DEFLATE_JS = "deflate.js";

	var BlobBuilder = obj.WebKitBlobBuilder || obj.MozBlobBuilder || obj.MSBlobBuilder || obj.BlobBuilder;

	var appendABViewSupported;

	function isAppendABViewSupported() {
		if (typeof appendABViewSupported == "undefined") {
			var blobBuilder;
			blobBuilder = new BlobBuilder();
			blobBuilder.append(getDataHelper(0).view);
			appendABViewSupported = blobBuilder.getBlob().size == 0;
		}
		return appendABViewSupported;
	}

	function Crc32() {
		var crc = -1, that = this;
		that.append = function(data) {
			var offset, table = that.table;
			for (offset = 0; offset < data.length; offset++)
				crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];
		};
		that.get = function() {
			return ~crc;
		};
	}
	Crc32.prototype.table = (function() {
		var i, j, t, table = [];
		for (i = 0; i < 256; i++) {
			t = i;
			for (j = 0; j < 8; j++)
				if (t & 1)
					t = (t >>> 1) ^ 0xEDB88320;
				else
					t = t >>> 1;
			table[i] = t;
		}
		return table;
	})();

	function blobSlice(blob, index, length) {
		if (blob.slice)
			return blob.slice(index, index + length);
		else if (blob.webkitSlice)
			return blob.webkitSlice(index, index + length);
		else if (blob.mozSlice)
			return blob.mozSlice(index, index + length);
		else if (blob.msSlice)
			return blob.msSlice(index, index + length);
	}

	function getDataHelper(byteLength, bytes) {
		var dataBuffer, dataArray;
		dataBuffer = new ArrayBuffer(byteLength);
		dataArray = new Uint8Array(dataBuffer);
		if (bytes)
			dataArray.set(bytes, 0);
		return {
			buffer : dataBuffer,
			array : dataArray,
			view : new DataView(dataBuffer)
		};
	}

	// Readers
	function Reader() {
	}

	function TextReader(text) {
		var that = this, blobReader;

		function init(callback, onerror) {
			var blobBuilder = new BlobBuilder();
			blobBuilder.append(text);
			blobReader = new BlobReader(blobBuilder.getBlob("text/plain"));
			blobReader.init(function() {
				that.size = blobReader.size;
				callback();
			}, onerror);
		}

		function readUint8Array(index, length, callback, onerror) {
			blobReader.readUint8Array(index, length, callback, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	TextReader.prototype = new Reader();
	TextReader.prototype.constructor = TextReader;

	function Data64URIReader(dataURI) {
		var that = this, dataStart;

		function init(callback) {
			var dataEnd = dataURI.length;
			while (dataURI.charAt(dataEnd - 1) == "=")
				dataEnd--;
			dataStart = dataURI.indexOf(",") + 1;
			that.size = Math.floor((dataEnd - dataStart) * 0.75);
			callback();
		}

		function readUint8Array(index, length, callback) {
			var i, data = getDataHelper(length);
			var start = Math.floor(index / 3) * 4;
			var end = Math.ceil((index + length) / 3) * 4;
			var bytes = obj.atob(dataURI.substring(start + dataStart, end + dataStart));
			var delta = index - Math.floor(start / 4) * 3;
			for (i = delta; i < delta + length; i++)
				data.array[i - delta] = bytes.charCodeAt(i);
			callback(data.array);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	Data64URIReader.prototype = new Reader();
	Data64URIReader.prototype.constructor = Data64URIReader;

	function BlobReader(blob) {
		var that = this;

		function init(callback) {
			this.size = blob.size;
			callback();
		}

		function readUint8Array(index, length, callback, onerror) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(new Uint8Array(e.target.result));
			};
			reader.onerror = onerror;
			reader.readAsArrayBuffer(blobSlice(blob, index, length));
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	BlobReader.prototype = new Reader();
	BlobReader.prototype.constructor = BlobReader;

	function HttpReader(url) {
		var that = this;

		function getData(callback, onerror) {
			var request;
			if (!that.data) {
				request = new XMLHttpRequest();
				request.addEventListener("load", function() {
					if (!that.size)
						that.size = Number(request.getResponseHeader("Content-Length"));
					that.data = new Uint8Array(request.response);
					callback();
				}, false);
				request.addEventListener("error", onerror, false);
				request.open("GET", url);
				request.responseType = "arraybuffer";
				request.send();
			} else
				callback();
		}

		function init(callback, onerror) {
			var request = new XMLHttpRequest();
            debugger;
			request.addEventListener("load", function() {
				that.size = Number(request.getResponseHeader("Content-Length"));
				callback();
			}, false);
			request.addEventListener("error", onerror, false);
			request.open("HEAD", url);
			request.send();
		}

		function readUint8Array(index, length, callback, onerror) {
			getData(function() {
				callback(new Uint8Array(that.data.subarray(index, index + length)));
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	HttpReader.prototype = new Reader();
	HttpReader.prototype.constructor = HttpReader;

	function HttpRangeReader(url) {
		var that = this;

		function init(callback, onerror) {
			var request = new XMLHttpRequest();
			request.addEventListener("load", function() {
				that.size = Number(request.getResponseHeader("Content-Length"));
				if (request.getResponseHeader("Accept-Ranges") == "bytes")
					callback();
				else
					onerror(ERR_HTTP_RANGE);
			}, false);
			request.addEventListener("error", onerror, false);
			request.open("HEAD", url);
			request.send();
		}

		function readArrayBuffer(index, length, callback, onerror) {
			var request = new XMLHttpRequest();
			request.open("GET", url);
			request.responseType = "arraybuffer";
			request.setRequestHeader("Range", "bytes=" + index + "-" + (index + length - 1));
			request.addEventListener("load", function() {
				callback(request.response);
			}, false);
			request.addEventListener("error", onerror, false);
			request.send();
		}

		function readUint8Array(index, length, callback, onerror) {
			readArrayBuffer(index, length, function(arraybuffer) {
				callback(new Uint8Array(arraybuffer));
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	HttpRangeReader.prototype = new Reader();
	HttpRangeReader.prototype.constructor = HttpRangeReader;

	// Writers

	function Writer() {
	}
	Writer.prototype.getData = function(callback) {
		callback(this.data);
	};

	function TextWriter() {
		var that = this, blobBuilder;

		function init(callback) {
			blobBuilder = new BlobBuilder();
			callback();
		}

		function writeUint8Array(array, callback) {
			blobBuilder.append(isAppendABViewSupported() ? array : array.buffer);
			callback();
		}

		function getData(callback, onerror) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(e.target.result);
			};
			reader.onerror = onerror;
			reader.readAsText(blobBuilder.getBlob("text/plain"));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	TextWriter.prototype = new Writer();
	TextWriter.prototype.constructor = TextWriter;


	function Data64URIWriter(contentType) {
		var that = this, data = "", pending = "";

		function init(callback) {
			data += "data:" + (contentType || "") + ";base64,";
			callback();
		}

		function writeUint8Array(array, callback) {
			var i, delta = pending.length, dataString = pending;
			pending = "";
			for (i = 0; i < (Math.floor((delta + array.length) / 3) * 3) - delta; i++)
				dataString += String.fromCharCode(array[i]);
			for (; i < array.length; i++)
				pending += String.fromCharCode(array[i]);
			if (dataString.length > 2)
				data += obj.btoa(dataString);
			else
				pending = dataString;
			callback();
		}

		function getData(callback) {
			callback(data + obj.btoa(pending));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	Data64URIWriter.prototype = new Writer();
	Data64URIWriter.prototype.constructor = Data64URIWriter;

	function FileWriter(fileEntry, contentType) {
		var writer, that = this;

		function init(callback, onerror) {
			fileEntry.createWriter(function(fileWriter) {
				writer = fileWriter;
				callback();
			}, onerror);
		}

		function writeUint8Array(array, callback, onerror) {
			var blobBuilder = new BlobBuilder();
			blobBuilder.append(isAppendABViewSupported() ? array : array.buffer);
			writer.onwrite = function() {
				writer.onwrite = null;
				callback();
			};
			writer.onerror = onerror;
			writer.write(blobBuilder.getBlob(contentType));
		}

		function getData(callback) {
			fileEntry.file(callback);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	FileWriter.prototype = new Writer();
	FileWriter.prototype.constructor = FileWriter;

	function BlobWriter(contentType) {
		var blobBuilder, that = this;

		function init(callback) {
			blobBuilder = new BlobBuilder();
			callback();
		}

		function writeUint8Array(array, callback) {
			blobBuilder.append(isAppendABViewSupported() ? array : array.buffer);
			callback();
		}

		function getData(callback) {
			callback(blobBuilder.getBlob(contentType));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	BlobWriter.prototype = new Writer();
	BlobWriter.prototype.constructor = BlobWriter;

    function ArrayWriter(size) {
        var that = this;
        function init(callback) {
            that.buffer = new Uint8Array(size);
            that.offset = 0;
            callback();
        }

        function writeUint8Array(array, callback) {
            that.buffer.set(array, that.offset);
            that.offset += array.length;
            callback();
        }

        function getData(callback) {
            callback(that.buffer);
        }

        that.init = init;
        that.writeUint8Array = writeUint8Array;
        that.getData = getData;
    }
    ArrayWriter.prototype = new Writer();
    ArrayWriter.prototype.constructor = ArrayWriter;

	// inflate/deflate core functions
	function launchWorkerProcess(worker, reader, writer, offset, size, onappend, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0, index, outputSize;

		function onflush() {
			worker.removeEventListener("message", onmessage, false);
			onend(outputSize);
		}

		function onmessage(event) {
			var message = event.data, data = message.data;

			if (message.onappend) {
				outputSize += data.length;
				writer.writeUint8Array(data, function() {
					onappend(false, data);
					step();
				}, onwriteerror);
			}
			if (message.onflush)
				if (data) {
					outputSize += data.length;
					writer.writeUint8Array(data, function() {
						onappend(false, data);
						onflush();
					}, onwriteerror);
				} else
					onflush();
			if (message.progress && onprogress)
				onprogress(index + message.current, size);
		}

		function step() {
			index = chunkIndex * CHUNK_SIZE;
			if (index < size)
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(array) {
					worker.postMessage({
						append : true,
						data : array
					});
					chunkIndex++;
					if (onprogress)
						onprogress(index, size);
					onappend(true, array);
				}, onreaderror);
			else
				worker.postMessage({
					flush : true
				});
		}

		outputSize = 0;
		worker.addEventListener("message", onmessage, false);
		step();
	}

	function launchProcess(process, reader, writer, offset, size, onappend, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0, index, outputSize = 0;

		function step() {
			var outputData;
			index = chunkIndex * CHUNK_SIZE;
			if (index < size)
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(inputData) {
					var outputData = process.append(inputData, function() {
						if (onprogress)
							onprogress(offset + index, size);
					});
					outputSize += outputData.length;
					onappend(true, inputData);
					writer.writeUint8Array(outputData, function() {
						onappend(false, outputData);
						chunkIndex++;
						setTimeout(step, 1);
					}, onwriteerror);
					if (onprogress)
						onprogress(index, size);
				}, onreaderror);
			else {
				outputData = process.flush();
				if (outputData) {
					outputSize += outputData.length;
					writer.writeUint8Array(outputData, function() {
						onappend(false, outputData);
						onend(outputSize);
					}, onwriteerror);
				} else
					onend(outputSize);
			}
		}

		step();
	}

	function inflate(reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var worker, crc32 = new Crc32();

		function oninflateappend(sending, array) {
			if (computeCrc32 && !sending)
				crc32.append(array);
		}

		function oninflateend(outputSize) {
			onend(outputSize, crc32.get());
		}

		if (obj.zip.useWebWorkers) {
			worker = new Worker(obj.zip.workerScriptsPath + INFLATE_JS);
			launchWorkerProcess(worker, reader, writer, offset, size, oninflateappend, onprogress, oninflateend, onreaderror, onwriteerror);
		} else
			launchProcess(new obj.zip.Inflater(), reader, writer, offset, size, oninflateappend, onprogress, oninflateend, onreaderror, onwriteerror);
		return worker;
	}

	function deflate(reader, writer, level, onend, onprogress, onreaderror, onwriteerror) {
		var worker, crc32 = new Crc32();

		function ondeflateappend(sending, array) {
			if (sending)
				crc32.append(array);
		}

		function ondeflateend(outputSize) {
			onend(outputSize, crc32.get());
		}

		function onmessage() {
			worker.removeEventListener("message", onmessage, false);
			launchWorkerProcess(worker, reader, writer, 0, reader.size, ondeflateappend, onprogress, ondeflateend, onreaderror, onwriteerror);
		}

		if (obj.zip.useWebWorkers) {
			worker = new Worker(obj.zip.workerScriptsPath + DEFLATE_JS);
			worker.addEventListener("message", onmessage, false);
			worker.postMessage({
				init : true,
				level : level
			});
		} else
			launchProcess(new obj.zip.Deflater(), reader, writer, 0, reader.size, ondeflateappend, onprogress, ondeflateend, onreaderror, onwriteerror);
		return worker;
	}

	function copy(reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var chunkIndex = 0, crc32 = new Crc32();

		function step() {
			var index = chunkIndex * CHUNK_SIZE;
			if (index < size)
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(array) {
					if (computeCrc32)
						crc32.append(array);
					if (onprogress)
						onprogress(index, size, array);
					writer.writeUint8Array(array, function() {
						chunkIndex++;
						step();
					}, onwriteerror);
				}, onreaderror);
			else
				onend(size, crc32.get());
		}

		step();
	}

	// ZipReader

	function decodeASCII(str) {
		var i, out = "", charCode, extendedASCII = [ '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7', '\u00EA', '\u00EB',
				'\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5', '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9',
				'\u00FF', '\u00D6', '\u00DC', '\u00F8', '\u00A3', '\u00D8', '\u00D7', '\u0192', '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1',
				'\u00AA', '\u00BA', '\u00BF', '\u00AE', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB', '_', '_', '_', '\u00A6', '\u00A6',
				'\u00C1', '\u00C2', '\u00C0', '\u00A9', '\u00A6', '\u00A6', '+', '+', '\u00A2', '\u00A5', '+', '+', '-', '-', '+', '-', '+', '\u00E3',
				'\u00C3', '+', '+', '-', '-', '\u00A6', '-', '+', '\u00A4', '\u00F0', '\u00D0', '\u00CA', '\u00CB', '\u00C8', 'i', '\u00CD', '\u00CE',
				'\u00CF', '+', '+', '_', '_', '\u00A6', '\u00CC', '_', '\u00D3', '\u00DF', '\u00D4', '\u00D2', '\u00F5', '\u00D5', '\u00B5', '\u00FE',
				'\u00DE', '\u00DA', '\u00DB', '\u00D9', '\u00FD', '\u00DD', '\u00AF', '\u00B4', '\u00AD', '\u00B1', '_', '\u00BE', '\u00B6', '\u00A7',
				'\u00F7', '\u00B8', '\u00B0', '\u00A8', '\u00B7', '\u00B9', '\u00B3', '\u00B2', '_', ' ' ];
		for (i = 0; i < str.length; i++) {
			charCode = str.charCodeAt(i) & 0xFF;
			if (charCode > 127)
				out += extendedASCII[charCode - 128];
			else
				out += String.fromCharCode(charCode);
		}
		return out;
	}

	function decodeUTF8(str_data) {
		var tmp_arr = [], i = 0, ac = 0, c1 = 0, c2 = 0, c3 = 0;

		str_data += '';

		while (i < str_data.length) {
			c1 = str_data.charCodeAt(i);
			if (c1 < 128) {
				tmp_arr[ac++] = String.fromCharCode(c1);
				i++;
			} else if (c1 > 191 && c1 < 224) {
				c2 = str_data.charCodeAt(i + 1);
				tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = str_data.charCodeAt(i + 1);
				c3 = str_data.charCodeAt(i + 2);
				tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}

		return tmp_arr.join('');
	}

	function getString(bytes) {
		var i, str = "";
		for (i = 0; i < bytes.length; i++)
			str += String.fromCharCode(bytes[i]);
		return str;
	}

	function getDate(timeRaw) {
		var date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
		try {
			return new Date(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5,
					(time & 0x001F) * 2, 0);
		} catch (e) {
		}
	}

	function readCommonHeader(entry, data, index, centralDirectory, onerror) {
		entry.version = data.view.getUint16(index, true);
		entry.bitFlag = data.view.getUint16(index + 2, true);
		entry.compressionMethod = data.view.getUint16(index + 4, true);
		entry.lastModDateRaw = data.view.getUint32(index + 6, true);
		entry.lastModDate = getDate(entry.lastModDateRaw);
		if ((entry.bitFlag & 0x01) === 0x01) {
			onerror(ERR_ENCRYPTED);
			return;
		}
		if (centralDirectory || (entry.bitFlag & 0x0008) != 0x0008) {
			entry.crc32 = data.view.getUint32(index + 10, true);
			entry.compressedSize = data.view.getUint32(index + 14, true);
			entry.uncompressedSize = data.view.getUint32(index + 18, true);
		}
		if (entry.compressedSize === 0xFFFFFFFF || entry.uncompressedSize === 0xFFFFFFFF) {
			onerror(ERR_ZIP64);
			return;
		}
		entry.filenameLength = data.view.getUint16(index + 22, true);
		entry.extraFieldLength = data.view.getUint16(index + 24, true);
	}

	function createZipReader(reader, onerror) {
		function Entry() {
		}

		Entry.prototype.getData = function(writer, onend, onprogress, checkCrc32) {
			var that = this, worker;

			function terminate(callback, param) {
				if (worker)
					worker.terminate();
				worker = null;
				if (callback)
					callback(param);
			}

			function testCrc32(crc32) {
				var dataCrc32 = getDataHelper(4);
				dataCrc32.view.setUint32(0, crc32);
				return that.crc32 == dataCrc32.view.getUint32(0);
			}

			function getWriterData(uncompressedSize, crc32) {
				if (checkCrc32 && !testCrc32(crc32))
					onreaderror();
				else
					writer.getData(function(data) {
						terminate(onend, data);
					});
			}

			function onreaderror() {
				terminate(onerror, ERR_READ_DATA);
			}

			function onwriteerror() {
				terminate(onerror, ERR_WRITE_DATA);
			}

			reader.readUint8Array(that.offset, 30, function(bytes) {
				var data = getDataHelper(bytes.length, bytes), dataOffset;
				if (data.view.getUint32(0) != 0x504b0304) {
					onerror(ERR_BAD_FORMAT);
					return;
				}
				readCommonHeader(that, data, 4, false, function(error) {
					onerror(error);
					return;
				});
				dataOffset = that.offset + 30 + that.filenameLength + that.extraFieldLength;
				writer.init(function() {
					if (that.compressionMethod === 0)
						copy(reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
					else
						worker = inflate(reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
				}, onwriteerror);
			}, onreaderror);
		};

		function seekEOCDR(offset, entriesCallback) {
			reader.readUint8Array(reader.size - offset, offset, function(bytes) {
				var dataView = getDataHelper(bytes.length, bytes).view;
				if (dataView.getUint32(0) != 0x504b0506) {
					seekEOCDR(offset+1, entriesCallback);
				} else {
					entriesCallback(dataView);
				}
			}, function() {
				onerror(ERR_READ);
			});
		}
		
		return {
			getEntries : function(callback) {
				if (reader.size < 22) {
					onerror(ERR_BAD_FORMAT);
					return;
				}
				// look for End of central directory record
				seekEOCDR(22, function(dataView) {
					datalength = dataView.getUint32(16, true);
					fileslength = dataView.getUint16(8, true);
					reader.readUint8Array(datalength, reader.size - datalength, function(bytes) {
						var i, index = 0, entries = [], entry, filename, comment, data = getDataHelper(bytes.length, bytes);
						for (i = 0; i < fileslength; i++) {
							entry = new Entry();
							if (data.view.getUint32(index) != 0x504b0102) {
								onerror(ERR_BAD_FORMAT);
								return;
							}
							readCommonHeader(entry, data, index + 6, true, function(error) {
								onerror(error);
								return;
							});
							entry.commentLength = data.view.getUint16(index + 32, true);
							entry.directory = ((data.view.getUint8(index + 38) & 0x10) == 0x10);
							entry.offset = data.view.getUint32(index + 42, true);
							filename = getString(data.array.subarray(index + 46, index + 46 + entry.filenameLength));
							entry.filename = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(filename) : decodeASCII(filename);
							if (!entry.directory && entry.filename.charAt(entry.filename.length - 1) == "/")
								entry.directory = true;
							comment = getString(data.array.subarray(index + 46 + entry.filenameLength + entry.extraFieldLength, index + 46
									+ entry.filenameLength + entry.extraFieldLength + entry.commentLength));
							entry.comment = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(comment) : decodeASCII(comment);
							entries.push(entry);
							index += 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength;
						}
						callback(entries);
					}, function() {
						onerror(ERR_READ);
					});
				});
			},
			close : function(callback) {
				if (callback)
					callback();
			}
		};
	}

	// ZipWriter

	function encodeUTF8(string) {
		var n, c1, enc, utftext = [], start = 0, end = 0, stringl = string.length;
		for (n = 0; n < stringl; n++) {
			c1 = string.charCodeAt(n);
			enc = null;
			if (c1 < 128)
				end++;
			else if (c1 > 127 && c1 < 2048)
				enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
			else
				enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
			if (enc != null) {
				if (end > start)
					utftext += string.slice(start, end);
				utftext += enc;
				start = end = n + 1;
			}
		}
		if (end > start)
			utftext += string.slice(start, stringl);
		return utftext;
	}

	function getBytes(str) {
		var i, array = [];
		for (i = 0; i < str.length; i++)
			array.push(str.charCodeAt(i));
		return array;
	}

	function createZipWriter(writer, onerror, dontDeflate) {
		var worker, files = [], filenames = [], datalength = 0;

		function terminate(callback, message) {
			if (worker)
				worker.terminate();
			worker = null;
			if (callback)
				callback(message);
		}

		function onwriteerror() {
			terminate(onerror, ERR_WRITE);
		}

		function onreaderror() {
			terminate(onerror, ERR_READ_DATA);
		}

		return {
			add : function(name, reader, onend, onprogress, options) {
				var header, filename, date;

				function writeHeader(callback) {
					var data;
					date = options.lastModDate || new Date();
					header = getDataHelper(26);
					files[name] = {
						headerArray : header.array,
						directory : options.directory,
						filename : filename,
						offset : datalength,
						comment : getBytes(encodeUTF8(options.comment || ""))
					};
					header.view.setUint32(0, 0x14000808);
					if (options.version)
						header.view.setUint8(0, options.version);
					if (!dontDeflate && options.level != 0)
						header.view.setUint16(4, 0x0800);
					header.view.setUint16(6, (((date.getHours() << 6) | date.getMinutes()) << 5) | date.getSeconds() / 2, true);
					header.view.setUint16(8, ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate(), true);
					header.view.setUint16(22, filename.length, true);
					data = getDataHelper(30 + filename.length);
					data.view.setUint32(0, 0x504b0304);
					data.array.set(header.array, 4);
					data.array.set([], 30); // FIXME: remove when chrome 18 will be stable (14: OK, 16: KO, 17: OK)
					data.array.set(filename, 30);
					datalength += data.array.length;
					writer.writeUint8Array(data.array, callback, onwriteerror);
				}

				function writeFooter(compressedLength, crc32) {
					var footer = getDataHelper(16);
					datalength += compressedLength || 0;
					footer.view.setUint32(0, 0x504b0708);
					if (typeof crc32 != "undefined") {
						header.view.setUint32(10, crc32, true);
						footer.view.setUint32(4, crc32, true);
					}
					if (reader) {
						footer.view.setUint32(8, compressedLength, true);
						header.view.setUint32(14, compressedLength, true);
						footer.view.setUint32(12, reader.size, true);
						header.view.setUint32(18, reader.size, true);
					}
					writer.writeUint8Array(footer.array, function() {
						datalength += 16;
						terminate(onend);
					}, onwriteerror);
				}

				function writeFile() {
					options = options || {};
					name = name.trim();
					if (options.directory && name.charAt(name.length - 1) != "/")
						name += "/";
					if (files[name])
						throw ERR_DUPLICATED_NAME;
					filename = getBytes(encodeUTF8(name));
					filenames.push(name);
					writeHeader(function() {
						if (reader)
							if (dontDeflate || options.level == 0)
								copy(reader, writer, 0, reader.size, true, writeFooter, onprogress, onreaderror, onwriteerror);
							else
								worker = deflate(reader, writer, options.level, writeFooter, onprogress, onreaderror, onwriteerror);
						else
							writeFooter();
					}, onwriteerror);
				}

				if (reader)
					reader.init(writeFile, onreaderror);
				else
					writeFile();
			},
			close : function(callback) {
				var data, length = 0, index = 0;
				filenames.forEach(function(name) {
					var file = files[name];
					length += 46 + file.filename.length + file.comment.length;
				});
				data = getDataHelper(length + 22);
				filenames.forEach(function(name) {
					var file = files[name];
					data.view.setUint32(index, 0x504b0102);
					data.view.setUint16(index + 4, 0x1400);
					data.array.set(file.headerArray, index + 6);
					data.view.setUint16(index + 32, file.comment.length, true);
					if (file.directory)
						data.view.setUint8(index + 38, 0x10);
					data.view.setUint32(index + 42, file.offset, true);
					data.array.set(file.filename, index + 46);
					data.array.set(file.comment, index + 46 + file.filename.length);
					index += 46 + file.filename.length + file.comment.length;
				});
				data.view.setUint32(index, 0x504b0506);
				data.view.setUint16(index + 8, filenames.length, true);
				data.view.setUint16(index + 10, filenames.length, true);
				data.view.setUint32(index + 12, length, true);
				data.view.setUint32(index + 16, datalength, true);
				writer.writeUint8Array(data.array, function() {
					terminate(function() {
						writer.getData(callback);
					});
				}, onwriteerror);
			}
		};
	}

	if (typeof BlobBuilder == "undefined") {
		BlobBuilder = function() {
			var that = this, blobParts;

			function initBlobParts() {
				if (!blobParts) {
					blobParts = [ new Blob() ]
				}
			}

			that.append = function(data) {
				initBlobParts();
				blobParts.push(data);
			};
			that.getBlob = function(contentType) {
				initBlobParts();
				if (blobParts.length > 1 || blobParts[0].type != contentType) {
					blobParts = [ contentType ? new Blob(blobParts, {
						type : contentType
					}) : new Blob(blobParts) ];
				}
				return blobParts[0];
			};
		};
	}

	obj.zip = {
		Reader : Reader,
		Writer : Writer,
		BlobReader : BlobReader,
		HttpReader : HttpReader,
		HttpRangeReader : HttpRangeReader,
		Data64URIReader : Data64URIReader,
		TextReader : TextReader,
		BlobWriter : BlobWriter,
		ArrayWriter : ArrayWriter,
        FileWriter : FileWriter,
		Data64URIWriter : Data64URIWriter,
		TextWriter : TextWriter,
		createReader : function(reader, callback, onerror) {
			reader.init(function() {
				callback(createZipReader(reader, onerror));
			}, onerror);
		},
		createWriter : function(writer, callback, onerror, dontDeflate) {
			writer.init(function() {
				callback(createZipWriter(writer, onerror, dontDeflate));
			}, onerror);
		},
		workerScriptsPath : "",
		useWebWorkers : true
	};

})(this);

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/lib/zip.js","/lib")
},{"1YiZ5S":5,"buffer":2}],28:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var LightMap = require('gl/lightmap');
var Bsp = require('formats/bsp');
var utils = require('utils');

var maxLightMaps = 64;
var lightMapBytes = 1;
var blockWidth = 512;
var blockHeight = 512;

var LightMaps = function() {
    this.allocated = utils.array2d(blockWidth, maxLightMaps);
    this.lightMapsData = [];
};

LightMaps.prototype.buildLightMap = function(bsp, surface, offset) {
    var width = (surface.extents[0] >> 4) + 1;
    var height = (surface.extents[1] >> 4) + 1;
    var size = width * height;
    var blockLights = utils.array1d(18 * 18);
    var lightMapOffset = surface.lightMapOffset;

    for (var map = 0; map < maxLightMaps; map++) {
        if (surface.lightStyles[map] === 255)
            break;

        // TODO: Add lightstyles, used for flickering, and other light animations.
        var scale = 264;
        for (var bl = 0; bl < size; bl++) {
            blockLights[bl] += bsp.lightMaps[lightMapOffset + bl] * scale;
        }
        lightMapOffset += size;
    }

    var i = 0;
    var stride = blockWidth * lightMapBytes;
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var position = y * stride + x;
            this.lightMapsData[offset + position] = 255 - Math.min(255, blockLights[i] >> 7);
            i++;
        }
    }
};

LightMaps.prototype.allocateBlock = function (width, height) {
    var result = {};
    for (var texId = 0; texId < maxLightMaps; texId++) {
        var best = blockHeight;
        for (var i = 0; i < blockWidth - width; i++) {
            var best2 = 0;
            for (var j = 0; j < width; j++) {

                if (this.allocated[texId][i + j] >= best)
                    break;
                if (this.allocated[texId][i + j] > best2)
                    best2 = this.allocated[texId][i + j];
            }

            if (j == width) {
                result.x = i;
                result.y = best = best2;
            }
        }

        if (best + height > blockHeight)
            continue;

        for (var j = 0; j < width; j++)
            this.allocated[texId][result.x + j] = best + height;

        result.texId = texId;
        return result;
    }
    return null;
};

LightMaps.prototype.build = function(bsp) {
    var usedMaps = 0;
    for (var m = 0; m < bsp.models.length; m++) {
        var model = bsp.models[m];

        for (var i = 0; i < model.surfaceCount; i++) {
            var surface = bsp.surfaces[model.firstSurface + i];
            if (surface.flags !== 0) {
                continue;
            }

            var width = (surface.extents[0] >> 4) + 1;
            var height = (surface.extents[1] >> 4) + 1;

            var result = this.allocateBlock(width, height);
            surface.lightMapS = result.x;
            surface.lightMapT = result.y;
            usedMaps = Math.max(usedMaps, result.texId);
            var offset = result.texId * lightMapBytes * blockWidth * blockHeight;
            offset += (result.y * blockWidth + result.x) * lightMapBytes;
            this.buildLightMap(bsp, surface, offset);
        }
    }
    this.texture = new LightMap(this.lightMapsData, 0, blockWidth, blockHeight);
};

module.exports = exports = LightMaps;


}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/lightmaps.js","/")
},{"1YiZ5S":5,"buffer":2,"formats/bsp":9,"gl/lightmap":18,"utils":35}],29:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Texture = require('gl/texture');
var LightMaps = require('lightmaps');
var assets = require('assets');
var utils = require('utils');
var wireframe = false;

var blockWidth = 512;
var blockHeight = 512;

var Map = function(bsp) {
    this.textures = [];
    this.lightMaps = new LightMaps();
    this.lightMaps.build(bsp);

    for (var texId in bsp.textures) {
        var texture = bsp.textures[texId];
        var options = {
            width: texture.width,
            height: texture.height,
            wrap: gl.REPEAT,
            palette: assets.palette
        };
        this.textures.push(new Texture(texture.data, options));
    }

    var chains = [];
    for (var m in bsp.models) {
        var model = bsp.models[m];
        for (var sid = model.firstSurface; sid < model.surfaceCount; sid++) {
            var surface = bsp.surfaces[sid];
            var texInfo = bsp.texInfos[surface.texInfoId];

            var chain = chains[texInfo.textureId];
            if (!chain) {
                chain = { texId: texInfo.textureId, data: [] };
                chains[texInfo.textureId] = chain;
            }

            var indices = [];
            for (var e = surface.edgeStart; e < surface.edgeStart + surface.edgeCount; e++) {
                var edgeFlipped = bsp.edgeList[e] < 0;
                var edgeIndex = Math.abs(bsp.edgeList[e]);
                if (!edgeFlipped) {
                    indices.push(bsp.edges[edgeIndex * 2]);
                    indices.push(bsp.edges[edgeIndex * 2 + 1]);
                } else {
                    indices.push(bsp.edges[edgeIndex * 2 + 1]);
                    indices.push(bsp.edges[edgeIndex * 2]);
                }
            }
            indices = wireframe ? indices : utils.triangulate(indices);
            for (var i = 0; i < indices.length; i++) {
                var v = [
                    bsp.vertices[indices[i]].x,
                    bsp.vertices[indices[i]].y,
                    bsp.vertices[indices[i]].z
                ];

                var s = vec3.dot(v, texInfo.vectorS) + texInfo.distS;
                var t = vec3.dot(v, texInfo.vectorT) + texInfo.distT;

                var s1 = s / this.textures[texInfo.textureId].width;
                var t1 = t / this.textures[texInfo.textureId].height;

                // Shadow map texture coordinates
                var s2 = s;
                s2 -= surface.textureMins[0];
                s2 += (surface.lightMapS * 16);
                s2 += 8;
                s2 /= (blockWidth * 16);

                var t2 = t;
                t2 -= surface.textureMins[1];
                t2 += (surface.lightMapT * 16);
                t2 += 8;
                t2 /= (blockHeight * 16);

                chain.data.push(v[0], v[1], v[2], s1, t1, s2, t2);
            }
        }
    }

    var data = [];
    var offset = 0;
    this.chains = [];
    for (var c in chains) {
        for (var v = 0; v < chains[c].data.length; v++) {
            data.push(chains[c].data[v]);
        }
        var chain = {
            offset: offset,
            texId: chains[c].texId,
            elements: chains[c].data.length / 7
        };
        offset += chain.elements;
        this.chains.push(chain);
    }
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    this.buffer.stride = 7 * 4;
};

Map.prototype.draw = function(p, m) {
    var shader = assets.shaders.world;
    var buffer = this.buffer;
    var mode = wireframe ? gl.LINES : gl.TRIANGLES;

    shader.use();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    gl.enableVertexAttribArray(shader.attributes.shadowTexCoordsAttribute);

    gl.vertexAttribPointer(shader.attributes.vertexAttribute, 3, gl.FLOAT, false, buffer.stride, 0);
    gl.vertexAttribPointer(shader.attributes.texCoordsAttribute, 2, gl.FLOAT, false, buffer.stride, 12);
    gl.vertexAttribPointer(shader.attributes.shadowTexCoordsAttribute, 2, gl.FLOAT, false, buffer.stride, 20);
    gl.uniformMatrix4fv(shader.uniforms.projectionMatrix, false, p);
    gl.uniformMatrix4fv(shader.uniforms.modelviewMatrix, false, m);
    gl.uniform1i(shader.uniforms.textureMap, 0);
    gl.uniform1i(shader.uniforms.lightMap, 1);

    this.lightMaps.texture.bind(1);
    for (var c in this.chains) {
        var chain = this.chains[c];
        var texture = this.textures[chain.texId];
        texture.bind(0);
        gl.drawArrays(mode, this.chains[c].offset, this.chains[c].elements);
    }
};

module.exports = exports = Map;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/map.js","/")
},{"1YiZ5S":5,"assets":6,"buffer":2,"gl/texture":21,"lightmaps":28,"utils":35}],30:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var assets = require('assets');
var Texture = require('gl/Texture');

var Model = function(mdl) {
    this.skins = [];
    for (var skinIndex = 0; skinIndex < mdl.skins.length; skinIndex++) {
        var skin = mdl.skins[skinIndex];
        var texture = new Texture(skin, {
            palette: assets.palette,
            width: mdl.skinWidth,
            height: mdl.skinHeight
        });
        this.skins.push(texture);
    }

    this.id = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    var data = new Float32Array(mdl.frameCount * mdl.faceCount * 3 * 5);
    var offset = 0;
    for (var i = 0; i < mdl.frameCount; i++) {
        var frame = mdl.frames[i];
        for (var f = 0; f < mdl.faceCount; f++) {
            var face = mdl.faces[f];
            for (var v = 0; v < 3; v++) {
                data[offset++] = frame.vertices[face.indices[v]][0];
                data[offset++] = frame.vertices[face.indices[v]][1];
                data[offset++] = frame.vertices[face.indices[v]][2];

                var s = mdl.texCoords[face.indices[v]].s;
                var t = mdl.texCoords[face.indices[v]].t;

                if (!face.isFrontFace && mdl.texCoords[face.indices[v]].onSeam)
                    s += this.skins[0].width * 0.5; // on back side

                data[offset++] = (s + 0.5) / this.skins[0].width;
                data[offset++] = (t + 0.5) / this.skins[0].height;
            }
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    this.stride = 5 * 4; // x, y, z, s, t
    this.faceCount = mdl.faceCount;
    this.animations = mdl.animations;
};

Model.prototype.draw = function(p, m, animation, frame) {
    var shader = assets.shaders.model;
    animation = animation | 0;
    frame = frame | 0;
    shader.use();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
    this.skins[0].bind(0);

    gl.vertexAttribPointer(shader.attributes.vertexAttribute, 3, gl.FLOAT, false, this.stride, 0);
    gl.vertexAttribPointer(shader.attributes.texCoordsAttribute, 2, gl.FLOAT, false, this.stride, 12);
    gl.uniformMatrix4fv(shader.uniforms.modelviewMatrix, false, m);
    gl.uniformMatrix4fv(shader.uniforms.projectionMatrix, false, p);

    frame += this.animations[animation].firstFrame;
    if (frame >= this.animations[animation].frameCount)
        frame = 0;

    gl.uniform1i(shader.uniforms.textureMap, 0);
    gl.drawArrays(gl.TRIANGLES, ~~frame * (this.faceCount * 3), this.faceCount * 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

module.exports = exports = Model;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/model.js","/")
},{"1YiZ5S":5,"assets":6,"buffer":2,"gl/Texture":14}],31:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var Protocol = {
    serverBad: 0,
    serverNop: 1,
    serverDisconnect: 2,
    serverUpdateStat: 3,
    serverVersion: 4,
    serverSetView: 5,
    serverSound: 6,
    serverTime: 7,
    serverPrint: 8,
    serverStuffText: 9,
    serverSetAngle: 10,
    serverInfo: 11,
    serverLightStyle: 12,
    serverUpdateName: 13,
    serverUpdateFrags: 14,
    serverClientData: 15,
    serverStopSound: 16,
    serverUpdateColors: 17,
    serverParticle: 18,
    serverDamage: 19,
    serverSpawnStatic: 20,
    serverSpawnBaseline: 22,
    serverTempEntity: 23,
    serverSetPause: 24,
    serverSignonNum: 25,
    serverCenterPrint: 26,
    serverKilledMonster: 27,
    serverFoundSecret: 28,
    serverSpawnStaticSound: 29,
    serverCdTrack: 32,
    
    clientViewHeight: 1,
    clientIdealPitch: 2,
    clientPunch1: 4,
    clientPunch2: 8,
    clientPunch3: 16,
    clientVelocity1: 32,
    clientVelocity2: 64,
    clientVelocity3: 128,
    clientAiment: 256,
    clientItems: 512,
    clientOnGround: 1024,
    clientInWater: 2048,
    clientWeaponFrame: 4096,
    clientArmor: 8192,
    clientWeapon: 16384,

    fastUpdateMoreBits: 1,
    fastUpdateOrigin1: 2,
    fastUpdateOrigin2: 4,
    fastUpdateOrigin3: 8,
    fastUpdateAngle2: 16,
    fastUpdateNoLerp: 32,
    fastUpdateFrame: 64,
    fastUpdateSignal: 128,
    fastUpdateAngle1: 256,
    fastUpdateAngle3: 512,
    fastUpdateModel: 1024,
    fastUpdateColorMap: 2048,
    fastUpdateSkin: 4096,
    fastUpdateEffects: 8192,
    fastUpdateLongEntity: 16384,

    soundVolume: 1,
    soundAttenuation: 2,
    soundLooping: 4,

    tempSpike: 0,
    tempSuperSpike: 1,
    tempGunShot: 2,
    tempExplosion: 3,
    tempTarExplosion: 4,
    tempLightning1: 5,
    tempLightning2: 6,
    tempWizSpike: 7,
    tempKnightSpike: 8,
    tempLightning3: 9,
    tempLavaSplash: 10,
    tempTeleport: 11,
    tempExplosion2: 12
};

module.exports = exports = Protocol;

}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/protocol.js","/")
},{"1YiZ5S":5,"buffer":2}],32:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){

var settings = {
    version: '0.1',
    mapNames: {
        start: 'Entrance',
        e1m1: 'Slipgate Complex',
        e1m2: 'Castle of the Damned',
        e1m3: 'The Necropolis',
        e1m4: 'The Grisly Grotto',
        e1m5: 'Gloom Keep',
        e1m6: 'The Door To Chthon',
        e1m7: 'The House of Chthon',
        e1m8: 'Ziggurat Vertigo'
    }
};

module.exports = exports = settings;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/settings.js","/")
},{"1YiZ5S":5,"buffer":2}],33:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Texture = require('gl/texture');
var Sprites = require('gl/sprites');
var Font = require('gl/font');
var assets = require('assets');
var settings = require('settings');

var Console = function() {};

Console.prototype.init = function() {
   var fontTexture = assets.load('wad/CONCHARS', { width: 128, height: 128, alpha: true });
   var font = new Font(fontTexture, 8, 8);

   var backgroundTexture = assets.load('pak/gfx/conback.lmp');
   backgroundTexture.drawTo(function(p) {
      gl.enable(gl.BLEND);
      var version = 'WebGL ' + settings.version;
      font.drawString(225, 186, version, 1);
      font.render(assets.shaders.texture2d, p);
   });
   this.background = new Sprites(320, 200);
   this.background.textures.addSubTexture(backgroundTexture);
   this.background.textures.compile(assets.shaders.texture2d);

   this.buffer = new Sprites(gl.width, gl.height);
   this.buffer.textures.addSubTexture(new Texture(null, { width: gl.width, height: gl.height }));
   this.buffer.textures.compile(assets.shaders.texture2d);

   this.font = font;
   this.enabled = true;
   this.dirty = false;
   this.y = -gl.height * 0.75;
   this.lines = [''];
   this.line = ']';
};

Console.prototype.print = function(msg) {
   if (msg.indexOf('\n') !== -1)
      this.lines.push('');
   else
      this.lines[this.lines.length - 1] += msg;
   this.dirty = true;
};

Console.prototype.input = function(key) {
   switch (key) {
      case 192:
         this.enabled = !this.enabled; // TODO: Animate here.
         break;
      case 13:
         this.lines.push(this.line);
         this.line = ']';
         this.dirty = true;
         break;
      default:
         this.line += String.fromCharCode(key);
   }
};

Console.prototype.update = function(dt) {
   if (!this.enabled)
      return;
   // TODO: Animate.
};

Console.prototype.redrawBuffer = function() {
   var self = this;
   this.buffer.textures.texture.drawTo(function (p) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      var y = gl.height - 40;
      for (var i = self.lines.length - 1; i >= 0; i--) {
         self.font.drawString(8, y, self.lines[i]);
         y -= 8;
      }
      self.font.render(assets.shaders.texture2d, p);
   });
};

Console.prototype.draw = function(p) {
   if (!this.enabled)
      return;

   if (this.dirty)
      this.redrawBuffer();

   gl.enable(gl.BLEND);
   this.background.clear();
   this.background.drawSprite(0, 0, this.y, gl.width, gl.height, 1, 1, 1, 1);
   this.background.render(assets.shaders.color2d, p);

   this.buffer.clear();
   this.buffer.drawSprite(0, 0, this.y, gl.width, gl.height, 1, 1, 1, 1);
   this.buffer.render(assets.shaders.color2d, p);

   this.font.drawString(8, this.y + gl.height - 30, this.line);
   this.font.render(assets.shaders.texture2d, p);
};

module.exports = exports = new Console();
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ui/console.js","/ui")
},{"1YiZ5S":5,"assets":6,"buffer":2,"gl/font":16,"gl/sprites":20,"gl/texture":21,"settings":32}],34:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Sprites = require('gl/sprites');
var assets = require('assets');

var StatusBar = function() {
    this.sprites = new Sprites(512, 512, 64);

    this.background = this.loadPic('SBAR');
    this.numbers = [];
    this.redNumbers = [];
    for (var i = 0; i < 10; i++) {
        this.numbers.push(this.loadPic('NUM_' + i));
        this.redNumbers.push(this.loadPic('ANUM_' + i));
    }

    this.weapons = new Array(7);
    this.weapons[0] = this.loadWeapon('SHOTGUN');
    this.weapons[1] = this.loadWeapon('SSHOTGUN');
    this.weapons[2] = this.loadWeapon('NAILGUN');
    this.weapons[3] = this.loadWeapon('SNAILGUN');
    this.weapons[4] = this.loadWeapon('RLAUNCH');
    this.weapons[5] = this.loadWeapon('SRLAUNCH');
    this.weapons[6] = this.loadWeapon('LIGHTNG');

    this.faces = new Array(5);
    for (var i = 1; i <= 5; i++)
        this.faces[i - 1] = { normal: this.loadPic('FACE' + i), pain: this.loadPic('FACE_P' + i) };

    this.sprites.textures.compile(assets.shaders.texture2d);
};

StatusBar.prototype.loadPic = function(name) {
    var texture = assets.load('wad/' + name);
    return this.sprites.textures.addSubTexture(texture);
};

StatusBar.prototype.drawPic = function(index, x, y) {
    this.sprites.drawSprite(index, x, y, 0, 0, 1, 1, 1, 1);
};

StatusBar.prototype.loadWeapon = function (name) {
    var weapon = {};
    weapon.owned = this.loadPic('INV_' + name);
    weapon.active = this.loadPic('INV2_' + name);
    weapon.flashes = new Array(5);
    for (var i = 0; i < 5; i++)
        weapon.flashes[i] = this.loadPic('INVA' + (i + 1) + '_' + name);
    return weapon;
};

StatusBar.prototype.draw = function(p) {
    this.sprites.clear();

    var left = gl.width / 2 - 160;
    this.drawPic(this.background, left, gl.height - 28);
    for (var i = 0; i < 7; i++)
        this.drawPic(this.weapons[i].owned, left + i * 24, gl.height - 42);

    this.sprites.render(assets.shaders.color2d, p);
};

module.exports = exports = StatusBar;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/ui/statusbar.js","/ui")
},{"1YiZ5S":5,"assets":6,"buffer":2,"gl/sprites":20}],35:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Utils = {};

Utils.getExtension = function(path) {
    var index = path.lastIndexOf('.');
    if (index === -1) return '';
    return path.substr(index + 1);
};

Utils.triangulate = function(points) {
    var result = [];
    points.pop();
    for (var i = 1; i < points.length - 2; i += 2) {
        result.push(points[i + 2]);
        result.push(points[i]);
        result.push(points[0]);
    }
    return result;
};

Utils.quakeIdentity = function(a) {
    a[0] = 0; a[4] = 1; a[8] = 0; a[12] = 0;
    a[1] = 0; a[5] = 0; a[9] = -1; a[13] = 0;
    a[2] = -1; a[6] = 0; a[10] = 0; a[14] = 0;
    a[3] = 0; a[7] = 0; a[11] = 0; a[15] = 1;
    return a;
};

Utils.deg2Rad = function(degrees) {
    return degrees * Math.PI / 180;
};

Utils.rad2Deg = function(degrees) {
    return degrees / Math.PI * 180;
};


Utils.isPowerOf2 = function(x) {
    return (x & (x - 1)) == 0;
};

Utils.nextPowerOf2 = function(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
};

Utils.array1d = function(width) {
    var result = new Array(width);
    for (var x = 0; x < width; x++) result[x] = 0;
    return result;
};

Utils.array2d = function(width, height) {
    var result = new Array(height);
    for (var y = 0; y < height; y++) {
        result[y] = new Array(width);
        for (var x = 0; x < width; x++)
            result[y][x] = 0;
    }
    return result;
};

module.exports = exports = Utils;


}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/utils.js","/")
},{"1YiZ5S":5,"buffer":2}],36:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var Map = require('map');
var Model = require('model');
var assets = require('assets');
var utils = require('utils');

var World = function() {
    this.models = ['dummy'];
    this.statics = [];
    this.entities = [];
    this.map = null;

    for (var i = 0; i < 1024; i++) {
        var entity = {
            time: 0,
            state: { angles: vec3.create(), origin: vec3.create() },
            priorState: { angles: vec3.create(), origin: vec3.create() },
            nextState: { angles: vec3.create(), origin: vec3.create() }
        };
        this.entities.push(entity);
    }
};

World.prototype.loadModel = function(name) {
    var type = utils.getExtension(name);
    switch (type) {
        case 'bsp':
            var model = new Map(assets.load('pak/' + name));
            this.models.push(model);
            if (!this.map) { this.map = model; }
            console.log(name);
            break;
        case 'mdl':
            this.models.push(new Model(assets.load('pak/' + name)));
            break;
        default:
            this.models.push(null);
            break;
    }
};

World.prototype.spawnStatic = function(baseline) {
    var entity = { state: baseline };
    this.statics.push(entity);
};

World.prototype.spawnEntity = function(id, baseline) {
    this.entities[id].state = baseline;
};

World.prototype.update = function(dt) {

    for (var e = 0; e < this.entities.length; e++) {
        var entity = this.entities[e];
        if (!entity) continue;

        for (var c = 0; c < 3; c++) {
            var dp = entity.nextState.origin[c] - entity.priorState.origin[c];
            entity.state.origin[c] = entity.priorState.origin[c] + dp * dt;

            var da = entity.nextState.angles[c] - entity.priorState.angles[c];
            if (da > 180) da -= 360;
            else if (da < -180) da += 360;
            entity.state.angles[c] = entity.priorState.angles[c] + da * dt;
        }
    }
};

World.prototype.draw = function(p, viewEntity) {
    var m = utils.quakeIdentity(mat4.create());
    var entity = this.entities[viewEntity];
    var origin = entity.state.origin;
    var angles = entity.state.angles;
    mat4.rotateY(m, m, utils.deg2Rad(-angles[0]));
    mat4.rotateZ(m, m, utils.deg2Rad(-angles[1]));
    mat4.translate(m, m, [-origin[0], -origin[1], -origin[2] - 22]);
    this.map.draw(p, m);

    this.drawStatics(p, m);
    this.drawEntities(p, m, viewEntity);
};

World.prototype.drawStatics = function(p, m) {
    var mm = mat4.create();
    for (var s = 0; s < this.statics.length; s++) {
        var state = this.statics[s].state;
        var model = this.models[state.modelIndex];
        mat4.translate(mm, m, state.origin);
        model.draw(p, mm, 0, 0);
    }
};

World.prototype.drawEntities = function(p, m, viewEntity) {
    var mm = mat4.create();
    for (var e = 0; e < this.entities.length; e++) {
        if (e === viewEntity)
            continue;

        var state = this.entities[e].state;
        var model = this.models[state.modelIndex];
        if (model) {
            mm = mat4.translate(mm, m, state.origin);
            mat4.rotateZ(mm, mm, utils.deg2Rad(state.angles[1]));
            model.draw(p, mm, 0, state.frame);
        }
    }
};

module.exports = exports = World;
}).call(this,require("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/world.js","/")
},{"1YiZ5S":5,"assets":6,"buffer":2,"map":29,"model":30,"utils":35}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9lcmxhbmRyYW52aW5nZS9naXQvd2ViZ2wtcXVha2Uvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2VybGFuZHJhbnZpbmdlL2dpdC93ZWJnbC1xdWFrZS9qcy9mYWtlX2Q2YjNjNGE5LmpzIiwiL1VzZXJzL2VybGFuZHJhbnZpbmdlL2dpdC93ZWJnbC1xdWFrZS9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCIvVXNlcnMvZXJsYW5kcmFudmluZ2UvZ2l0L3dlYmdsLXF1YWtlL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCIvVXNlcnMvZXJsYW5kcmFudmluZ2UvZ2l0L3dlYmdsLXF1YWtlL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi9Vc2Vycy9lcmxhbmRyYW52aW5nZS9naXQvd2ViZ2wtcXVha2Uvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwianMvYXNzZXRzLmpzIiwianMvY2xpZW50LmpzIiwianMvZmlsZS5qcyIsImpzL2Zvcm1hdHMvYnNwLmpzIiwianMvZm9ybWF0cy9tZGwuanMiLCJqcy9mb3JtYXRzL3Bhay5qcyIsImpzL2Zvcm1hdHMvcGFsZXR0ZS5qcyIsImpzL2Zvcm1hdHMvd2FkLmpzIiwianMvZ2wvVGV4dHVyZS5qcyIsImpzL2dsL2F0bGFzLmpzIiwianMvZ2wvZm9udC5qcyIsImpzL2dsL2dsLmpzIiwianMvZ2wvbGlnaHRtYXAuanMiLCJqcy9nbC9zaGFkZXIuanMiLCJqcy9nbC9zcHJpdGVzLmpzIiwianMvZ2wvdGV4dHVyZS5qcyIsImpzL2lucHV0LmpzIiwianMvaW5zdGFsbGVyL2RpYWxvZy5qcyIsImpzL2luc3RhbGxlci9pbnN0YWxsZXIuanMiLCJqcy9saWIvZ2wtbWF0cml4LW1pbi5qcyIsImpzL2xpYi9saDQuanMiLCJqcy9saWIvemlwLmpzIiwianMvbGlnaHRtYXBzLmpzIiwianMvbWFwLmpzIiwianMvbW9kZWwuanMiLCJqcy9wcm90b2NvbC5qcyIsImpzL3NldHRpbmdzLmpzIiwianMvdWkvY29uc29sZS5qcyIsImpzL3VpL3N0YXR1c2Jhci5qcyIsImpzL3V0aWxzLmpzIiwianMvd29ybGQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2bENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMS9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXG52YXIgd2ViZ2wgPSByZXF1aXJlKCdnbC9nbCcpO1xudmFyIElucHV0ID0gcmVxdWlyZSgnaW5wdXQnKTtcbnZhciBTdGF0dXNCYXIgPSByZXF1aXJlKCd1aS9zdGF0dXNiYXInKTtcbnZhciBDbGllbnQgPSByZXF1aXJlKCdjbGllbnQnKTtcbnZhciBhc3NldHMgPSByZXF1aXJlKCdhc3NldHMnKTtcbnZhciBjb24gPSByZXF1aXJlKCd1aS9jb25zb2xlJyk7XG52YXIgaW5zdGFsbGVyID0gcmVxdWlyZSgnaW5zdGFsbGVyL2luc3RhbGxlcicpO1xuXG5pZiAoIXdpbmRvdy5yZXF1ZXN0RnJhbWUpIHtcbiAgICB3aW5kb3cucmVxdWVzdEZyYW1lID0gKCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgIHdpbmRvdy5vUmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCBjYWxsYmFjaywgMTAwMCAvIDYwICk7XG4gICAgICAgICAgICB9O1xuICAgIH0pKCk7XG59XG5cblF1YWtlID0gZnVuY3Rpb24oKSB7fTtcbnZhciB0aWNrcyA9IDEwMDAwMDAwMDtcblxudmFyIHRpY2sgPSBmdW5jdGlvbih0aW1lKSB7XG4gICAgaWYgKHRpY2tzLS0gPCAwKSByZXR1cm47XG4gICAgcmVxdWVzdEZyYW1lKHRpY2spO1xuICAgIFF1YWtlLmluc3RhbmNlLnRpY2sodGltZSk7XG59O1xuXG5RdWFrZS5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKHRpbWUpIHtcblxuICAgIGNvbi51cGRhdGUodGltZSk7XG4gICAgdGhpcy5jbGllbnQudXBkYXRlKHRpbWUpO1xuICAgIHRoaXMuaGFuZGxlSW5wdXQoKTtcblxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5CTEVORCk7XG5cbiAgICBpZiAodGhpcy5jbGllbnQudmlld0VudGl0eSA+IDApXG4gICAgICAgIHRoaXMuY2xpZW50LndvcmxkLmRyYXcodGhpcy5wcm9qZWN0aW9uLCB0aGlzLmNsaWVudC52aWV3RW50aXR5KTtcblxuICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgdGhpcy5zdGF0dXNCYXIuZHJhdyh0aGlzLm9ydGhvKTtcbiAgICBjb24uZHJhdyh0aGlzLm9ydGhvKTtcbn07XG5cbi8vIFRlbXAuIGNvbnRyb2xsZXIuXG5RdWFrZS5wcm90b3R5cGUuaGFuZGxlSW5wdXQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5jbGllbnQudmlld0VudGl0eSA9PT0gLTEpXG4gICAgICAgIHJldHVybjtcblxuXG5cbiAgICAvKlxuICAgIHZhciBhbmdsZSA9IHV0aWxzLmRlZzJSYWQodGhpcy5jbGllbnQudmlld0FuZ2xlc1sxXSk7XG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy5jbGllbnQuZW50aXRpZXNbdGhpcy5jbGllbnQudmlld0VudGl0eV0ubmV4dFN0YXRlLm9yaWdpbjtcbiAgICB2YXIgc3BlZWQgPSA1LjA7XG5cbiAgICBpZiAodGhpcy5pbnB1dC5sZWZ0KVxuICAgICAgICB0aGlzLmNsaWVudC52aWV3QW5nbGVzWzFdIC09IDI7XG4gICAgaWYgKHRoaXMuaW5wdXQucmlnaHQpXG4gICAgICAgIHRoaXMuY2xpZW50LnZpZXdBbmdsZXNbMV0gKz0gMjtcbiAgICBpZiAodGhpcy5pbnB1dC51cCkge1xuICAgICAgICB0aGlzLmNsaWVudC5kZW1vID0gbnVsbDtcbiAgICAgICAgcG9zaXRpb25bMF0gKz0gTWF0aC5jb3MoYW5nbGUpICogc3BlZWQ7XG4gICAgICAgIHBvc2l0aW9uWzFdIC09IE1hdGguc2luKGFuZ2xlKSAqIHNwZWVkO1xuICAgIH1cbiAgICBpZiAodGhpcy5pbnB1dC5kb3duKSB7XG4gICAgICAgIHBvc2l0aW9uWzBdIC09IE1hdGguY29zKGFuZ2xlKSAqIHNwZWVkO1xuICAgICAgICBwb3NpdGlvblsxXSArPSBNYXRoLnNpbihhbmdsZSkgKiBzcGVlZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5wdXQuZmx5VXApXG4gICAgICAgIHBvc2l0aW9uWzJdICs9IDEwO1xuICAgIGlmICh0aGlzLmlucHV0LmZseURvd24pXG4gICAgICAgIHBvc2l0aW9uWzJdIC09IDEwO1xuICAgICovXG59O1xuXG5RdWFrZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICBRdWFrZS5pbnN0YW5jZSA9IHRoaXM7XG4gICAgd2ViZ2wuaW5pdCgnY2FudmFzJyk7XG4gICAgdGhpcy5vcnRobyA9IG1hdDQub3J0aG8obWF0NC5jcmVhdGUoKSwgMCwgZ2wud2lkdGgsIGdsLmhlaWdodCwgMCwgLTEwLCAxMCk7XG4gICAgdGhpcy5wcm9qZWN0aW9uID0gbWF0NC5wZXJzcGVjdGl2ZShtYXQ0LmNyZWF0ZSgpLCA2OC4wMywgZ2wud2lkdGggLyBnbC5oZWlnaHQsIDAuMSwgNDA5Nik7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaW5zdGFsbGVyLnN0YXJ0KGZ1bmN0aW9uKHBhaykge1xuICAgICAgICBhc3NldHMuYWRkKCdzaGFkZXJzL2NvbG9yMmQuc2hhZGVyJyk7XG4gICAgICAgIGFzc2V0cy5hZGQoJ3NoYWRlcnMvbW9kZWwuc2hhZGVyJyk7XG4gICAgICAgIGFzc2V0cy5hZGQoJ3NoYWRlcnMvdGV4dHVyZTJkLnNoYWRlcicpO1xuICAgICAgICBhc3NldHMuYWRkKCdzaGFkZXJzL3dvcmxkLnNoYWRlcicpO1xuICAgICAgICBhc3NldHMucHJlY2FjaGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb24uaW5pdCgpO1xuICAgICAgICAgICAgc2VsZi5pbnB1dCA9IG5ldyBJbnB1dCgpO1xuICAgICAgICAgICAgc2VsZi5zdGF0dXNCYXIgPSBuZXcgU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICBzZWxmLmNsaWVudCA9IG5ldyBDbGllbnQoKTtcbiAgICAgICAgICAgIHNlbGYuY2xpZW50LnBsYXlEZW1vKCdkZW1vMS5kZW0nKTtcbiAgICAgICAgICAgIHRpY2soKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5cblxuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmFrZV9kNmIzYzRhOS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTJcblxuLyoqXG4gKiBJZiBgQnVmZmVyLl91c2VUeXBlZEFycmF5c2A6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChjb21wYXRpYmxlIGRvd24gdG8gSUU2KVxuICovXG5CdWZmZXIuX3VzZVR5cGVkQXJyYXlzID0gKGZ1bmN0aW9uICgpIHtcbiAgLy8gRGV0ZWN0IGlmIGJyb3dzZXIgc3VwcG9ydHMgVHlwZWQgQXJyYXlzLiBTdXBwb3J0ZWQgYnJvd3NlcnMgYXJlIElFIDEwKywgRmlyZWZveCA0KyxcbiAgLy8gQ2hyb21lIDcrLCBTYWZhcmkgNS4xKywgT3BlcmEgMTEuNissIGlPUyA0LjIrLiBJZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IGFkZGluZ1xuICAvLyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMsIHRoZW4gdGhhdCdzIHRoZSBzYW1lIGFzIG5vIGBVaW50OEFycmF5YCBzdXBwb3J0XG4gIC8vIGJlY2F1c2Ugd2UgbmVlZCB0byBiZSBhYmxlIHRvIGFkZCBhbGwgdGhlIG5vZGUgQnVmZmVyIEFQSSBtZXRob2RzLiBUaGlzIGlzIGFuIGlzc3VlXG4gIC8vIGluIEZpcmVmb3ggNC0yOS4gTm93IGZpeGVkOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzhcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgLy8gQ2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufSkoKVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBCdWZmZXIpKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pXG5cbiAgdmFyIHR5cGUgPSB0eXBlb2Ygc3ViamVjdFxuXG4gIC8vIFdvcmthcm91bmQ6IG5vZGUncyBiYXNlNjQgaW1wbGVtZW50YXRpb24gYWxsb3dzIGZvciBub24tcGFkZGVkIHN0cmluZ3NcbiAgLy8gd2hpbGUgYmFzZTY0LWpzIGRvZXMgbm90LlxuICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnICYmIHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ViamVjdCA9IHN0cmluZ3RyaW0oc3ViamVjdClcbiAgICB3aGlsZSAoc3ViamVjdC5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgICBzdWJqZWN0ID0gc3ViamVjdCArICc9J1xuICAgIH1cbiAgfVxuXG4gIC8vIEZpbmQgdGhlIGxlbmd0aFxuICB2YXIgbGVuZ3RoXG4gIGlmICh0eXBlID09PSAnbnVtYmVyJylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdClcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKVxuICAgIGxlbmd0aCA9IGNvZXJjZShzdWJqZWN0Lmxlbmd0aCkgLy8gYXNzdW1lIHRoYXQgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgZWxzZVxuICAgIHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgbmVlZHMgdG8gYmUgYSBudW1iZXIsIGFycmF5IG9yIHN0cmluZy4nKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICAvLyBQcmVmZXJyZWQ6IFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYnVmID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBUSElTIGluc3RhbmNlIG9mIEJ1ZmZlciAoY3JlYXRlZCBieSBgbmV3YClcbiAgICBidWYgPSB0aGlzXG4gICAgYnVmLmxlbmd0aCA9IGxlbmd0aFxuICAgIGJ1Zi5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgaVxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgICAgZWxzZVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0W2ldXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbi8vIFNUQVRJQyBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKGIpIHtcbiAgcmV0dXJuICEhKGIgIT09IG51bGwgJiYgYiAhPT0gdW5kZWZpbmVkICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGZ1bmN0aW9uIChzdHIsIGVuY29kaW5nKSB7XG4gIHZhciByZXRcbiAgc3RyID0gc3RyICsgJydcbiAgc3dpdGNoIChlbmNvZGluZyB8fCAndXRmOCcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCAvIDJcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFRvQnl0ZXMoc3RyKS5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gZW5jb2RpbmcnKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBhc3NlcnQoaXNBcnJheShsaXN0KSwgJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3QsIFt0b3RhbExlbmd0aF0pXFxuJyArXG4gICAgICAnbGlzdCBzaG91bGQgYmUgYW4gQXJyYXkuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdG90YWxMZW5ndGggIT09ICdudW1iZXInKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuLy8gQlVGRkVSIElOU1RBTkNFIE1FVEhPRFNcbi8vID09PT09PT09PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIF9oZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGFzc2VydChzdHJMZW4gJSAyID09PSAwLCAnSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgYXNzZXJ0KCFpc05hTihieXRlKSwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gYnl0ZVxuICB9XG4gIEJ1ZmZlci5fY2hhcnNXcml0dGVuID0gaSAqIDJcbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gX3V0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9hc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IEJ1ZmZlci5fY2hhcnNXcml0dGVuID1cbiAgICBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBfYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gX3V0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gU3VwcG9ydCBib3RoIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZylcbiAgLy8gYW5kIHRoZSBsZWdhY3kgKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIGlmICghaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHsgIC8vIGxlZ2FjeVxuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcgfHwgJ3V0ZjgnKS50b0xvd2VyQ2FzZSgpXG4gIHN0YXJ0ID0gTnVtYmVyKHN0YXJ0KSB8fCAwXG4gIGVuZCA9IChlbmQgIT09IHVuZGVmaW5lZClcbiAgICA/IE51bWJlcihlbmQpXG4gICAgOiBlbmQgPSBzZWxmLmxlbmd0aFxuXG4gIC8vIEZhc3RwYXRoIGVtcHR5IHN0cmluZ3NcbiAgaWYgKGVuZCA9PT0gc3RhcnQpXG4gICAgcmV0dXJuICcnXG5cbiAgdmFyIHJldFxuICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IF9oZXhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSBfdXRmOFNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IF9hc2NpaVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICByZXQgPSBfYmluYXJ5U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IF9iYXNlNjRTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gX3V0ZjE2bGVTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uICh0YXJnZXQsIHRhcmdldF9zdGFydCwgc3RhcnQsIGVuZCkge1xuICB2YXIgc291cmNlID0gdGhpc1xuXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICghdGFyZ2V0X3N0YXJ0KSB0YXJnZXRfc3RhcnQgPSAwXG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgc291cmNlLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBhc3NlcnQodGFyZ2V0X3N0YXJ0ID49IDAgJiYgdGFyZ2V0X3N0YXJ0IDwgdGFyZ2V0Lmxlbmd0aCxcbiAgICAgICd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCBzb3VyY2UubGVuZ3RoLCAnc291cmNlU3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gc291cmNlLmxlbmd0aCwgJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpXG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBlbmQgLSBzdGFydClcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc3RhcnRcblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAobGVuIDwgMTAwIHx8ICFCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbmZ1bmN0aW9uIF9iYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gX3V0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXMgPSAnJ1xuICB2YXIgdG1wID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ1ZltpXSA8PSAweDdGKSB7XG4gICAgICByZXMgKz0gZGVjb2RlVXRmOENoYXIodG1wKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICAgICAgdG1wID0gJydcbiAgICB9IGVsc2Uge1xuICAgICAgdG1wICs9ICclJyArIGJ1ZltpXS50b1N0cmluZygxNilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzICsgZGVjb2RlVXRmOENoYXIodG1wKVxufVxuXG5mdW5jdGlvbiBfYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspXG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIF9iaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBfYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIF9oZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2krMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gY2xhbXAoc3RhcnQsIGxlbiwgMClcbiAgZW5kID0gY2xhbXAoZW5kLCBsZW4sIGxlbilcblxuICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZFVJbnQxNiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWxcbiAgaWYgKGxpdHRsZUVuZGlhbikge1xuICAgIHZhbCA9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdIDw8IDhcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDEgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDFdXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MzIgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICBpZiAob2Zmc2V0ICsgMiA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAyXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gICAgdmFsIHw9IGJ1ZltvZmZzZXRdXG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldCArIDNdIDw8IDI0ID4+PiAwKVxuICB9IGVsc2Uge1xuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsID0gYnVmW29mZnNldCArIDFdIDw8IDE2XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDJdIDw8IDhcbiAgICBpZiAob2Zmc2V0ICsgMyA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgM11cbiAgICB2YWwgPSB2YWwgKyAoYnVmW29mZnNldF0gPDwgMjQgPj4+IDApXG4gIH1cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZFVJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLFxuICAgICAgICAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgdmFyIG5lZyA9IHRoaXNbb2Zmc2V0XSAmIDB4ODBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xXG4gIGVsc2VcbiAgICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbmZ1bmN0aW9uIF9yZWFkSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsID0gX3JlYWRVSW50MTYoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgdHJ1ZSlcbiAgdmFyIG5lZyA9IHZhbCAmIDB4ODAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDMyKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDAwMDAwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmZmZmZmZmIC0gdmFsICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZEZsb2F0IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRGbG9hdCh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkRG91YmxlIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgKyA3IDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHJldHVybiBpZWVlNzU0LnJlYWQoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRG91YmxlKHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZilcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVyblxuXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmYpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGxlbiAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPVxuICAgICAgICAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ3RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZ1aW50KHZhbHVlLCAweGZmZmZmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgPCB0aGlzLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmLCAtMHg4MClcbiAgfVxuXG4gIGlmIChvZmZzZXQgPj0gdGhpcy5sZW5ndGgpXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgdGhpcy53cml0ZVVJbnQ4KHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgdGhpcy53cml0ZVVJbnQ4KDB4ZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZiwgLTB4ODAwMClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIF93cml0ZVVJbnQxNihidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG4gIGVsc2VcbiAgICBfd3JpdGVVSW50MTYoYnVmLCAweGZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MzIoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgMHhmZmZmZmZmZiArIHZhbHVlICsgMSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZJRUVFNzU0KHZhbHVlLCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsXG4gICAgICAgICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiAodmFsdWUsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCF2YWx1ZSkgdmFsdWUgPSAwXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCkgZW5kID0gdGhpcy5sZW5ndGhcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUuY2hhckNvZGVBdCgwKVxuICB9XG5cbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKSwgJ3ZhbHVlIGlzIG5vdCBhIG51bWJlcicpXG4gIGFzc2VydChlbmQgPj0gc3RhcnQsICdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBhc3NlcnQoc3RhcnQgPj0gMCAmJiBzdGFydCA8IHRoaXMubGVuZ3RoLCAnc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChlbmQgPj0gMCAmJiBlbmQgPD0gdGhpcy5sZW5ndGgsICdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICB0aGlzW2ldID0gdmFsdWVcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvdXQgPSBbXVxuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIG91dFtpXSA9IHRvSGV4KHRoaXNbaV0pXG4gICAgaWYgKGkgPT09IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMpIHtcbiAgICAgIG91dFtpICsgMV0gPSAnLi4uJ1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cbiAgcmV0dXJuICc8QnVmZmVyICcgKyBvdXQuam9pbignICcpICsgJz4nXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBgQXJyYXlCdWZmZXJgIHdpdGggdGhlICpjb3BpZWQqIG1lbW9yeSBvZiB0aGUgYnVmZmVyIGluc3RhbmNlLlxuICogQWRkZWQgaW4gTm9kZSAwLjEyLiBPbmx5IGF2YWlsYWJsZSBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgQXJyYXlCdWZmZXIuXG4gKi9cbkJ1ZmZlci5wcm90b3R5cGUudG9BcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKVxuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbi8vIHNsaWNlKHN0YXJ0LCBlbmQpXG5mdW5jdGlvbiBjbGFtcCAoaW5kZXgsIGxlbiwgZGVmYXVsdFZhbHVlKSB7XG4gIGlmICh0eXBlb2YgaW5kZXggIT09ICdudW1iZXInKSByZXR1cm4gZGVmYXVsdFZhbHVlXG4gIGluZGV4ID0gfn5pbmRleDsgIC8vIENvZXJjZSB0byBpbnRlZ2VyLlxuICBpZiAoaW5kZXggPj0gbGVuKSByZXR1cm4gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgaW5kZXggKz0gbGVuXG4gIGlmIChpbmRleCA+PSAwKSByZXR1cm4gaW5kZXhcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gY29lcmNlIChsZW5ndGgpIHtcbiAgLy8gQ29lcmNlIGxlbmd0aCB0byBhIG51bWJlciAocG9zc2libHkgTmFOKSwgcm91bmQgdXBcbiAgLy8gaW4gY2FzZSBpdCdzIGZyYWN0aW9uYWwgKGUuZy4gMTIzLjQ1NikgdGhlbiBkbyBhXG4gIC8vIGRvdWJsZSBuZWdhdGUgdG8gY29lcmNlIGEgTmFOIHRvIDAuIEVhc3ksIHJpZ2h0P1xuICBsZW5ndGggPSB+fk1hdGguY2VpbCgrbGVuZ3RoKVxuICByZXR1cm4gbGVuZ3RoIDwgMCA/IDAgOiBsZW5ndGhcbn1cblxuZnVuY3Rpb24gaXNBcnJheSAoc3ViamVjdCkge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHN1YmplY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN1YmplY3QpID09PSAnW29iamVjdCBBcnJheV0nXG4gIH0pKHN1YmplY3QpXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXlpc2ggKHN1YmplY3QpIHtcbiAgcmV0dXJuIGlzQXJyYXkoc3ViamVjdCkgfHwgQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpIHx8XG4gICAgICBzdWJqZWN0ICYmIHR5cGVvZiBzdWJqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mIHN1YmplY3QubGVuZ3RoID09PSAnbnVtYmVyJ1xufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGIgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmIChiIDw9IDB4N0YpXG4gICAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSlcbiAgICBlbHNlIHtcbiAgICAgIHZhciBzdGFydCA9IGlcbiAgICAgIGlmIChiID49IDB4RDgwMCAmJiBiIDw9IDB4REZGRikgaSsrXG4gICAgICB2YXIgaCA9IGVuY29kZVVSSUNvbXBvbmVudChzdHIuc2xpY2Uoc3RhcnQsIGkrMSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGgubGVuZ3RoOyBqKyspXG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHBvc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKVxuICAgICAgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBkZWNvZGVVdGY4Q2hhciAoc3RyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChzdHIpXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCkgLy8gVVRGIDggaW52YWxpZCBjaGFyXG4gIH1cbn1cblxuLypcbiAqIFdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHZhbHVlIGlzIGEgdmFsaWQgaW50ZWdlci4gVGhpcyBtZWFucyB0aGF0IGl0XG4gKiBpcyBub24tbmVnYXRpdmUuIEl0IGhhcyBubyBmcmFjdGlvbmFsIGNvbXBvbmVudCBhbmQgdGhhdCBpdCBkb2VzIG5vdFxuICogZXhjZWVkIHRoZSBtYXhpbXVtIGFsbG93ZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmdWludCAodmFsdWUsIG1heCkge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPj0gMCwgJ3NwZWNpZmllZCBhIG5lZ2F0aXZlIHZhbHVlIGZvciB3cml0aW5nIGFuIHVuc2lnbmVkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGlzIGxhcmdlciB0aGFuIG1heGltdW0gdmFsdWUgZm9yIHR5cGUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZnNpbnQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxuICBhc3NlcnQoTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlLCAndmFsdWUgaGFzIGEgZnJhY3Rpb25hbCBjb21wb25lbnQnKVxufVxuXG5mdW5jdGlvbiB2ZXJpZklFRUU3NTQgKHZhbHVlLCBtYXgsIG1pbikge1xuICBhc3NlcnQodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJywgJ2Nhbm5vdCB3cml0ZSBhIG5vbi1udW1iZXIgYXMgYSBudW1iZXInKVxuICBhc3NlcnQodmFsdWUgPD0gbWF4LCAndmFsdWUgbGFyZ2VyIHRoYW4gbWF4aW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KHZhbHVlID49IG1pbiwgJ3ZhbHVlIHNtYWxsZXIgdGhhbiBtaW5pbXVtIGFsbG93ZWQgdmFsdWUnKVxufVxuXG5mdW5jdGlvbiBhc3NlcnQgKHRlc3QsIG1lc3NhZ2UpIHtcbiAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnRmFpbGVkIGFzc2VydGlvbicpXG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzXCIsXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFBMVVNfVVJMX1NBRkUgPSAnLScuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0hfVVJMX1NBRkUgPSAnXycuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTIHx8XG5cdFx0ICAgIGNvZGUgPT09IFBMVVNfVVJMX1NBRkUpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIIHx8XG5cdFx0ICAgIGNvZGUgPT09IFNMQVNIX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9iYXNlNjQtanMvbGliL2I2NC5qc1wiLFwiLy4uL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIG5CaXRzID0gLTcsXG4gICAgICBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDAsXG4gICAgICBkID0gaXNMRSA/IC0xIDogMSxcbiAgICAgIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gbSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGMsXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApLFxuICAgICAgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpLFxuICAgICAgZCA9IGlzTEUgPyAxIDogLTEsXG4gICAgICBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzXCIsXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0XCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIsXCIvLi4vbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzc1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBTaGFkZXIgPSByZXF1aXJlKCdnbC9zaGFkZXInKTtcbnZhciBUZXh0dXJlID0gcmVxdWlyZSgnZ2wvdGV4dHVyZScpO1xudmFyIFBhayA9IHJlcXVpcmUoJ2Zvcm1hdHMvcGFrJyk7XG52YXIgV2FkID0gcmVxdWlyZSgnZm9ybWF0cy93YWQnKTtcbnZhciBQYWxldHRlID0gcmVxdWlyZSgnZm9ybWF0cy9wYWxldHRlJyk7XG52YXIgQnNwID0gcmVxdWlyZSgnZm9ybWF0cy9ic3AnKTtcbnZhciBNZGwgPSByZXF1aXJlKCdmb3JtYXRzL21kbCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgndXRpbHMnKTtcblxuZnVuY3Rpb24gZ2V0TmFtZShwYXRoKSB7XG4gICAgdmFyIGluZGV4MSA9IHBhdGgubGFzdEluZGV4T2YoJy8nKTtcbiAgICB2YXIgaW5kZXgyID0gcGF0aC5sYXN0SW5kZXhPZignLicpO1xuICAgIHJldHVybiBwYXRoLnN1YnN0cihpbmRleDEgKyAxLCBpbmRleDIgLSBpbmRleDEgLSAxKTtcbn1cblxuZnVuY3Rpb24gZG93bmxvYWQoaXRlbSwgZG9uZSkge1xuICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgcmVxdWVzdC5vcGVuKCdHRVQnLCBpdGVtLnVybCwgdHJ1ZSk7XG4gICAgcmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKCd0ZXh0L3BsYWluOyBjaGFyc2V0PXgtdXNlci1kZWZpbmVkJyk7XG4gICAgaWYgKGl0ZW0uYmluYXJ5KVxuICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG4gICAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAocmVxdWVzdC5zdGF0dXMgIT09IDIwMClcbiAgICAgICAgICAgIHRocm93ICdVbmFibGUgdG8gcmVhZCBmaWxlIGZyb20gdXJsOiAnICsgaXRlbS5uYW1lO1xuXG4gICAgICAgIHZhciBkYXRhID0gaXRlbS5iaW5hcnkgP1xuICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkocmVxdWVzdC5yZXNwb25zZSkgOiByZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgZG9uZShpdGVtLCBkYXRhKTtcbiAgICB9O1xuXG4gICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhyb3cgJ1VuYWJsZSB0byByZWFkIGZpbGUgZnJvbSB1cmw6ICcgKyByZXF1ZXN0LnN0YXR1c1RleHQ7XG4gICAgfTtcbiAgICByZXF1ZXN0LnNlbmQobnVsbCk7XG59XG5cbnZhciBBc3NldHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnBlbmRpbmcgPSBbXTtcbiAgICB0aGlzLnNoYWRlcnMgPSB7fTtcbn07XG5cbkFzc2V0cy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odXJsLCB0eXBlKSB7XG4gICAgdHlwZSA9IHR5cGUgfHwgdXRpbHMuZ2V0RXh0ZW5zaW9uKHVybCk7XG4gICAgaWYgKCF0eXBlKVxuICAgICAgICB0aHJvdyAnRXJyb3I6IFVuYWJsZSB0byBkZXRlcm1pbmUgdHlwZSBmb3IgYXNzZXQ6ICcgKyBuYW1lO1xuICAgIHZhciBiaW5hcnkgPSB0eXBlICE9PSAnc2hhZGVyJztcbiAgICB0aGlzLnBlbmRpbmcucHVzaCh7IHVybDogdXJsLCBuYW1lOiBnZXROYW1lKHVybCksIHR5cGU6IHR5cGUsIGJpbmFyeTogYmluYXJ5IH0pO1xufTtcblxuQXNzZXRzLnByb3RvdHlwZS5zZXRQYWsgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy5wYWsgPSBuZXcgUGFrKGRhdGEpO1xuICAgIHRoaXMud2FkID0gbmV3IFdhZCh0aGlzLnBhay5sb2FkKCdnZngud2FkJykpO1xuICAgIHRoaXMucGFsZXR0ZSA9IG5ldyBQYWxldHRlKHRoaXMucGFrLmxvYWQoJ2dmeC9wYWxldHRlLmxtcCcpKTtcbn07XG5cbkFzc2V0cy5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24oaXRlbSwgZGF0YSkge1xuICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3NoYWRlcic6XG4gICAgICAgICAgICB0aGlzLnNoYWRlcnNbaXRlbS5uYW1lXSA9IG5ldyBTaGFkZXIoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDogdGhyb3cgJ0Vycm9yOiBVbmtub3duIHR5cGUgbG9hZGVkOiAnICsgaXRlbS50eXBlO1xuICAgIH1cbn07XG5cbkFzc2V0cy5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcblxuICAgIHZhciBpbmRleCA9IG5hbWUuaW5kZXhPZignLycpO1xuICAgIHZhciBsb2NhdGlvbiA9IG5hbWUuc3Vic3RyKDAsIGluZGV4KTtcbiAgICB2YXIgdHlwZSA9IHV0aWxzLmdldEV4dGVuc2lvbihuYW1lKSB8fCAndGV4dHVyZSc7XG4gICAgbmFtZSA9IG5hbWUuc3Vic3RyKGluZGV4ICsgMSk7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSAnYnNwJzpcbiAgICAgICAgICAgIHJldHVybiBuZXcgQnNwKHRoaXMucGFrLmxvYWQobmFtZSkpO1xuICAgICAgICBjYXNlICdtZGwnOlxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNZGwobmFtZSwgdGhpcy5wYWsubG9hZChuYW1lKSk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5wYWxldHRlID0gdGhpcy5wYWxldHRlO1xuICAgIHN3aXRjaChsb2NhdGlvbikge1xuICAgICAgICBjYXNlICdwYWsnOlxuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLnBhay5sb2FkKG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0dXJlKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICBjYXNlICd3YWQnOlxuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLndhZC5nZXQobmFtZSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFRleHR1cmUoZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyAnRXJyb3I6IENhbm5vdCBsb2FkIGZpbGVzIG91dHNpZGUgUEFLL1dBRDogJyArIG5hbWU7XG4gICAgfVxufTtcblxuQXNzZXRzLnByb3RvdHlwZS5wcmVjYWNoZSA9IGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB2YXIgdG90YWwgPSB0aGlzLnBlbmRpbmcubGVuZ3RoO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucGVuZGluZykge1xuICAgICAgICB2YXIgcGVuZGluZyA9IHRoaXMucGVuZGluZ1tpXTtcbiAgICAgICAgZG93bmxvYWQocGVuZGluZywgZnVuY3Rpb24oaXRlbSwgZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5pbnNlcnQoaXRlbSwgZGF0YSk7XG4gICAgICAgICAgICBpZiAoLS10b3RhbCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5wZW5kaW5nID0gW107XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbmV3IEFzc2V0cygpO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9hc3NldHMuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgYXNzZXRzID0gcmVxdWlyZSgnYXNzZXRzJyk7XG52YXIgY29uID0gcmVxdWlyZSgndWkvY29uc29sZScpO1xudmFyIFByb3RvY29sID0gcmVxdWlyZSgncHJvdG9jb2wnKTtcbnZhciBXb3JsZCA9IHJlcXVpcmUoJ3dvcmxkJyk7XG5cbnZhciBDbGllbnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnZpZXdFbnRpdHkgPSAtMTtcbiAgICB0aGlzLnRpbWUgPSB7IG9sZFNlcnZlclRpbWU6IDAsIHNlcnZlclRpbWU6IDAsIG9sZENsaWVudFRpbWU6IDAsIGNsaWVudFRpbWU6IDAgfTtcbiAgICB0aGlzLndvcmxkID0gbmV3IFdvcmxkKCk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLnBsYXlEZW1vID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBkZW1vID0gYXNzZXRzLnBhay5sb2FkKG5hbWUpO1xuICAgIHdoaWxlIChkZW1vLnJlYWRVSW50OCgpICE9PSAxMCk7XG4gICAgdGhpcy5kZW1vID0gZGVtbztcbn07XG5cbkNsaWVudC5wcm90b3R5cGUucmVhZEZyb21TZXJ2ZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGVtbyA9IHRoaXMuZGVtbztcbiAgICBpZiAoIWRlbW8gfHwgZGVtby5lb2YoKSkgcmV0dXJuO1xuXG4gICAgdmFyIG1lc3NhZ2VTaXplID0gZGVtby5yZWFkSW50MzIoKTtcblxuICAgIHZhciBhbmdsZXMgPSBbZGVtby5yZWFkRmxvYXQoKSwgZGVtby5yZWFkRmxvYXQoKSwgZGVtby5yZWFkRmxvYXQoKV07XG4gICAgaWYgKHRoaXMudmlld0VudGl0eSAhPT0gLTEpIHtcbiAgICAgICAgdmFyIHZlID0gdGhpcy53b3JsZC5lbnRpdGllc1t0aGlzLnZpZXdFbnRpdHldO1xuICAgICAgICB2ZWMzLnNldCh2ZS5zdGF0ZS5hbmdsZXMsIGFuZ2xlc1swXSwgYW5nbGVzWzFdLCBhbmdsZXNbMl0pO1xuICAgIH1cblxuICAgIHZhciBtc2cgPSBkZW1vLnJlYWQobWVzc2FnZVNpemUpO1xuICAgIHZhciBjbWQgPSAwO1xuICAgIHdoaWxlIChjbWQgIT09IC0xICYmICFtc2cuZW9mKCkpIHtcbiAgICAgICAgY21kID0gbXNnLnJlYWRVSW50OCgpO1xuICAgICAgICBpZiAoY21kICYgMTI4KSB7XG4gICAgICAgICAgICB0aGlzLnBhcnNlRmFzdFVwZGF0ZShjbWQgJiAxMjcsIG1zZyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoY21kKSB7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlckRpc2Nvbm5lY3Q6XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RJU0NPTk5FQ1QhJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5kZW1vID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlclVwZGF0ZVN0YXQ6XG4gICAgICAgICAgICAgICAgdmFyIHN0YXQgPSBtc2cucmVhZFVJbnQ4KCk7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gbXNnLnJlYWRJbnQzMigpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJTZXRWaWV3OlxuICAgICAgICAgICAgICAgIHRoaXMudmlld0VudGl0eSA9IG1zZy5yZWFkSW50MTYoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVyVGltZTpcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWUub2xkU2VydmVyVGltZSA9IHRoaXMudGltZS5zZXJ2ZXJUaW1lO1xuICAgICAgICAgICAgICAgIHRoaXMudGltZS5zZXJ2ZXJUaW1lID0gbXNnLnJlYWRGbG9hdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJTZXRBbmdsZTpcbiAgICAgICAgICAgICAgICB2YXIgeCA9IG1zZy5yZWFkSW50OCgpICogMS40MDYyNTtcbiAgICAgICAgICAgICAgICB2YXIgeSA9IG1zZy5yZWFkSW50OCgpICogMS40MDYyNTtcbiAgICAgICAgICAgICAgICB2YXIgeiA9IG1zZy5yZWFkSW50OCgpICogMS40MDYyNTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVyU291bmQ6XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZVNvdW5kKG1zZyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlclByaW50OlxuICAgICAgICAgICAgICAgIGNvbi5wcmludChtc2cucmVhZENTdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlckxpZ2h0U3R5bGU6XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlID0gbXNnLnJlYWRVSW50OCgpO1xuICAgICAgICAgICAgICAgIHZhciBwYXR0ZXJuID0gbXNnLnJlYWRDU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlckNsaWVudERhdGE6XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZUNsaWVudERhdGEobXNnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVyVXBkYXRlTmFtZTpcbiAgICAgICAgICAgICAgICB2YXIgY2xpZW50ID0gbXNnLnJlYWRVSW50OCgpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbXNnLnJlYWRDU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlclVwZGF0ZUZyYWdzOlxuICAgICAgICAgICAgICAgIHZhciBjbGllbnQgPSBtc2cucmVhZFVJbnQ4KCk7XG4gICAgICAgICAgICAgICAgdmFyIGZyYWdzID0gbXNnLnJlYWRJbnQxNigpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJVcGRhdGVDb2xvcnM6XG4gICAgICAgICAgICAgICAgdmFyIGNsaWVudCA9IG1zZy5yZWFkVUludDgoKTtcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JzID0gbXNnLnJlYWRVSW50OCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJQYXJ0aWNsZTpcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlUGFydGljbGUobXNnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVyU3R1ZmZUZXh0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZXJ2ZXJTdHVmZlRleHQ6ICcgKyBtc2cucmVhZENTdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlclRlbXBFbnRpdHk6XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZVRlbXBFbnRpdHkobXNnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVySW5mbzpcbiAgICAgICAgICAgICAgICB0aGlzLnBhcnNlU2VydmVySW5mbyhtc2cpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJTaWdub25OdW06XG4gICAgICAgICAgICAgICAgbXNnLnNraXAoMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlckNkVHJhY2s6XG4gICAgICAgICAgICAgICAgbXNnLnNraXAoMik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFByb3RvY29sLnNlcnZlclNwYXduU3RhdGljOlxuICAgICAgICAgICAgICAgIHRoaXMud29ybGQuc3Bhd25TdGF0aWModGhpcy5wYXJzZUJhc2VsaW5lKG1zZykpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJLaWxsZWRNb25zdGVyOlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJEYW1hZ2U6XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZURhbWFnZShtc2cpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJGb3VuZFNlY3JldDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVyU3Bhd25CYXNlbGluZTpcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkLnNwYXduRW50aXR5KG1zZy5yZWFkSW50MTYoKSwgdGhpcy5wYXJzZUJhc2VsaW5lKG1zZykpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQcm90b2NvbC5zZXJ2ZXJDZW50ZXJQcmludDpcbiAgICAgICAgICAgICAgICBjb24ucHJpbnQoJ0NFTlRFUjogJyArIG1zZy5yZWFkQ1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUHJvdG9jb2wuc2VydmVyU3Bhd25TdGF0aWNTb3VuZDpcbiAgICAgICAgICAgICAgICBtc2cuc2tpcCg5KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRocm93ICdVbmtub3duIGNtZDogJyArIGNtZDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkNsaWVudC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24odGltZSkge1xuICAgIGlmICghdGltZSkgcmV0dXJuO1xuXG4gICAgdGhpcy50aW1lLm9sZENsaWVudFRpbWUgPSB0aGlzLnRpbWUuY2xpZW50VGltZTtcbiAgICB0aGlzLnRpbWUuY2xpZW50VGltZSA9IHRpbWUgLyAxMDAwO1xuXG4gICAgaWYgKHRoaXMudGltZS5jbGllbnRUaW1lID4gdGhpcy50aW1lLnNlcnZlclRpbWUpXG4gICAgICAgIHRoaXMucmVhZEZyb21TZXJ2ZXIoKTtcblxuICAgIHZhciBzZXJ2ZXJEZWx0YSA9IHRoaXMudGltZS5zZXJ2ZXJUaW1lIC0gdGhpcy50aW1lLm9sZFNlcnZlclRpbWUgfHwgMC4xO1xuICAgIGlmIChzZXJ2ZXJEZWx0YSA+IDAuMSkge1xuICAgICAgICB0aGlzLnRpbWUub2xkU2VydmVyVGltZSA9IHRoaXMudGltZS5zZXJ2ZXJUaW1lIC0gMC4xO1xuICAgICAgICBzZXJ2ZXJEZWx0YSA9IDAuMTtcbiAgICB9XG4gICAgdmFyIGR0ID0gKHRoaXMudGltZS5jbGllbnRUaW1lIC0gdGhpcy50aW1lLm9sZFNlcnZlclRpbWUpIC8gc2VydmVyRGVsdGE7XG4gICAgaWYgKGR0ID4gMS4wKSBkdCA9IDEuMDtcblxuICAgIHRoaXMud29ybGQudXBkYXRlKGR0KTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUucGFyc2VTZXJ2ZXJJbmZvID0gZnVuY3Rpb24obXNnKSB7XG4gICAgbXNnLnNraXAoNik7XG4gICAgdmFyIG1hcE5hbWUgPSBtc2cucmVhZENTdHJpbmcoKTtcblxuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgICAgdmFyIG1vZGVsTmFtZSA9IG1zZy5yZWFkQ1N0cmluZygpO1xuICAgICAgICBpZiAoIW1vZGVsTmFtZSkgYnJlYWs7XG4gICAgICAgIHRoaXMud29ybGQubG9hZE1vZGVsKG1vZGVsTmFtZSk7XG4gICAgfVxuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgICAgdmFyIHNvdW5kTmFtZSA9IG1zZy5yZWFkQ1N0cmluZygpO1xuICAgICAgICBpZiAoIXNvdW5kTmFtZSkgYnJlYWs7XG4gICAgICAgIC8vY29uc29sZS5sb2coc291bmROYW1lKTtcbiAgICB9XG59O1xuXG5DbGllbnQucHJvdG90eXBlLnBhcnNlQ2xpZW50RGF0YSA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHZhciBiaXRzID0gbXNnLnJlYWRJbnQxNigpO1xuICAgIGlmIChiaXRzICYgUHJvdG9jb2wuY2xpZW50Vmlld0hlaWdodClcbiAgICAgICAgbXNnLnJlYWRVSW50OCgpO1xuXG4gICAgaWYgKGJpdHMgJiBQcm90b2NvbC5jbGllbnRJZGVhbFBpdGNoKVxuICAgICAgICBtc2cucmVhZEludDgoKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG5cbiAgICAgICAgaWYgKGJpdHMgJiAoUHJvdG9jb2wuY2xpZW50UHVuY2gxIDw8IGkpKVxuICAgICAgICAgICAgbXNnLnJlYWRJbnQ4KCk7XG5cbiAgICAgICAgaWYgKGJpdHMgJiAoUHJvdG9jb2wuY2xpZW50VmVsb2NpdHkxIDw8IGkpKVxuICAgICAgICAgICAgbXNnLnJlYWRJbnQ4KCk7XG4gICAgfVxuXG4gICAgbXNnLnJlYWRJbnQzMigpO1xuXG4gICAgaWYgKGJpdHMgJiBQcm90b2NvbC5jbGllbnRXZWFwb25GcmFtZSlcbiAgICAgICAgbXNnLnJlYWRVSW50OCgpO1xuXG4gICAgaWYgKGJpdHMgJiBQcm90b2NvbC5jbGllbnRBcm1vcilcbiAgICAgICAgbXNnLnJlYWRVSW50OCgpO1xuXG4gICAgaWYgKGJpdHMgJiBQcm90b2NvbC5jbGllbnRXZWFwb24pXG4gICAgICAgIG1zZy5yZWFkVUludDgoKTtcblxuICAgIG1zZy5yZWFkSW50MTYoKTtcbiAgICBtc2cucmVhZFVJbnQ4KCk7XG4gICAgbXNnLnJlYWRTdHJpbmcoNSk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLnBhcnNlRmFzdFVwZGF0ZSA9IGZ1bmN0aW9uKGNtZCwgbXNnKSB7XG4gICAgaWYgKGNtZCAmIFByb3RvY29sLmZhc3RVcGRhdGVNb3JlQml0cylcbiAgICAgICAgY21kID0gY21kIHwgKG1zZy5yZWFkVUludDgoKSA8PCA4KTtcblxuICAgIHZhciBlbnRpdHlObyA9IChjbWQgJiBQcm90b2NvbC5mYXN0VXBkYXRlTG9uZ0VudGl0eSkgP1xuICAgICAgICBtc2cucmVhZEludDE2KCkgOiBtc2cucmVhZFVJbnQ4KCk7XG5cblxuICAgIC8vIFRPRE86IE1vdmUgZW50aXR5IGZhc3QgdXBkYXRlcyBpbnRvIHdvcmxkLmpzLlxuICAgIHZhciBlbnRpdHkgPSB0aGlzLndvcmxkLmVudGl0aWVzW2VudGl0eU5vXTtcbiAgICBlbnRpdHkudGltZSA9IHRoaXMudGltZS5zZXJ2ZXJUaW1lO1xuXG5cbiAgICBpZiAoY21kICYgUHJvdG9jb2wuZmFzdFVwZGF0ZU1vZGVsKSB7XG4gICAgICAgIGVudGl0eS5zdGF0ZS5tb2RlbEluZGV4ID0gbXNnLnJlYWRVSW50OCgpO1xuICAgIH1cbiAgICBpZiAoY21kICYgUHJvdG9jb2wuZmFzdFVwZGF0ZUZyYW1lKVxuICAgICAgICBlbnRpdHkuc3RhdGUuZnJhbWUgPSBtc2cucmVhZFVJbnQ4KCk7XG4gICAgLy9lbHNlXG4gICAgLy8gICAgZW50aXR5LnN0YXRlLmZyYW1lID0gZW50aXR5LmJhc2VsaW5lLmZyYW1lO1xuXG4gICAgaWYgKGNtZCAmIFByb3RvY29sLmZhc3RVcGRhdGVDb2xvck1hcClcbiAgICAgICAgbXNnLnJlYWRVSW50OCgpO1xuXG4gICAgaWYgKGNtZCAmIFByb3RvY29sLmZhc3RVcGRhdGVTa2luKVxuICAgICAgICBtc2cucmVhZFVJbnQ4KCk7XG4gICAgaWYgKGNtZCAmIFByb3RvY29sLmZhc3RVcGRhdGVFZmZlY3RzKVxuICAgICAgICBtc2cucmVhZFVJbnQ4KCk7XG5cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgIGVudGl0eS5wcmlvclN0YXRlLmFuZ2xlc1tpXSA9IGVudGl0eS5uZXh0U3RhdGUuYW5nbGVzW2ldO1xuICAgICAgICBlbnRpdHkucHJpb3JTdGF0ZS5vcmlnaW5baV0gPSBlbnRpdHkubmV4dFN0YXRlLm9yaWdpbltpXTtcbiAgICB9XG5cbiAgICBpZiAoY21kICYgUHJvdG9jb2wuZmFzdFVwZGF0ZU9yaWdpbjEpXG4gICAgICAgIGVudGl0eS5uZXh0U3RhdGUub3JpZ2luWzBdID0gbXNnLnJlYWRJbnQxNigpICogMC4xMjU7XG4gICAgaWYgKGNtZCAmIFByb3RvY29sLmZhc3RVcGRhdGVBbmdsZTEpXG4gICAgICAgIGVudGl0eS5uZXh0U3RhdGUuYW5nbGVzWzBdID0gbXNnLnJlYWRJbnQ4KCkgKiAxLjQwNjI1O1xuICAgIGlmIChjbWQgJiBQcm90b2NvbC5mYXN0VXBkYXRlT3JpZ2luMilcbiAgICAgICAgZW50aXR5Lm5leHRTdGF0ZS5vcmlnaW5bMV0gPSBtc2cucmVhZEludDE2KCkgKiAwLjEyNTtcbiAgICBpZiAoY21kICYgUHJvdG9jb2wuZmFzdFVwZGF0ZUFuZ2xlMilcbiAgICAgICAgZW50aXR5Lm5leHRTdGF0ZS5hbmdsZXNbMV0gPSBtc2cucmVhZEludDgoKSAqIDEuNDA2MjU7XG4gICAgaWYgKGNtZCAmIFByb3RvY29sLmZhc3RVcGRhdGVPcmlnaW4zKVxuICAgICAgICBlbnRpdHkubmV4dFN0YXRlLm9yaWdpblsyXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIGlmIChjbWQgJiBQcm90b2NvbC5mYXN0VXBkYXRlQW5nbGUzKVxuICAgICAgICBlbnRpdHkubmV4dFN0YXRlLmFuZ2xlc1syXSA9IG1zZy5yZWFkSW50OCgpICogMS40MDYyNTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUucGFyc2VTb3VuZCA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHZhciBiaXRzID0gbXNnLnJlYWRVSW50OCgpO1xuICAgIHZhciB2b2x1bWUgPSAoYml0cyAmIFByb3RvY29sLnNvdW5kVm9sdW1lKSA/IG1zZy5yZWFkVUludDgoKSA6IDI1NTtcbiAgICB2YXIgYXR0ZW51YXRpb24gPSAoYml0cyAmIFByb3RvY29sLnNvdW5kQXR0ZW51YXRpb24pID8gbXNnLnJlYWRVSW50OCgpIC8gNjQuMCA6IDEuMDtcbiAgICB2YXIgY2hhbm5lbCA9IG1zZy5yZWFkSW50MTYoKTtcbiAgICB2YXIgc291bmRJbmRleCA9IG1zZy5yZWFkVUludDgoKTtcblxuICAgIHZhciBwb3MgPSB2ZWMzLmNyZWF0ZSgpO1xuICAgIHBvc1swXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIHBvc1sxXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIHBvc1syXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xufTtcblxuQ2xpZW50LnByb3RvdHlwZS5wYXJzZVRlbXBFbnRpdHkgPSBmdW5jdGlvbihtc2cpIHtcbiAgICB2YXIgdHlwZSA9IG1zZy5yZWFkVUludDgoKTtcbiAgICB2YXIgcG9zID0gdmVjMy5jcmVhdGUoKTtcbiAgICBzd2l0Y2godHlwZSkge1xuICAgICAgICBjYXNlIFByb3RvY29sLnRlbXBHdW5TaG90OlxuICAgICAgICBjYXNlIFByb3RvY29sLnRlbXBXaXpTcGlrZTpcbiAgICAgICAgY2FzZSBQcm90b2NvbC50ZW1wU3Bpa2U6XG4gICAgICAgIGNhc2UgUHJvdG9jb2wudGVtcFN1cGVyU3Bpa2U6XG5cdFx0Y2FzZSBQcm90b2NvbC50ZW1wVGVsZXBvcnQ6XG5cdFx0Y2FzZSBQcm90b2NvbC50ZW1wRXhwbG9zaW9uOlxuICAgICAgICAgICAgcG9zWzBdID0gbXNnLnJlYWRJbnQxNigpICogMC4xMjU7XG4gICAgICAgICAgICBwb3NbMV0gPSBtc2cucmVhZEludDE2KCkgKiAwLjEyNTtcbiAgICAgICAgICAgIHBvc1syXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgICAgICAgICAgYnJlYWs7XG5cdFx0ZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93ICdVbmtub3duIHRlbXAuIGVudGl0eSBlbmNvdW50ZXJlZDogJyArIHR5cGU7XG4gICAgfVxufTtcblxuQ2xpZW50LnByb3RvdHlwZS5wYXJzZURhbWFnZSA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHZhciBhcm1vciA9IG1zZy5yZWFkVUludDgoKTtcbiAgICB2YXIgYmxvb2QgPSBtc2cucmVhZFVJbnQ4KCk7XG5cbiAgICB2YXIgcG9zID0gdmVjMy5jcmVhdGUoKTtcbiAgICBwb3NbMF0gPSBtc2cucmVhZEludDE2KCkgKiAwLjEyNTtcbiAgICBwb3NbMV0gPSBtc2cucmVhZEludDE2KCkgKiAwLjEyNTtcbiAgICBwb3NbMl0gPSBtc2cucmVhZEludDE2KCkgKiAwLjEyNTtcbn07XG5cbkNsaWVudC5wcm90b3R5cGUucGFyc2VQYXJ0aWNsZSA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHZhciBwb3MgPSB2ZWMzLmNyZWF0ZSgpO1xuICAgIHZhciBhbmdsZXMgPSB2ZWMzLmNyZWF0ZSgpO1xuICAgIHBvc1swXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIHBvc1sxXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIHBvc1syXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIGFuZ2xlc1swXSA9IG1zZy5yZWFkSW50OCgpICogMC4wNjI1O1xuICAgIGFuZ2xlc1sxXSA9IG1zZy5yZWFkSW50OCgpICogMC4wNjI1O1xuICAgIGFuZ2xlc1syXSA9IG1zZy5yZWFkSW50OCgpICogMC4wNjI1O1xuICAgIHZhciBjb3VudCA9IG1zZy5yZWFkVUludDgoKTtcbiAgICB2YXIgY29sb3IgPSBtc2cucmVhZFVJbnQ4KCk7XG59O1xuXG5DbGllbnQucHJvdG90eXBlLnBhcnNlQmFzZWxpbmUgPSBmdW5jdGlvbihtc2cpIHtcbiAgICB2YXIgYmFzZWxpbmUgPSB7XG4gICAgICAgIG1vZGVsSW5kZXg6IG1zZy5yZWFkVUludDgoKSxcbiAgICAgICAgZnJhbWU6IG1zZy5yZWFkVUludDgoKSxcbiAgICAgICAgY29sb3JNYXA6IG1zZy5yZWFkVUludDgoKSxcbiAgICAgICAgc2tpbjogbXNnLnJlYWRVSW50OCgpLFxuICAgICAgICBvcmlnaW46IHZlYzMuY3JlYXRlKCksXG4gICAgICAgIGFuZ2xlczogdmVjMy5jcmVhdGUoKVxuICAgIH07XG4gICAgYmFzZWxpbmUub3JpZ2luWzBdID0gbXNnLnJlYWRJbnQxNigpICogMC4xMjU7XG4gICAgYmFzZWxpbmUuYW5nbGVzWzBdID0gbXNnLnJlYWRJbnQ4KCkgKiAxLjQwNjI1O1xuICAgIGJhc2VsaW5lLm9yaWdpblsxXSA9IG1zZy5yZWFkSW50MTYoKSAqIDAuMTI1O1xuICAgIGJhc2VsaW5lLmFuZ2xlc1sxXSA9IG1zZy5yZWFkSW50OCgpICogMS40MDYyNTtcbiAgICBiYXNlbGluZS5vcmlnaW5bMl0gPSBtc2cucmVhZEludDE2KCkgKiAwLjEyNTtcbiAgICBiYXNlbGluZS5hbmdsZXNbMl0gPSBtc2cucmVhZEludDgoKSAqIDEuNDA2MjU7XG4gICAgcmV0dXJuIGJhc2VsaW5lO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gQ2xpZW50O1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9jbGllbnQuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyO1xuXG52YXIgRmlsZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ldyBCdWZmZXIoZGF0YSk7XG4gICAgdGhpcy5vZmZzZXQgPSAwO1xufTtcblxuRmlsZS5wcm90b3R5cGUudGVsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm9mZnNldDtcbn07XG5cbkZpbGUucHJvdG90eXBlLnNlZWsgPSBmdW5jdGlvbihvZmZzZXQpIHtcbiAgICB0aGlzLm9mZnNldCA9IG9mZnNldDtcbn07XG5cbkZpbGUucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbihieXRlcykge1xuICAgIHRoaXMub2Zmc2V0ICs9IGJ5dGVzO1xufTtcblxuRmlsZS5wcm90b3R5cGUuZW9mID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMub2Zmc2V0ID49IHRoaXMuYnVmZmVyLmxlbmd0aDtcbn07XG5cbkZpbGUucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24ob2Zmc2V0LCBsZW5ndGgpIHtcbiAgICByZXR1cm4gbmV3IEZpbGUodGhpcy5idWZmZXIuc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGgpKTtcbn07XG5cbkZpbGUucHJvdG90eXBlLnJlYWQgPSBmdW5jdGlvbihsZW5ndGgpIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEZpbGUodGhpcy5idWZmZXIuc2xpY2UodGhpcy5vZmZzZXQsIHRoaXMub2Zmc2V0ICsgbGVuZ3RoKSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5GaWxlLnByb3RvdHlwZS5yZWFkU3RyaW5nID0gZnVuY3Rpb24obGVuZ3RoKSB7XG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuICAgIHZhciB0ZXJtaW5hdGVkID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYnl0ZSA9IHRoaXMuYnVmZmVyLnJlYWRVSW50OCh0aGlzLm9mZnNldCsrKTtcbiAgICAgICAgaWYgKGJ5dGUgPT09IDB4MCkgdGVybWluYXRlZCA9IHRydWU7XG4gICAgICAgIGlmICghdGVybWluYXRlZClcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuRmlsZS5wcm90b3R5cGUucmVhZENTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0ID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMjg7IGkrKykge1xuICAgICAgICB2YXIgYnl0ZSA9IHRoaXMuYnVmZmVyLnJlYWRVSW50OCh0aGlzLm9mZnNldCsrKTtcbiAgICAgICAgaWYgKGJ5dGUgPT09IDB4MCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5GaWxlLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXIucmVhZFVJbnQ4KHRoaXMub2Zmc2V0KyspO1xufTtcblxuRmlsZS5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXIucmVhZEludDgodGhpcy5vZmZzZXQrKyk7XG59O1xuXG5GaWxlLnByb3RvdHlwZS5yZWFkVUludDE2ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MTZMRSh0aGlzLm9mZnNldCk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMjtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuRmlsZS5wcm90b3R5cGUucmVhZEludDE2ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuYnVmZmVyLnJlYWRJbnQxNkxFKHRoaXMub2Zmc2V0KTtcbiAgICB0aGlzLm9mZnNldCArPSAyO1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5GaWxlLnByb3RvdHlwZS5yZWFkVUludDMyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MzJMRSh0aGlzLm9mZnNldCk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNDtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuRmlsZS5wcm90b3R5cGUucmVhZEludDMyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuYnVmZmVyLnJlYWRJbnQzMkxFKHRoaXMub2Zmc2V0KTtcbiAgICB0aGlzLm9mZnNldCArPSA0O1xuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5GaWxlLnByb3RvdHlwZS5yZWFkRmxvYXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5idWZmZXIucmVhZEZsb2F0TEUodGhpcy5vZmZzZXQpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IEZpbGU7XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmlsZS5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxudmFyIEJzcCA9IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICB2YXIgaGVhZGVyID0ge1xuICAgICAgICB2ZXJzaW9uOiBmaWxlLnJlYWRJbnQzMigpLFxuICAgICAgICBlbnRpdGllczoge29mZnNldDogZmlsZS5yZWFkSW50MzIoKSwgc2l6ZTogZmlsZS5yZWFkSW50MzIoKX0sXG4gICAgICAgIHBsYW5lczoge29mZnNldDogZmlsZS5yZWFkSW50MzIoKSwgc2l6ZTogZmlsZS5yZWFkSW50MzIoKX0sXG4gICAgICAgIG1pcHRleHM6IHtvZmZzZXQ6IGZpbGUucmVhZEludDMyKCksIHNpemU6IGZpbGUucmVhZEludDMyKCl9LFxuICAgICAgICB2ZXJ0aWNlczoge29mZnNldDogZmlsZS5yZWFkSW50MzIoKSwgc2l6ZTogZmlsZS5yZWFkSW50MzIoKX0sXG4gICAgICAgIHZpc2lsaXN0OiB7b2Zmc2V0OiBmaWxlLnJlYWRJbnQzMigpLCBzaXplOiBmaWxlLnJlYWRJbnQzMigpfSxcbiAgICAgICAgbm9kZXM6IHtvZmZzZXQ6IGZpbGUucmVhZEludDMyKCksIHNpemU6IGZpbGUucmVhZEludDMyKCl9LFxuICAgICAgICB0ZXhpbmZvczoge29mZnNldDogZmlsZS5yZWFkSW50MzIoKSwgc2l6ZTogZmlsZS5yZWFkSW50MzIoKX0sXG4gICAgICAgIGZhY2VzOiB7b2Zmc2V0OiBmaWxlLnJlYWRJbnQzMigpLCBzaXplOiBmaWxlLnJlYWRJbnQzMigpfSxcbiAgICAgICAgbGlnaHRtYXBzOiB7b2Zmc2V0OiBmaWxlLnJlYWRJbnQzMigpLCBzaXplOiBmaWxlLnJlYWRJbnQzMigpfSxcbiAgICAgICAgY2xpcG5vZGVzOiB7b2Zmc2V0OiBmaWxlLnJlYWRJbnQzMigpLCBzaXplOiBmaWxlLnJlYWRJbnQzMigpfSxcbiAgICAgICAgbGVhdmVzOiB7b2Zmc2V0OiBmaWxlLnJlYWRJbnQzMigpLCBzaXplOiBmaWxlLnJlYWRJbnQzMigpfSxcbiAgICAgICAgbGZhY2VzOiB7b2Zmc2V0OiBmaWxlLnJlYWRJbnQzMigpLCBzaXplOiBmaWxlLnJlYWRJbnQzMigpfSxcbiAgICAgICAgZWRnZXM6IHtvZmZzZXQ6IGZpbGUucmVhZEludDMyKCksIHNpemU6IGZpbGUucmVhZEludDMyKCl9LFxuICAgICAgICBsZWRnZXM6IHtvZmZzZXQ6IGZpbGUucmVhZEludDMyKCksIHNpemU6IGZpbGUucmVhZEludDMyKCl9LFxuICAgICAgICBtb2RlbHM6IHtvZmZzZXQ6IGZpbGUucmVhZEludDMyKCksIHNpemU6IGZpbGUucmVhZEludDMyKCl9XG4gICAgfTtcblxuICAgIHRoaXMubG9hZFRleHR1cmVzKGZpbGUsIGhlYWRlci5taXB0ZXhzKTtcbiAgICB0aGlzLmxvYWRUZXhJbmZvcyhmaWxlLCBoZWFkZXIudGV4aW5mb3MpO1xuICAgIHRoaXMubG9hZExpZ2h0TWFwcyhmaWxlLCBoZWFkZXIubGlnaHRtYXBzKTtcblxuICAgIHRoaXMubG9hZE1vZGVscyhmaWxlLCBoZWFkZXIubW9kZWxzKTtcbiAgICB0aGlzLmxvYWRWZXJ0aWNlcyhmaWxlLCBoZWFkZXIudmVydGljZXMpO1xuICAgIHRoaXMubG9hZEVkZ2VzKGZpbGUsIGhlYWRlci5lZGdlcyk7XG4gICAgdGhpcy5sb2FkU3VyZmFjZUVkZ2VzKGZpbGUsIGhlYWRlci5sZWRnZXMpO1xuICAgIHRoaXMubG9hZFN1cmZhY2VzKGZpbGUsIGhlYWRlci5mYWNlcyk7XG59O1xuXG5Cc3Auc3VyZmFjZUZsYWdzID0ge1xuICAgIHBsYW5lQmFjazogMiwgZHJhd1NreTogNCwgZHJhd1Nwcml0ZTogOCwgZHJhd1R1cmI6IDE2LFxuICAgIGRyYXdUaWxlZDogMzIsIGRyYXdCYWNrZ3JvdW5kOiA2NCwgdW5kZXJ3YXRlcjogMTI4XG59O1xuXG5Cc3AucHJvdG90eXBlLmxvYWRWZXJ0aWNlcyA9IGZ1bmN0aW9uKGZpbGUsIGx1bXApIHtcbiAgICB0aGlzLnZlcnRleENvdW50ID0gbHVtcC5zaXplIC8gMTI7XG4gICAgdGhpcy52ZXJ0aWNlcyA9IFtdO1xuICAgIGZpbGUuc2VlayhsdW1wLm9mZnNldCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcbiAgICAgICAgdGhpcy52ZXJ0aWNlcy5wdXNoKHtcbiAgICAgICAgICAgIHg6IGZpbGUucmVhZEZsb2F0KCksXG4gICAgICAgICAgICB5OiBmaWxlLnJlYWRGbG9hdCgpLFxuICAgICAgICAgICAgejogZmlsZS5yZWFkRmxvYXQoKVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5Cc3AucHJvdG90eXBlLmxvYWRFZGdlcyA9IGZ1bmN0aW9uKGZpbGUsIGx1bXApIHtcbiAgICB2YXIgZWRnZUNvdW50ID0gbHVtcC5zaXplIC8gNDtcbiAgICB0aGlzLmVkZ2VzID0gW107XG4gICAgZmlsZS5zZWVrKGx1bXAub2Zmc2V0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVkZ2VDb3VudCAqIDQ7IGkrKylcbiAgICAgICAgdGhpcy5lZGdlcy5wdXNoKGZpbGUucmVhZFVJbnQxNigpKTtcbn07XG5cbkJzcC5wcm90b3R5cGUubG9hZFN1cmZhY2VFZGdlcyA9IGZ1bmN0aW9uKGZpbGUsIGx1bXApIHtcbiAgICB2YXIgZWRnZUxpc3RDb3VudCA9IGx1bXAuc2l6ZSAvIDQ7XG4gICAgdGhpcy5lZGdlTGlzdCA9IFtdO1xuICAgIGZpbGUuc2VlayhsdW1wLm9mZnNldCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlZGdlTGlzdENvdW50OyBpKyspIHtcbiAgICAgICAgdGhpcy5lZGdlTGlzdC5wdXNoKGZpbGUucmVhZEludDMyKCkpO1xuICAgIH1cbn07XG5cbkJzcC5wcm90b3R5cGUuY2FsY3VsYXRlU3VyZmFjZUV4dGVudHMgPSBmdW5jdGlvbihzdXJmYWNlKSB7XG4gICAgdmFyIG1pblMgPSA5OTk5OTtcbiAgICB2YXIgbWF4UyA9IC05OTk5OTtcbiAgICB2YXIgbWluVCA9IDk5OTk5O1xuICAgIHZhciBtYXhUID0gLTk5OTk5O1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdXJmYWNlLmVkZ2VDb3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBlZGdlSW5kZXggPSB0aGlzLmVkZ2VMaXN0W3N1cmZhY2UuZWRnZVN0YXJ0ICsgaV07XG4gICAgICAgIHZhciB2aSA9IGVkZ2VJbmRleCA+PSAwID8gdGhpcy5lZGdlc1tlZGdlSW5kZXggKiAyXSA6IHRoaXMuZWRnZXNbLWVkZ2VJbmRleCAqIDIgKyAxXTtcbiAgICAgICAgdmFyIHYgPSBbdGhpcy52ZXJ0aWNlc1t2aV0ueCwgdGhpcy52ZXJ0aWNlc1t2aV0ueSwgdGhpcy52ZXJ0aWNlc1t2aV0uel07XG4gICAgICAgIHZhciB0ZXhJbmZvID0gdGhpcy50ZXhJbmZvc1tzdXJmYWNlLnRleEluZm9JZF07XG5cbiAgICAgICAgdmFyIHMgPSB2ZWMzLmRvdCh2LCB0ZXhJbmZvLnZlY3RvclMpICsgdGV4SW5mby5kaXN0UztcbiAgICAgICAgbWluUyA9IE1hdGgubWluKG1pblMsIHMpO1xuICAgICAgICBtYXhTID0gTWF0aC5tYXgobWF4Uywgcyk7XG5cbiAgICAgICAgdmFyIHQgPSB2ZWMzLmRvdCh2LCB0ZXhJbmZvLnZlY3RvclQpICsgdGV4SW5mby5kaXN0VDtcbiAgICAgICAgbWluVCA9IE1hdGgubWluKG1pblQsIHQpO1xuICAgICAgICBtYXhUID0gTWF0aC5tYXgobWF4VCwgdCk7XG4gICAgfVxuXG4gICAgLyogQ29udmVydCB0byBpbnRzICovXG4gICAgbWluUyA9IE1hdGguZmxvb3IobWluUyAvIDE2KTtcbiAgICBtaW5UID0gTWF0aC5mbG9vcihtaW5UIC8gMTYpO1xuICAgIG1heFMgPSBNYXRoLmNlaWwobWF4UyAvIDE2KTtcbiAgICBtYXhUID0gTWF0aC5jZWlsKG1heFQgLyAxNik7XG5cbiAgICBzdXJmYWNlLnRleHR1cmVNaW5zID0gW21pblMgKiAxNiwgbWluVCAqIDE2XTtcbiAgICBzdXJmYWNlLmV4dGVudHMgPSBbKG1heFMgLSBtaW5TKSAqIDE2LCAobWF4VCAtIG1pblQpICogMTZdO1xufTtcblxuQnNwLnByb3RvdHlwZS5sb2FkU3VyZmFjZXMgPSBmdW5jdGlvbiAoZmlsZSwgbHVtcCkge1xuXG4gICAgdmFyIHN1cmZhY2VDb3VudCA9IGx1bXAuc2l6ZSAvIDIwO1xuICAgIHRoaXMuc3VyZmFjZXMgPSBbXTtcbiAgICBmaWxlLnNlZWsobHVtcC5vZmZzZXQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3VyZmFjZUNvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIHN1cmZhY2UgPSB7fTtcbiAgICAgICAgc3VyZmFjZS5wbGFuZUlkID0gZmlsZS5yZWFkVUludDE2KCk7XG4gICAgICAgIHN1cmZhY2Uuc2lkZSA9IGZpbGUucmVhZFVJbnQxNigpO1xuICAgICAgICBzdXJmYWNlLmVkZ2VTdGFydCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIHN1cmZhY2UuZWRnZUNvdW50ID0gZmlsZS5yZWFkSW50MTYoKTtcbiAgICAgICAgc3VyZmFjZS50ZXhJbmZvSWQgPSBmaWxlLnJlYWRVSW50MTYoKTtcblxuICAgICAgICBzdXJmYWNlLmxpZ2h0U3R5bGVzID0gW2ZpbGUucmVhZFVJbnQ4KCksIGZpbGUucmVhZFVJbnQ4KCksIGZpbGUucmVhZFVJbnQ4KCksIGZpbGUucmVhZFVJbnQ4KCldO1xuICAgICAgICBzdXJmYWNlLmxpZ2h0TWFwT2Zmc2V0ID0gZmlsZS5yZWFkSW50MzIoKTtcbiAgICAgICAgc3VyZmFjZS5mbGFncyA9IDA7XG5cbiAgICAgICAgdGhpcy5jYWxjdWxhdGVTdXJmYWNlRXh0ZW50cyhzdXJmYWNlKTtcbiAgICAgICAgdGhpcy5zdXJmYWNlcy5wdXNoKHN1cmZhY2UpO1xuICAgIH1cbn07XG5cbkJzcC5wcm90b3R5cGUubG9hZFRleHR1cmVzID0gZnVuY3Rpb24oZmlsZSwgbHVtcCkge1xuICAgIGZpbGUuc2VlayhsdW1wLm9mZnNldCk7XG4gICAgdmFyIHRleHR1cmVDb3VudCA9IGZpbGUucmVhZEludDMyKCk7XG5cbiAgICB0aGlzLnRleHR1cmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0dXJlQ291bnQ7IGkrKykge1xuICAgICAgICB2YXIgdGV4dHVyZU9mZnNldCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIHZhciBvcmlnaW5hbE9mZnNldCA9IGZpbGUudGVsbCgpO1xuICAgICAgICBmaWxlLnNlZWsobHVtcC5vZmZzZXQgKyB0ZXh0dXJlT2Zmc2V0KTtcbiAgICAgICAgdmFyIHRleHR1cmUgPSB7XG4gICAgICAgICAgICBuYW1lOiBmaWxlLnJlYWRTdHJpbmcoMTYpLFxuICAgICAgICAgICAgd2lkdGg6IGZpbGUucmVhZFVJbnQzMigpLFxuICAgICAgICAgICAgaGVpZ2h0OiBmaWxlLnJlYWRVSW50MzIoKSxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG9mZnNldCA9IGx1bXAub2Zmc2V0ICsgdGV4dHVyZU9mZnNldCArIGZpbGUucmVhZFVJbnQzMigpO1xuICAgICAgICB0ZXh0dXJlLmRhdGEgPSBmaWxlLnNsaWNlKG9mZnNldCwgdGV4dHVyZS53aWR0aCAqIHRleHR1cmUuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy50ZXh0dXJlcy5wdXNoKHRleHR1cmUpO1xuXG4gICAgICAgIGZpbGUuc2VlayhvcmlnaW5hbE9mZnNldCk7XG4gICAgfVxufTtcblxuQnNwLnByb3RvdHlwZS5sb2FkVGV4SW5mb3MgPSBmdW5jdGlvbihmaWxlLCBsdW1wKSB7XG4gICAgZmlsZS5zZWVrKGx1bXAub2Zmc2V0KTtcbiAgICB2YXIgdGV4SW5mb0NvdW50ID0gbHVtcC5zaXplIC8gNDA7XG4gICAgdGhpcy50ZXhJbmZvcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4SW5mb0NvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGluZm8gPSB7fTtcbiAgICAgICAgaW5mby52ZWN0b3JTID0gW2ZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCldO1xuICAgICAgICBpbmZvLmRpc3RTID0gZmlsZS5yZWFkRmxvYXQoKTtcbiAgICAgICAgaW5mby52ZWN0b3JUID0gW2ZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCldO1xuICAgICAgICBpbmZvLmRpc3RUID0gZmlsZS5yZWFkRmxvYXQoKTtcbiAgICAgICAgaW5mby50ZXh0dXJlSWQgPSBmaWxlLnJlYWRVSW50MzIoKTtcbiAgICAgICAgaW5mby5hbmltYXRlZCA9IGZpbGUucmVhZFVJbnQzMigpID09IDE7XG4gICAgICAgIHRoaXMudGV4SW5mb3MucHVzaChpbmZvKTtcbiAgICB9XG59O1xuXG5Cc3AucHJvdG90eXBlLmxvYWRNb2RlbHMgPSBmdW5jdGlvbihmaWxlLCBsdW1wKSB7XG4gICAgZmlsZS5zZWVrKGx1bXAub2Zmc2V0KTtcbiAgICB2YXIgbW9kZWxDb3VudCA9IGx1bXAuc2l6ZSAvIDY0O1xuICAgIHRoaXMubW9kZWxzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RlbENvdW50OyBpKyspIHtcblxuICAgICAgICB2YXIgbW9kZWwgPSB7fTtcbiAgICAgICAgbW9kZWwubWlucyA9IHZlYzMuY3JlYXRlKFtmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpXSk7XG4gICAgICAgIG1vZGVsLm1heGVzID0gdmVjMy5jcmVhdGUoW2ZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCldKTtcbiAgICAgICAgbW9kZWwub3JpZ2luID0gdmVjMy5jcmVhdGUoW2ZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCksIGZpbGUucmVhZEZsb2F0KCldKTtcbiAgICAgICAgbW9kZWwuYnNwTm9kZSA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIG1vZGVsLmNsaXBOb2RlMSA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIG1vZGVsLmNsaXBOb2RlMiA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIGZpbGUucmVhZEludDMyKCk7IC8vIFNraXAgZm9yIG5vdy5cbiAgICAgICAgbW9kZWwudmlzTGVhZnMgPSBmaWxlLnJlYWRJbnQzMigpO1xuICAgICAgICBtb2RlbC5maXJzdFN1cmZhY2UgPSBmaWxlLnJlYWRJbnQzMigpO1xuICAgICAgICBtb2RlbC5zdXJmYWNlQ291bnQgPSBmaWxlLnJlYWRJbnQzMigpO1xuICAgICAgICB0aGlzLm1vZGVscy5wdXNoKG1vZGVsKTtcbiAgICB9XG59O1xuXG5cbkJzcC5wcm90b3R5cGUubG9hZExpZ2h0TWFwcyA9IGZ1bmN0aW9uIChmaWxlLCBsdW1wKSB7XG4gICAgZmlsZS5zZWVrKGx1bXAub2Zmc2V0KTtcbiAgICB0aGlzLmxpZ2h0TWFwcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbHVtcC5zaXplOyBpKyspXG4gICAgICAgIHRoaXMubGlnaHRNYXBzLnB1c2goZmlsZS5yZWFkVUludDgoKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBCc3A7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2Zvcm1hdHMvYnNwLmpzXCIsXCIvZm9ybWF0c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxudmFyIEFsaWFzID0geyBzaW5nbGU6IDAsIGdyb3VwOiAxfTtcblxudmFyIE1kbCA9IGZ1bmN0aW9uKG5hbWUsIGZpbGUpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMubG9hZEhlYWRlcihmaWxlKTtcbiAgICB0aGlzLmxvYWRTa2lucyhmaWxlKTtcbiAgICB0aGlzLmxvYWRUZXhDb29yZHMoZmlsZSk7XG4gICAgdGhpcy5sb2FkRmFjZXMoZmlsZSk7XG4gICAgdGhpcy5sb2FkRnJhbWVzKGZpbGUpO1xufTtcblxuTWRsLnByb3RvdHlwZS5sb2FkSGVhZGVyID0gZnVuY3Rpb24oZmlsZSkge1xuICAgIHRoaXMuaWQgPSBmaWxlLnJlYWRTdHJpbmcoNCk7XG4gICAgdGhpcy52ZXJzaW9uID0gZmlsZS5yZWFkVUludDMyKCk7XG4gICAgdGhpcy5zY2FsZSA9IHZlYzMuZnJvbVZhbHVlcyhmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpKTtcbiAgICB0aGlzLm9yaWdpbiA9IHZlYzMuZnJvbVZhbHVlcyhmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpKTtcbiAgICB0aGlzLnJhZGl1cyA9IGZpbGUucmVhZEZsb2F0KCk7XG4gICAgdGhpcy5leWVQb3NpdGlvbiA9IFtmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpLCBmaWxlLnJlYWRGbG9hdCgpXTtcbiAgICB0aGlzLnNraW5Db3VudCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgdGhpcy5za2luV2lkdGggPSBmaWxlLnJlYWRJbnQzMigpO1xuICAgIHRoaXMuc2tpbkhlaWdodCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgdGhpcy5mYWNlQ291bnQgPSBmaWxlLnJlYWRJbnQzMigpO1xuICAgIHRoaXMuZnJhbWVDb3VudCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgdGhpcy5zeW5jVHlwZSA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgdGhpcy5mbGFncyA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgdGhpcy5hdmVyYWdlRmFjZVNpemUgPSBmaWxlLnJlYWRGbG9hdCgpO1xufTtcblxuXG5NZGwucHJvdG90eXBlLmxvYWRTa2lucyA9IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICBmaWxlLnNlZWsoMHg1NCk7IC8vYmFzZXNraW4gb2Zmc2V0LCB3aGVyZSBza2lucyBzdGFydC5cbiAgICB0aGlzLnNraW5zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNraW5Db3VudDsgaSsrKSB7XG4gICAgICAgIHZhciBncm91cCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIGlmIChncm91cCAhPT0gQWxpYXMuc2luZ2xlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnV2FybmluZzogTXVsdGlwbGUgc2tpbnMgbm90IHN1cHBvcnRlZCB5ZXQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGEgPSBmaWxlLnJlYWQodGhpcy5za2luV2lkdGggKiB0aGlzLnNraW5IZWlnaHQpO1xuXG4gICAgICAgIHRoaXMuc2tpbnMucHVzaChkYXRhKTtcbiAgICB9XG59O1xuXG5NZGwucHJvdG90eXBlLmxvYWRUZXhDb29yZHMgPSBmdW5jdGlvbihmaWxlKSB7XG4gICAgdGhpcy50ZXhDb29yZHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKykge1xuICAgICAgICB2YXIgdGV4Q29vcmQgPSB7fTtcbiAgICAgICAgdGV4Q29vcmQub25TZWFtID0gZmlsZS5yZWFkSW50MzIoKSA9PSAweDIwO1xuICAgICAgICB0ZXhDb29yZC5zID0gZmlsZS5yZWFkSW50MzIoKTtcbiAgICAgICAgdGV4Q29vcmQudCA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIHRoaXMudGV4Q29vcmRzLnB1c2godGV4Q29vcmQpO1xuICAgIH1cbn07XG5cbk1kbC5wcm90b3R5cGUubG9hZEZhY2VzID0gZnVuY3Rpb24oZmlsZSkge1xuICAgIHRoaXMuZmFjZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGZhY2UgPSB7fTtcbiAgICAgICAgZmFjZS5pc0Zyb250RmFjZSA9IGZpbGUucmVhZEludDMyKCkgPT0gMTtcbiAgICAgICAgZmFjZS5pbmRpY2VzID0gW2ZpbGUucmVhZEludDMyKCksIGZpbGUucmVhZEludDMyKCksIGZpbGUucmVhZEludDMyKCldO1xuICAgICAgICB0aGlzLmZhY2VzLnB1c2goZmFjZSk7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuTWRsLnByb3RvdHlwZS5sb2FkRnJhbWVzID0gZnVuY3Rpb24oZmlsZSkge1xuICAgIHRoaXMuZnJhbWVzID0gW107XG4gICAgdGhpcy5hbmltYXRpb25zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYW1lQ291bnQ7IGkrKykge1xuICAgICAgICB2YXIgdHlwZSA9IGZpbGUucmVhZEludDMyKCk7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBBbGlhcy5zaW5nbGU6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYW5pbWF0aW9ucy5sZW5ndGggPT0gMClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbmltYXRpb25zLnB1c2goeyBmaXJzdEZyYW1lOiAwLCBmcmFtZUNvdW50OiB0aGlzLmZyYW1lQ291bnQgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lcy5wdXNoKHRoaXMubG9hZFNpbmdsZUZyYW1lKGZpbGUpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQWxpYXMuZ3JvdXA6XG4gICAgICAgICAgICAgICAgdmFyIGZyYW1lcyA9IHRoaXMubG9hZEdyb3VwRnJhbWUoZmlsZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmltYXRpb25zLnB1c2goeyBmaXJzdEZyYW1lOiB0aGlzLmZyYW1lcy5sZW5ndGgsIGZyYW1lQ291bnQ6IGZyYW1lcy5sZW5ndGggfSk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBmID0gMDsgZiA8IGZyYW1lcy5sZW5ndGg7IGYrKylcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmFtZXMucHVzaChmcmFtZXNbZl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dhcm5pbmc6IFVua25vd24gZnJhbWUgdHlwZTogJyArIHR5cGUgKyAnIGZvdW5kIGluICcgKyB0aGlzLm5hbWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlc2V0IGZyYW1lY291bnRlciB0byBhY3R1YWwgZnVsbCBmcmFtZWNvdW50IGluY2x1ZGluZyBhbGwgZmxhdHRlbiBncm91cHMuXG4gICAgdGhpcy5mcmFtZUNvdW50ID0gdGhpcy5mcmFtZXMubGVuZ3RoO1xuICAgIHJldHVybiB0cnVlO1xufTtcblxuTWRsLnByb3RvdHlwZS5sb2FkU2luZ2xlRnJhbWUgPSBmdW5jdGlvbihmaWxlKSB7XG4gICAgdmFyIGZyYW1lID0ge307XG4gICAgZnJhbWUudHlwZSA9IEFsaWFzLnNpbmdsZTtcbiAgICBmcmFtZS5iYm94ID0gW1xuICAgICAgICBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLFxuICAgICAgICBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpXG4gICAgXTtcblxuICAgIGZyYW1lLm5hbWUgPSBmaWxlLnJlYWRTdHJpbmcoMTYpO1xuICAgIGZyYW1lLnZlcnRpY2VzID0gW107XG4gICAgZnJhbWUucG9zZUNvdW50ID0gMTtcbiAgICBmcmFtZS5pbnRlcnZhbCA9IDA7XG4gICAgZm9yICh2YXIgdiA9IDA7IHYgPCB0aGlzLnZlcnRleENvdW50OyB2KyspIHtcbiAgICAgICAgdmFyIHZlcnRleCA9IFtcbiAgICAgICAgICAgIHRoaXMuc2NhbGVbMF0gKiBmaWxlLnJlYWRVSW50OCgpICsgdGhpcy5vcmlnaW5bMF0sXG4gICAgICAgICAgICB0aGlzLnNjYWxlWzFdICogZmlsZS5yZWFkVUludDgoKSArIHRoaXMub3JpZ2luWzFdLFxuICAgICAgICAgICAgdGhpcy5zY2FsZVsyXSAqIGZpbGUucmVhZFVJbnQ4KCkgKyB0aGlzLm9yaWdpblsyXV07XG4gICAgICAgIGZyYW1lLnZlcnRpY2VzLnB1c2goW3ZlcnRleFswXSwgdmVydGV4WzFdLCB2ZXJ0ZXhbMl1dKTtcbiAgICAgICAgZmlsZS5yZWFkVUludDgoKTsgLy8gRG9uJ3QgY2FyZSBhYm91dCBub3JtYWwgZm9yIG5vd1xuICAgIH1cbiAgICByZXR1cm4gZnJhbWU7XG59O1xuXG5NZGwucHJvdG90eXBlLmxvYWRHcm91cEZyYW1lID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICB2YXIgZ3JvdXBGcmFtZSA9IHt9O1xuICAgIGdyb3VwRnJhbWUudHlwZSA9IEFsaWFzLmdyb3VwO1xuICAgIGdyb3VwRnJhbWUucG9zZUNvdW50ID0gZmlsZS5yZWFkVUludDMyKCk7XG4gICAgZ3JvdXBGcmFtZS5iYm94ID0gW1xuICAgICAgICBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLFxuICAgICAgICBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpLCBmaWxlLnJlYWRVSW50OCgpXG4gICAgXTtcblxuICAgIHZhciBpbnRlcnZhbHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3VwRnJhbWUucG9zZUNvdW50OyBpKyspXG4gICAgICAgIGludGVydmFscy5wdXNoKGZpbGUucmVhZEZsb2F0KCkpO1xuXG4gICAgdmFyIGZyYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGYgPSAwOyBmIDwgZ3JvdXBGcmFtZS5wb3NlQ291bnQ7IGYrKykge1xuICAgICAgICB2YXIgZnJhbWUgPSB0aGlzLmxvYWRTaW5nbGVGcmFtZShmaWxlKTtcbiAgICAgICAgZnJhbWUuaW50ZXJ2YWwgPSBpbnRlcnZhbHNbaV07XG4gICAgICAgIGZyYW1lcy5wdXNoKGZyYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIGZyYW1lcztcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBNZGw7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2Zvcm1hdHMvbWRsLmpzXCIsXCIvZm9ybWF0c1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBGaWxlID0gcmVxdWlyZSgnZmlsZScpO1xudmFyIFdhZCA9IHJlcXVpcmUoJ2Zvcm1hdHMvd2FkJyk7XG52YXIgUGFsZXR0ZSA9IHJlcXVpcmUoJ2Zvcm1hdHMvcGFsZXR0ZScpO1xuXG52YXIgUGFrID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBmaWxlID0gbmV3IEZpbGUoZGF0YSk7XG5cbiAgICBpZiAoZmlsZS5yZWFkU3RyaW5nKDQpICE9PSAnUEFDSycpXG4gICAgICAgIHRocm93ICdFcnJvcjogQ29ycnVwdCBQQUsgZmlsZS4nO1xuXG4gICAgdmFyIGluZGV4T2Zmc2V0ID0gZmlsZS5yZWFkVUludDMyKCk7XG4gICAgdmFyIGluZGV4RmlsZUNvdW50ID0gZmlsZS5yZWFkVUludDMyKCkgLyA2NDtcblxuICAgIGZpbGUuc2VlayhpbmRleE9mZnNldCk7XG4gICAgdGhpcy5pbmRleCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kZXhGaWxlQ291bnQ7IGkrKykge1xuICAgICAgICB2YXIgcGF0aCA9IGZpbGUucmVhZFN0cmluZyg1Nik7XG4gICAgICAgIHZhciBvZmZzZXQgPSBmaWxlLnJlYWRVSW50MzIoKTtcbiAgICAgICAgdmFyIHNpemUgPSBmaWxlLnJlYWRVSW50MzIoKTtcbiAgICAgICAgdGhpcy5pbmRleFtwYXRoXSA9IHsgb2Zmc2V0OiBvZmZzZXQsIHNpemU6IHNpemUgfTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coJ1BBSzogTG9hZGVkICVpIGVudHJpZXMuJywgaW5kZXhGaWxlQ291bnQpO1xuICAgIHRoaXMuZmlsZSA9IGZpbGU7XG59O1xuXG5QYWsucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIGVudHJ5ID0gdGhpcy5pbmRleFtuYW1lXTtcbiAgICBpZiAoIWVudHJ5KVxuICAgICAgICB0aHJvdyAnRXJyb3I6IENhblxcJ3QgZmluZCBlbnRyeSBpbiBQQUs6ICcgKyBuYW1lO1xuICAgIHJldHVybiB0aGlzLmZpbGUuc2xpY2UoZW50cnkub2Zmc2V0LCBlbnRyeS5zaXplKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IFBhaztcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZm9ybWF0cy9wYWsuanNcIixcIi9mb3JtYXRzXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXG52YXIgUGFsZXR0ZSA9IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICB0aGlzLmNvbG9ycyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICAgICAgdGhpcy5jb2xvcnMucHVzaCh7XG4gICAgICAgICAgICByOiBmaWxlLnJlYWRVSW50OCgpLFxuICAgICAgICAgICAgZzogZmlsZS5yZWFkVUludDgoKSxcbiAgICAgICAgICAgIGI6IGZpbGUucmVhZFVJbnQ4KClcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuUGFsZXR0ZS5wcm90b3R5cGUudW5wYWNrID0gZnVuY3Rpb24oZmlsZSwgd2lkdGgsIGhlaWdodCwgYWxwaGEpIHtcbiAgICB2YXIgcGl4ZWxzID0gbmV3IFVpbnQ4QXJyYXkoNCAqIHdpZHRoICogaGVpZ2h0KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoICogaGVpZ2h0OyBpKyspIHtcbiAgICAgICAgdmFyIGluZGV4ID0gZmlsZS5yZWFkVUludDgoKTtcbiAgICAgICAgdmFyIGNvbG9yID0gdGhpcy5jb2xvcnNbaW5kZXhdO1xuICAgICAgICBwaXhlbHNbaSo0XSA9IGNvbG9yLnI7XG4gICAgICAgIHBpeGVsc1tpKjQrMV0gPSBjb2xvci5nO1xuICAgICAgICBwaXhlbHNbaSo0KzJdID0gY29sb3IuYjtcbiAgICAgICAgcGl4ZWxzW2kqNCszXSA9IChhbHBoYSAmJiAhaW5kZXgpID8gMCA6IDI1NTtcbiAgICB9XG4gICAgcmV0dXJuIHBpeGVscztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IFBhbGV0dGU7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2Zvcm1hdHMvcGFsZXR0ZS5qc1wiLFwiL2Zvcm1hdHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5cbnZhciBXYWQgPSBmdW5jdGlvbihmaWxlKSB7XG4gICAgdGhpcy5sdW1wcyA9IFtdO1xuICAgIGlmIChmaWxlLnJlYWRTdHJpbmcoNCkgIT09ICdXQUQyJylcbiAgICAgICAgdGhyb3cgJ0Vycm9yOiBDb3JydXB0IFdBRC1maWxlIGVuY291bnRlcmVkLic7XG5cbiAgICB2YXIgbHVtcENvdW50ID0gZmlsZS5yZWFkVUludDMyKCk7XG4gICAgdmFyIG9mZnNldCA9IGZpbGUucmVhZFVJbnQzMigpO1xuXG4gICAgZmlsZS5zZWVrKG9mZnNldCk7XG4gICAgdmFyIGluZGV4ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsdW1wQ291bnQ7IGkrKykge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gZmlsZS5yZWFkVUludDMyKCk7XG4gICAgICAgIGZpbGUuc2tpcCg0KTtcbiAgICAgICAgdmFyIHNpemUgPSBmaWxlLnJlYWRVSW50MzIoKTtcbiAgICAgICAgdmFyIHR5cGUgPSBmaWxlLnJlYWRVSW50OCgpO1xuICAgICAgICBmaWxlLnNraXAoMyk7XG4gICAgICAgIHZhciBuYW1lID0gZmlsZS5yZWFkU3RyaW5nKDE2KTtcbiAgICAgICAgaW5kZXgucHVzaCh7IG5hbWU6IG5hbWUsIG9mZnNldDogb2Zmc2V0LCBzaXplOiBzaXplIH0pO1xuICAgIH1cblxuICAgIHRoaXMubHVtcHMgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluZGV4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGluZGV4W2ldO1xuICAgICAgICB0aGlzLmx1bXBzW2VudHJ5Lm5hbWVdID0gZmlsZS5zbGljZShlbnRyeS5vZmZzZXQsIGVudHJ5LnNpemUpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnV0FEOiBMb2FkZWQgJXMgbHVtcHMuJywgbHVtcENvdW50KTtcbn07XG5cbldhZC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBmaWxlID0gdGhpcy5sdW1wc1tuYW1lXTtcbiAgICBpZiAoIWZpbGUpXG4gICAgICAgIHRocm93ICdFcnJvcjogTm8gc3VjaCBlbnRyeSBmb3VuZCBpbiBXQUQ6ICcgKyBuYW1lO1xuICAgIHJldHVybiBmaWxlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gV2FkO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9mb3JtYXRzL3dhZC5qc1wiLFwiL2Zvcm1hdHNcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgdXRpbHMgPSByZXF1aXJlKCd1dGlscycpO1xuXG52YXIgVGV4dHVyZSA9IGZ1bmN0aW9uKGZpbGUsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5hbHBoYSA9IG9wdGlvbnMuYWxwaGEgfHwgZmFsc2U7XG4gICAgb3B0aW9ucy5mb3JtYXQgPSBvcHRpb25zLmZvcm1hdCB8fCBnbC5SR0JBO1xuICAgIG9wdGlvbnMudHlwZSA9IG9wdGlvbnMudHlwZSB8fCBnbC5VTlNJR05FRF9CWVRFO1xuICAgIG9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXIgfHwgZ2wuTElORUFSO1xuICAgIG9wdGlvbnMud3JhcCA9IG9wdGlvbnMud3JhcCB8fCBnbC5DTEFNUF9UT19FREdFO1xuXG4gICAgdGhpcy5pZCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgICB0aGlzLndpZHRoID0gb3B0aW9ucy53aWR0aCB8fCBmaWxlLnJlYWRVSW50MzIoKTtcbiAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0IHx8IGZpbGUucmVhZFVJbnQzMigpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBvcHRpb25zLmZpbHRlcik7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIG9wdGlvbnMuZmlsdGVyKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBvcHRpb25zLndyYXApO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIG9wdGlvbnMud3JhcCk7XG5cbiAgICBpZiAoZmlsZSkge1xuICAgICAgICBpZiAoIW9wdGlvbnMucGFsZXR0ZSlcbiAgICAgICAgICAgIHRocm93ICdFcnJvcjogTm8gcGFsZXR0ZSBzcGVjaWZpZWQgaW4gb3B0aW9ucy4nO1xuXG4gICAgICAgIHZhciBwaXhlbHMgPSBvcHRpb25zLnBhbGV0dGUudW5wYWNrKGZpbGUsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBvcHRpb25zLmFscGhhKTtcbiAgICAgICAgdmFyIG5wb3QgPSB1dGlscy5pc1Bvd2VyT2YyKHRoaXMud2lkdGgpICYmIHV0aWxzLmlzUG93ZXJPZjIodGhpcy5oZWlnaHQpO1xuICAgICAgICBpZiAoIW5wb3QgJiYgb3B0aW9ucy53cmFwID09PSBnbC5SRVBFQVQpIHtcbiAgICAgICAgICAgIHZhciBuZXdXaWR0aCA9IHV0aWxzLm5leHRQb3dlck9mMih0aGlzLndpZHRoKTtcbiAgICAgICAgICAgIHZhciBuZXdIZWlnaHQgPSB1dGlscy5uZXh0UG93ZXJPZjIodGhpcy5oZWlnaHQpO1xuICAgICAgICAgICAgcGl4ZWxzID0gdGhpcy5yZXNhbXBsZShwaXhlbHMsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBuZXdXaWR0aCwgbmV3SGVpZ2h0KTtcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgb3B0aW9ucy5mb3JtYXQsIG5ld1dpZHRoLCBuZXdIZWlnaHQsXG4gICAgICAgICAgICAgICAgMCwgb3B0aW9ucy5mb3JtYXQsIG9wdGlvbnMudHlwZSwgcGl4ZWxzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgb3B0aW9ucy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIDAsIG9wdGlvbnMuZm9ybWF0LCBvcHRpb25zLnR5cGUsIHBpeGVscyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIG9wdGlvbnMuZm9ybWF0LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIDAsIG9wdGlvbnMuZm9ybWF0LCBvcHRpb25zLnR5cGUsIG51bGwpO1xuICAgIH1cbn07XG5cblRleHR1cmUucHJvdG90eXBlLmRyYXdUbyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciB2ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlZJRVdQT1JUKTtcblxuICAgIC8qIFNldHVwIHNoYXJlZCBidWZmZXJzIGZvciByZW5kZXIgdGFyZ2V0IGRyYXdpbmcgKi9cbiAgICBpZiAodHlwZW9mIFRleHR1cmUuZnJhbWVCdWZmZXIgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgVGV4dHVyZS5mcmFtZUJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgICAgIFRleHR1cmUucmVuZGVyQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gICAgfVxuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBUZXh0dXJlLmZyYW1lQnVmZmVyKTtcbiAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgVGV4dHVyZS5yZW5kZXJCdWZmZXIpO1xuICAgIGlmICh0aGlzLndpZHRoICE9IFRleHR1cmUucmVuZGVyQnVmZmVyLndpZHRoIHx8IHRoaXMuaGVpZ2h0ICE9IFRleHR1cmUucmVuZGVyQnVmZmVyLmhlaWdodCkge1xuICAgICAgICBUZXh0dXJlLnJlbmRlckJ1ZmZlci53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgICAgIFRleHR1cmUucmVuZGVyQnVmZmVyLmhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuICAgICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9XG5cbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQsIDApO1xuICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULCBnbC5SRU5ERVJCVUZGRVIsIFRleHR1cmUucmVuZGVyQnVmZmVyKTtcbiAgICBnbC52aWV3cG9ydCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cbiAgICB2YXIgb3J0aG8gPSBtYXQ0Lm9ydGhvKG1hdDQuY3JlYXRlKCksIDAsIHRoaXMud2lkdGgsIDAsIHRoaXMuaGVpZ2h0LCAtMTAsIDEwKTtcbiAgICBjYWxsYmFjayhvcnRobyk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBudWxsKTtcbiAgICBnbC52aWV3cG9ydCh2WzBdLCB2WzFdLCB2WzJdLCB2WzNdKTtcbn07XG5cblRleHR1cmUucHJvdG90eXBlLnJlc2FtcGxlID0gZnVuY3Rpb24ocGl4ZWxzLCB3aWR0aCwgaGVpZ2h0LCBuZXdXaWR0aCwgbmV3SGVpZ2h0KSB7XG4gICAgdmFyIHNyYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHNyYy53aWR0aCA9IHdpZHRoO1xuICAgIHNyYy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdmFyIGNvbnRleHQgPSBzcmMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB2YXIgaW1hZ2VEYXRhID0gY29udGV4dC5jcmVhdGVJbWFnZURhdGEod2lkdGgsIGhlaWdodCk7XG4gICAgaW1hZ2VEYXRhLmRhdGEuc2V0KHBpeGVscyk7XG4gICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcblxuICAgIHZhciBkZXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgZGVzdC53aWR0aCA9IG5ld1dpZHRoO1xuICAgIGRlc3QuaGVpZ2h0ID0gbmV3SGVpZ2h0O1xuICAgIGNvbnRleHQgPSBkZXN0LmdldENvbnRleHQoJzJkJyk7XG4gICAgY29udGV4dC5kcmF3SW1hZ2Uoc3JjLCAwLCAwLCBkZXN0LndpZHRoLCBkZXN0LmhlaWdodCk7XG4gICAgdmFyIGltYWdlID0gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgZGVzdC53aWR0aCwgZGVzdC5oZWlnaHQpO1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShpbWFnZS5kYXRhKTtcbn07XG5cblRleHR1cmUucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbih1bml0KSB7XG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArICh1bml0IHx8IDApKTtcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcbn07XG5cblRleHR1cmUucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKHVuaXQpIHtcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgKHVuaXQgfHwgMCkpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xufTtcblxuVGV4dHVyZS5wcm90b3R5cGUuYXNEYXRhVXJsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZyYW1lYnVmZmVyID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGZyYW1lYnVmZmVyKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQsIDApO1xuXG4gICAgdmFyIHdpZHRoID0gdGhpcy53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG5cbiAgICAvLyBSZWFkIHRoZSBjb250ZW50cyBvZiB0aGUgZnJhbWVidWZmZXJcbiAgICB2YXIgZGF0YSA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0ICogNCk7XG4gICAgZ2wucmVhZFBpeGVscygwLCAwLCB3aWR0aCwgaGVpZ2h0LCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBkYXRhKTtcbiAgICBnbC5kZWxldGVGcmFtZWJ1ZmZlcihmcmFtZWJ1ZmZlcik7XG5cbiAgICAvLyBDcmVhdGUgYSAyRCBjYW52YXMgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAvLyBDb3B5IHRoZSBwaXhlbHMgdG8gYSAyRCBjYW52YXNcbiAgICB2YXIgaW1hZ2VEYXRhID0gY29udGV4dC5jcmVhdGVJbWFnZURhdGEod2lkdGgsIGhlaWdodCk7XG4gICAgaW1hZ2VEYXRhLmRhdGEuc2V0KGRhdGEpO1xuICAgIGNvbnRleHQucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IFRleHR1cmU7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2dsL1RleHR1cmUuanNcIixcIi9nbFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBUZXh0dXJlID0gcmVxdWlyZSgnZ2wvdGV4dHVyZScpO1xuXG52YXIgQXRsYXMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMud2lkdGggPSB3aWR0aCB8fCA1MTI7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgfHwgNTEyO1xuICAgIHRoaXMudHJlZSA9IHsgY2hpbGRyZW46IFtdLCB4OiAwLCB5OiAwLCB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH07XG4gICAgdGhpcy5zdWJUZXh0dXJlcyA9IFtdO1xuICAgIHRoaXMudGV4dHVyZSA9IG51bGw7XG59O1xuXG5BdGxhcy5wcm90b3R5cGUuZ2V0U3ViVGV4dHVyZSA9IGZ1bmN0aW9uIChzdWJUZXh0dXJlSWQpIHtcbiAgICByZXR1cm4gdGhpcy5zdWJUZXh0dXJlc1tzdWJUZXh0dXJlSWRdO1xufTtcblxuQXRsYXMucHJvdG90eXBlLmFkZFN1YlRleHR1cmUgPSBmdW5jdGlvbiAodGV4dHVyZSkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRGcmVlTm9kZSh0aGlzLnRyZWUsIHRleHR1cmUpO1xuICAgIGlmIChub2RlID09IG51bGwpXG4gICAgICAgIHRocm93ICdFcnJvcjogVW5hYmxlIHRvIHBhY2sgc3ViIHRleHR1cmUhIEl0IHNpbXBseSB3b25cXCd0IGZpdC4gOi8nO1xuICAgIG5vZGUudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5zdWJUZXh0dXJlcy5wdXNoKHtcbiAgICAgICAgdGV4dHVyZTogbm9kZS50ZXh0dXJlLFxuICAgICAgICB4OiBub2RlLngsIHk6IG5vZGUueSxcbiAgICAgICAgd2lkdGg6IG5vZGUud2lkdGgsIGhlaWdodDogbm9kZS5oZWlnaHQsXG4gICAgICAgIHMxOiBub2RlLnggLyB0aGlzLnRyZWUud2lkdGgsXG4gICAgICAgIHQxOiBub2RlLnkgLyB0aGlzLnRyZWUuaGVpZ2h0LFxuICAgICAgICBzMjogKG5vZGUueCArIG5vZGUud2lkdGgpIC8gdGhpcy50cmVlLndpZHRoLFxuICAgICAgICB0MjogKG5vZGUueSArIG5vZGUuaGVpZ2h0KSAvIHRoaXMudHJlZS5oZWlnaHRcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5zdWJUZXh0dXJlcy5sZW5ndGggLSAxO1xufTtcblxuQXRsYXMucHJvdG90eXBlLnJldXNlU3ViVGV4dHVyZSA9IGZ1bmN0aW9uIChzMSwgdDEsIHMyLCB0Mikge1xuICAgIHRoaXMuc3ViVGV4dHVyZXMucHVzaCh7IHMxOiBzMSwgdDE6IHQxLCBzMjogczIsIHQyOiB0MiB9KTtcbn07XG5cbkF0bGFzLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oc2hhZGVyKSB7XG5cbiAgICB2YXIgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnN1YlRleHR1cmVzLmxlbmd0aCAqIDYgKiA1KTsgLy8geCx5LHoscyx0XG4gICAgdmFyIHdpZHRoID0gdGhpcy50cmVlLndpZHRoO1xuICAgIHZhciBoZWlnaHQgPSB0aGlzLnRyZWUuaGVpZ2h0O1xuICAgIHZhciBvZmZzZXQgPSAwO1xuICAgIHZhciBzdWJUZXh0dXJlcyA9IHRoaXMuc3ViVGV4dHVyZXM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJUZXh0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc3ViVGV4dHVyZSA9IHN1YlRleHR1cmVzW2ldO1xuICAgICAgICB0aGlzLmFkZFNwcml0ZShidWZmZXIsIG9mZnNldCxcbiAgICAgICAgICAgIHN1YlRleHR1cmUueCwgc3ViVGV4dHVyZS55LFxuICAgICAgICAgICAgc3ViVGV4dHVyZS53aWR0aCwgc3ViVGV4dHVyZS5oZWlnaHQpO1xuICAgICAgICBvZmZzZXQgKz0gKDYgKiA1KTtcbiAgICB9XG5cbiAgICB2YXIgdmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlciwgZ2wuU1RBVElDX0RSQVcpO1xuXG4gICAgdmFyIHRleHR1cmUgPSBuZXcgVGV4dHVyZShudWxsLCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQvKiwgZmlsdGVyOiBnbC5ORUFSRVNUICovIH0pO1xuICAgIHRleHR1cmUuZHJhd1RvKGZ1bmN0aW9uIChwcm9qZWN0aW9uTWF0cml4KSB7XG4gICAgICAgIHNoYWRlci51c2UoKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyLmF0dHJpYnV0ZXMudmVydGV4QXR0cmlidXRlKTtcbiAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyLmF0dHJpYnV0ZXMudGV4Q29vcmRzQXR0cmlidXRlKTtcbiAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy52ZXJ0ZXhBdHRyaWJ1dGUsIDMsIGdsLkZMT0FULCBmYWxzZSwgMjAsIDApO1xuICAgICAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlci5hdHRyaWJ1dGVzLnRleENvb3Jkc0F0dHJpYnV0ZSwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgMTIpO1xuICAgICAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHNoYWRlci51bmlmb3Jtcy5wcm9qZWN0aW9uTWF0cml4LCBmYWxzZSwgcHJvamVjdGlvbk1hdHJpeCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3ViVGV4dHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzdWJUZXh0dXJlID0gc3ViVGV4dHVyZXNbaV07XG4gICAgICAgICAgICBpZiAoIXN1YlRleHR1cmUudGV4dHVyZSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc3ViVGV4dHVyZS50ZXh0dXJlLmlkKTtcbiAgICAgICAgICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCBpICogNiwgNik7XG5cbiAgICAgICAgICAgIGdsLmRlbGV0ZVRleHR1cmUoc3ViVGV4dHVyZS50ZXh0dXJlLmlkKTtcbiAgICAgICAgICAgIHN1YlRleHR1cmUudGV4dHVyZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLnRleHR1cmUgPSB0ZXh0dXJlO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcbiAgICBnbC5kZWxldGVCdWZmZXIodmVydGV4QnVmZmVyKTtcbiAgICB0aGlzLnRyZWUgPSBudWxsO1xufTtcblxuQXRsYXMucHJvdG90eXBlLmFkZFNwcml0ZSA9IGZ1bmN0aW9uIChkYXRhLCBvZmZzZXQsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgeiA9IDA7XG4gICAgZGF0YVtvZmZzZXQgKyAwXSA9IHg7IGRhdGFbb2Zmc2V0ICsgMV0gPSB5OyBkYXRhW29mZnNldCArIDJdID0gejtcbiAgICBkYXRhW29mZnNldCArIDNdID0gMDsgZGF0YVtvZmZzZXQgKyA0XSA9IDA7XG4gICAgZGF0YVtvZmZzZXQgKyA1XSA9IHggKyB3aWR0aDsgZGF0YVtvZmZzZXQgKyA2XSA9IHk7IGRhdGFbb2Zmc2V0ICsgN10gPSB6O1xuICAgIGRhdGFbb2Zmc2V0ICsgOF0gPSAxOyBkYXRhW29mZnNldCArIDldID0gMDtcbiAgICBkYXRhW29mZnNldCArIDEwXSA9IHggKyB3aWR0aDsgZGF0YVtvZmZzZXQgKyAxMV0gPSB5ICsgaGVpZ2h0OyBkYXRhW29mZnNldCArIDEyXSA9IHo7XG4gICAgZGF0YVtvZmZzZXQgKyAxM10gPSAxOyBkYXRhW29mZnNldCArIDE0XSA9IDE7XG4gICAgZGF0YVtvZmZzZXQgKyAxNV0gPSB4ICsgd2lkdGg7IGRhdGFbb2Zmc2V0ICsgMTZdID0geSArIGhlaWdodDsgZGF0YVtvZmZzZXQgKyAxN10gPSB6O1xuICAgIGRhdGFbb2Zmc2V0ICsgMThdID0gMTsgZGF0YVtvZmZzZXQgKyAxOV0gPSAxO1xuICAgIGRhdGFbb2Zmc2V0ICsgMjBdID0geDsgZGF0YVtvZmZzZXQgKyAyMV0gPSB5ICsgaGVpZ2h0OyBkYXRhW29mZnNldCArIDIyXSA9IHo7XG4gICAgZGF0YVtvZmZzZXQgKyAyM10gPSAwOyBkYXRhW29mZnNldCArIDI0XSA9IDE7XG4gICAgZGF0YVtvZmZzZXQgKyAyNV0gPSB4OyBkYXRhW29mZnNldCArIDI2XSA9IHk7IGRhdGFbb2Zmc2V0ICsgMjddID0gejtcbiAgICBkYXRhW29mZnNldCArIDI4XSA9IDA7IGRhdGFbb2Zmc2V0ICsgMjldID0gMDtcbn07XG5cbkF0bGFzLnByb3RvdHlwZS5nZXRGcmVlTm9kZSA9IGZ1bmN0aW9uIChub2RlLCB0ZXh0dXJlKSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW5bMF0gfHwgbm9kZS5jaGlsZHJlblsxXSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5nZXRGcmVlTm9kZShub2RlLmNoaWxkcmVuWzBdLCB0ZXh0dXJlKTtcbiAgICAgICAgaWYgKHJlc3VsdClcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RnJlZU5vZGUobm9kZS5jaGlsZHJlblsxXSwgdGV4dHVyZSk7XG4gICAgfVxuXG4gICAgaWYgKG5vZGUudGV4dHVyZSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgaWYgKG5vZGUud2lkdGggPCB0ZXh0dXJlLndpZHRoIHx8IG5vZGUuaGVpZ2h0IDwgdGV4dHVyZS5oZWlnaHQpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIGlmIChub2RlLndpZHRoID09IHRleHR1cmUud2lkdGggJiYgbm9kZS5oZWlnaHQgPT0gdGV4dHVyZS5oZWlnaHQpXG4gICAgICAgIHJldHVybiBub2RlO1xuXG4gICAgdmFyIGR3ID0gbm9kZS53aWR0aCAtIHRleHR1cmUud2lkdGg7XG4gICAgdmFyIGRoID0gbm9kZS5oZWlnaHQgLSB0ZXh0dXJlLmhlaWdodDtcblxuICAgIGlmIChkdyA+IGRoKSB7XG4gICAgICAgIG5vZGUuY2hpbGRyZW5bMF0gPSB7IGNoaWxkcmVuOiBbbnVsbCwgbnVsbF0sXG4gICAgICAgICAgICB4OiBub2RlLngsXG4gICAgICAgICAgICB5OiBub2RlLnksXG4gICAgICAgICAgICB3aWR0aDogdGV4dHVyZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogbm9kZS5oZWlnaHRcbiAgICAgICAgfTtcbiAgICAgICAgbm9kZS5jaGlsZHJlblsxXSA9IHsgY2hpbGRyZW46IFtudWxsLCBudWxsXSxcbiAgICAgICAgICAgIHg6IG5vZGUueCArIHRleHR1cmUud2lkdGgsXG4gICAgICAgICAgICB5OiBub2RlLnksXG4gICAgICAgICAgICB3aWR0aDogbm9kZS53aWR0aCAtIHRleHR1cmUud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IG5vZGUuaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZS5jaGlsZHJlblswXSA9IHsgY2hpbGRyZW46IFtudWxsLCBudWxsXSxcbiAgICAgICAgICAgIHg6IG5vZGUueCxcbiAgICAgICAgICAgIHk6IG5vZGUueSxcbiAgICAgICAgICAgIHdpZHRoOiBub2RlLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0ZXh0dXJlLmhlaWdodFxuICAgICAgICB9O1xuICAgICAgICBub2RlLmNoaWxkcmVuWzFdID0geyBjaGlsZHJlbjogW251bGwsIG51bGxdLFxuICAgICAgICAgICAgeDogbm9kZS54LFxuICAgICAgICAgICAgeTogbm9kZS55ICsgdGV4dHVyZS5oZWlnaHQsXG4gICAgICAgICAgICB3aWR0aDogbm9kZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogbm9kZS5oZWlnaHQgLSB0ZXh0dXJlLmhlaWdodFxuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRGcmVlTm9kZShub2RlLmNoaWxkcmVuWzBdLCB0ZXh0dXJlKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IEF0bGFzO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2dsL2F0bGFzLmpzXCIsXCIvZ2xcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG5cbnZhciBGb250ID0gZnVuY3Rpb24gKHRleHR1cmUsIGNoYXJXaWR0aCwgY2hhckhlaWdodCkge1xuICAgIHRoaXMudGV4dHVyZSA9IHRleHR1cmU7XG4gICAgdGhpcy5jaGFyV2lkdGggPSBjaGFyV2lkdGggfHwgODtcbiAgICB0aGlzLmNoYXJIZWlnaHQgPSBjaGFySGVpZ2h0IHx8IDg7XG4gICAgdGhpcy5kYXRhID0gbmV3IEZsb2F0MzJBcnJheSg2ICogNSAqIDQgKiAxMDI0KTsgLy8gPD0gMTAyNCBtYXggY2hhcmFjdGVycy5cbiAgICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIHRoaXMudmVydGV4QnVmZmVyLm5hbWUgPSAnc3ByaXRlRm9udCc7XG4gICAgdGhpcy5vZmZzZXQgPSAwO1xuICAgIHRoaXMuZWxlbWVudENvdW50ID0gMDtcbn07XG5cbkZvbnQucHJvdG90eXBlLmFkZFZlcnRleCA9IGZ1bmN0aW9uKHgsIHksIHUsIHYpIHtcbiAgICB0aGlzLmRhdGFbdGhpcy5vZmZzZXQrK10gPSB4O1xuICAgIHRoaXMuZGF0YVt0aGlzLm9mZnNldCsrXSA9IHk7XG4gICAgdGhpcy5kYXRhW3RoaXMub2Zmc2V0KytdID0gMDtcbiAgICB0aGlzLmRhdGFbdGhpcy5vZmZzZXQrK10gPSB1O1xuICAgIHRoaXMuZGF0YVt0aGlzLm9mZnNldCsrXSA9IHY7XG59O1xuXG5Gb250LnByb3RvdHlwZS5kcmF3Q2hhcmFjdGVyID0gZnVuY3Rpb24oeCwgeSwgaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT0gMzIgfHwgeSA8IDAgfHwgeCA8IDAgfHwgeCA+IGdsLndpZHRoIHx8IHkgPiBnbC5oZWlnaHQpXG4gICAgICAgIHJldHVybjtcblxuICAgIGluZGV4ICY9IDI1NTtcbiAgICB2YXIgcm93ID0gaW5kZXggPj4gNDtcbiAgICB2YXIgY29sdW1uID0gaW5kZXggJiAxNTtcblxuICAgIHZhciBmcm93ID0gcm93ICogMC4wNjI1O1xuICAgIHZhciBmY29sID0gY29sdW1uICogMC4wNjI1O1xuICAgIHZhciBzaXplID0gMC4wNjI1O1xuXG4gICAgdGhpcy5hZGRWZXJ0ZXgoeCwgeSwgZmNvbCwgZnJvdyk7XG4gICAgdGhpcy5hZGRWZXJ0ZXgoeCArIHRoaXMuY2hhcldpZHRoLCB5LCBmY29sICsgc2l6ZSwgZnJvdyk7XG4gICAgdGhpcy5hZGRWZXJ0ZXgoeCArIHRoaXMuY2hhcldpZHRoLCB5ICsgdGhpcy5jaGFySGVpZ2h0LCBmY29sICsgc2l6ZSwgIGZyb3cgKyBzaXplKTtcbiAgICB0aGlzLmFkZFZlcnRleCh4ICsgdGhpcy5jaGFyV2lkdGgsIHkgKyB0aGlzLmNoYXJIZWlnaHQsIGZjb2wgKyBzaXplLCAgZnJvdyArIHNpemUpO1xuICAgIHRoaXMuYWRkVmVydGV4KHgsIHkgKyB0aGlzLmNoYXJIZWlnaHQsIGZjb2wsIGZyb3cgKyBzaXplKTtcbiAgICB0aGlzLmFkZFZlcnRleCh4LCB5LCBmY29sLCBmcm93KTtcbiAgICB0aGlzLmVsZW1lbnRDb3VudCArPSA2O1xufTtcblxuRm9udC5wcm90b3R5cGUuZHJhd1N0cmluZyA9IGZ1bmN0aW9uKHgsIHksIHN0ciwgbW9kZSkge1xuICAgIHZhciBvZmZzZXQgPSBtb2RlID8gMTI4IDogMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy5kcmF3Q2hhcmFjdGVyKHggKyAoKGkgKyAxKSAqIHRoaXMuY2hhcldpZHRoKSwgeSwgc3RyLmNoYXJDb2RlQXQoaSkgKyBvZmZzZXQpO1xufTtcblxuRm9udC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2hhZGVyLCBwKSB7XG4gICAgaWYgKCF0aGlzLmVsZW1lbnRDb3VudClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgc2hhZGVyLnVzZSgpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHRoaXMuZGF0YSwgZ2wuU1RSRUFNX0RSQVcpO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyLmF0dHJpYnV0ZXMudmVydGV4QXR0cmlidXRlLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDIwLCAwKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlci5hdHRyaWJ1dGVzLnRleENvb3Jkc0F0dHJpYnV0ZSwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgMTIpO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlci5hdHRyaWJ1dGVzLnZlcnRleEF0dHJpYnV0ZSk7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyLmF0dHJpYnV0ZXMudGV4Q29vcmRzQXR0cmlidXRlKTtcblxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyLnVuaWZvcm1zLnByb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBwKTtcblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZS5pZCk7XG4gICAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRVMsIDAsIHRoaXMuZWxlbWVudENvdW50KTtcblxuXG4gICAgdGhpcy5lbGVtZW50Q291bnQgPSAwO1xuICAgIHRoaXMub2Zmc2V0ID0gMDtcblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IEZvbnQ7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2dsL2ZvbnQuanNcIixcIi9nbFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBnbE1hdHJpeCA9IHJlcXVpcmUoJ2xpYi9nbC1tYXRyaXgtbWluLmpzJyk7XG5cbnZhciBnbCA9IGZ1bmN0aW9uKCkge307XG5cbmdsLmluaXQgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICBpZiAoIWNhbnZhcylcbiAgICAgICAgdGhyb3cgJ0Vycm9yOiBObyBjYW52YXMgZWxlbWVudCBmb3VuZC4nO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7fTtcbiAgICB2YXIgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHRpb25zKTtcbiAgICBpZiAoIWdsKVxuICAgICAgICB0aHJvdyAnRXJyb3I6IE5vIFdlYkdMIHN1cHBvcnQgZm91bmQuJztcblx0Y2FudmFzLndpZHRoICA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG5cbiAgICBnbC53aWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICBnbC5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgIGdsLmNsZWFyQ29sb3IoMCwgMCwgMCwgMSk7XG4gICAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSk7XG4gICAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XG4gICAgLy9nbC5jdWxsRmFjZShnbC5GUk9OVCk7XG4gICAgZ2wudmlld3BvcnQoMCwgMCwgZ2wud2lkdGgsIGdsLmhlaWdodCk7XG5cbiAgICB3aW5kb3cudmVjMiA9IGdsTWF0cml4LnZlYzI7XG4gICAgd2luZG93LnZlYzMgPSBnbE1hdHJpeC52ZWMzO1xuICAgIHdpbmRvdy5tYXQ0ID0gZ2xNYXRyaXgubWF0NDtcbiAgICB3aW5kb3cuZ2wgPSBnbDtcblxuICAgIHJldHVybiBnbDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGdsO1xuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZ2wvZ2wuanNcIixcIi9nbFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxudmFyIExpZ2h0TWFwID0gZnVuY3Rpb24oZGF0YSwgb2Zmc2V0LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG5cbiAgICB2YXIgcGl4ZWxzID0gbmV3IFVpbnQ4QXJyYXkod2lkdGggKiBoZWlnaHQgKiAzKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoICogaGVpZ2h0OyBpKyspIHtcbiAgICAgICAgdmFyIGludGVuc2l0eSA9IGRhdGFbb2Zmc2V0ICsgaV07XG4gICAgICAgIGludGVuc2l0eSA9ICFpbnRlbnNpdHkgPyAwIDogaW50ZW5zaXR5O1xuICAgICAgICBwaXhlbHNbaSAqIDMgKyAwXSA9IGludGVuc2l0eTtcbiAgICAgICAgcGl4ZWxzW2kgKiAzICsgMV0gPSBpbnRlbnNpdHk7XG4gICAgICAgIHBpeGVsc1tpICogMyArIDJdID0gaW50ZW5zaXR5O1xuICAgIH1cblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xuXG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0IsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCAwLCBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVscyk7XG59O1xuXG5MaWdodE1hcC5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKHVuaXQpIHtcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgKHVuaXQgfHwgMCkpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xufTtcblxuTGlnaHRNYXAucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKHVuaXQpIHtcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgKHVuaXQgfHwgMCkpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIG51bGwpO1xufTtcblxuTGlnaHRNYXAucHJvdG90eXBlLmFzRGF0YVVybCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmcmFtZWJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmcmFtZWJ1ZmZlcik7XG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCB0aGlzLmlkLCAwKTtcblxuICAgIHZhciB3aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IHRoaXMuaGVpZ2h0O1xuXG4gICAgLy8gUmVhZCB0aGUgY29udGVudHMgb2YgdGhlIGZyYW1lYnVmZmVyXG4gICAgdmFyIGRhdGEgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xuICAgIGdsLnJlYWRQaXhlbHMoMCwgMCwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgZGF0YSk7XG4gICAgZ2wuZGVsZXRlRnJhbWVidWZmZXIoZnJhbWVidWZmZXIpO1xuXG4gICAgLy8gQ3JlYXRlIGEgMkQgY2FudmFzIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgLy8gQ29weSB0aGUgcGl4ZWxzIHRvIGEgMkQgY2FudmFzXG4gICAgdmFyIGltYWdlRGF0YSA9IGNvbnRleHQuY3JlYXRlSW1hZ2VEYXRhKHdpZHRoLCBoZWlnaHQpO1xuICAgIGltYWdlRGF0YS5kYXRhLnNldChkYXRhKTtcbiAgICBjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBMaWdodE1hcDtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZ2wvbGlnaHRtYXAuanNcIixcIi9nbFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxuZnVuY3Rpb24gY29tcGlsZVNoYWRlcih0eXBlLCBzb3VyY2UpIHtcbiAgICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpO1xuICAgIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgIHRocm93ICdFcnJvcjogU2hhZGVyIGNvbXBpbGUgZXJyb3I6ICcgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcik7XG4gICAgfVxuICAgIHJldHVybiBzaGFkZXI7XG59XG5cbnZhciBTaGFkZXIgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICB2YXIgdmVydGV4U3RhcnQgPSBzb3VyY2UuaW5kZXhPZignW3ZlcnRleF0nKTtcbiAgICB2YXIgZnJhZ21lbnRTdGFydCA9IHNvdXJjZS5pbmRleE9mKCdbZnJhZ21lbnRdJyk7XG4gICAgaWYgKHZlcnRleFN0YXJ0ID09PSAtMSB8fCBmcmFnbWVudFN0YXJ0ID09PSAtMSlcbiAgICAgICAgdGhyb3cgJ0Vycm9yOiBNaXNzaW5nIFtmcmFnbWVudF0gYW5kL29yIFt2ZXJ0ZXhdIG1hcmtlcnMgaW4gc2hhZGVyLic7XG5cbiAgICB2YXIgdmVydGV4U291cmNlID0gc291cmNlLnN1YnN0cmluZyh2ZXJ0ZXhTdGFydCArIDgsIGZyYWdtZW50U3RhcnQpO1xuICAgIHZhciBmcmFnbWVudFNvdXJjZSA9IHNvdXJjZS5zdWJzdHJpbmcoZnJhZ21lbnRTdGFydCArIDEwKTtcbiAgICB0aGlzLmNvbXBpbGUodmVydGV4U291cmNlLCBmcmFnbWVudFNvdXJjZSk7XG59O1xuXG5TaGFkZXIucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbih2ZXJ0ZXhTb3VyY2UsIGZyYWdtZW50U291cmNlKSB7XG4gICAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGNvbXBpbGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUiwgdmVydGV4U291cmNlKSk7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGNvbXBpbGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSLCBmcmFnbWVudFNvdXJjZSkpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUykpXG4gICAgICAgIHRocm93ICdFcnJvcjogU2hhZGVyIGxpbmtpbmcgZXJyb3I6ICcgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKTtcblxuICAgIHZhciBzb3VyY2VzID0gdmVydGV4U291cmNlICsgZnJhZ21lbnRTb3VyY2U7XG4gICAgdmFyIGxpbmVzID0gc291cmNlcy5tYXRjaCgvKHVuaWZvcm18YXR0cmlidXRlKVxccytcXHcrXFxzK1xcdysoPz07KS9nKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5zYW1wbGVycyA9IFtdO1xuICAgIGZvciAodmFyIGkgaW4gbGluZXMpIHtcbiAgICAgICAgdmFyIHRva2VucyA9IGxpbmVzW2ldLnNwbGl0KCcgJyk7XG4gICAgICAgIHZhciBuYW1lID0gdG9rZW5zWzJdO1xuICAgICAgICB2YXIgdHlwZSA9IHRva2Vuc1sxXTtcbiAgICAgICAgc3dpdGNoICh0b2tlbnNbMF0pIHtcbiAgICAgICAgICAgIGNhc2UgJ2F0dHJpYnV0ZSc6XG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZUxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgbmFtZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzW25hbWVdID0gYXR0cmlidXRlTG9jYXRpb247XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1bmlmb3JtJzpcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgbmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdzYW1wbGVyMkQnKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNhbXBsZXJzLnB1c2gobG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMudW5pZm9ybXNbbmFtZV0gPSBsb2NhdGlvbjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgYXR0cmlidXRlL3VuaWZvcm0gZm91bmQ6ICcgKyB0b2tlbnNbMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbn07XG5cblNoYWRlci5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24oKSB7XG4gICAgZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gU2hhZGVyO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9nbC9zaGFkZXIuanNcIixcIi9nbFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBBdGxhcyA9IHJlcXVpcmUoJ2dsL2F0bGFzJyk7XG5cbnZhciBTcHJpdGVzID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIHNwcml0ZUNvdW50KSB7XG4gICAgdGhpcy5zcHJpdGVDb21wb25lbnRzID0gOTsgLy8geHl6LCB1diwgcmdiYVxuICAgIHRoaXMuc3ByaXRlVmVydGljZXMgPSA2O1xuICAgIHRoaXMubWF4U3ByaXRlcyA9IHNwcml0ZUNvdW50IHx8IDEyODtcbiAgICB0aGlzLnRleHR1cmVzID0gbmV3IEF0bGFzKHdpZHRoLCBoZWlnaHQpO1xuICAgIHRoaXMuc3ByaXRlQ291bnQgPSAwO1xuICAgIHRoaXMuZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5tYXhTcHJpdGVzICogdGhpcy5zcHJpdGVDb21wb25lbnRzICogdGhpcy5zcHJpdGVWZXJ0aWNlcyk7XG4gICAgdGhpcy52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG59O1xuXG5TcHJpdGVzLnByb3RvdHlwZS5kcmF3U3ByaXRlID0gZnVuY3Rpb24gKHRleHR1cmUsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHIsIGcsIGIsIGEpIHtcbiAgICB2YXIgeiA9IDA7XG4gICAgdmFyIGRhdGEgPSB0aGlzLmRhdGE7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuc3ByaXRlQ291bnQgKiB0aGlzLnNwcml0ZVZlcnRpY2VzICogdGhpcy5zcHJpdGVDb21wb25lbnRzO1xuICAgIHZhciB0ID0gdGhpcy50ZXh0dXJlcy5nZXRTdWJUZXh0dXJlKHRleHR1cmUpO1xuICAgIHdpZHRoID0gd2lkdGggfHwgdC53aWR0aDtcbiAgICBoZWlnaHQgPSBoZWlnaHQgfHwgdC5oZWlnaHQ7XG5cbiAgICBkYXRhW29mZnNldCArIDBdID0geDtcbiAgICBkYXRhW29mZnNldCArIDFdID0geTtcbiAgICBkYXRhW29mZnNldCArIDJdID0gejtcbiAgICBkYXRhW29mZnNldCArIDNdID0gdC5zMTtcbiAgICBkYXRhW29mZnNldCArIDRdID0gdC50MTtcbiAgICBkYXRhW29mZnNldCArIDVdID0gcjtcbiAgICBkYXRhW29mZnNldCArIDZdID0gZztcbiAgICBkYXRhW29mZnNldCArIDddID0gYjtcbiAgICBkYXRhW29mZnNldCArIDhdID0gYTtcblxuICAgIGRhdGFbb2Zmc2V0ICsgOV0gPSB4ICsgd2lkdGg7XG4gICAgZGF0YVtvZmZzZXQgKyAxMF0gPSB5O1xuICAgIGRhdGFbb2Zmc2V0ICsgMTFdID0gejtcbiAgICBkYXRhW29mZnNldCArIDEyXSA9IHQuczI7XG4gICAgZGF0YVtvZmZzZXQgKyAxM10gPSB0LnQxO1xuICAgIGRhdGFbb2Zmc2V0ICsgMTRdID0gcjtcbiAgICBkYXRhW29mZnNldCArIDE1XSA9IGc7XG4gICAgZGF0YVtvZmZzZXQgKyAxNl0gPSBiO1xuICAgIGRhdGFbb2Zmc2V0ICsgMTddID0gYTtcblxuICAgIGRhdGFbb2Zmc2V0ICsgMThdID0geCArIHdpZHRoO1xuICAgIGRhdGFbb2Zmc2V0ICsgMTldID0geSArIGhlaWdodDtcbiAgICBkYXRhW29mZnNldCArIDIwXSA9IHo7XG4gICAgZGF0YVtvZmZzZXQgKyAyMV0gPSB0LnMyO1xuICAgIGRhdGFbb2Zmc2V0ICsgMjJdID0gdC50MjtcbiAgICBkYXRhW29mZnNldCArIDIzXSA9IHI7XG4gICAgZGF0YVtvZmZzZXQgKyAyNF0gPSBnO1xuICAgIGRhdGFbb2Zmc2V0ICsgMjVdID0gYjtcbiAgICBkYXRhW29mZnNldCArIDI2XSA9IGE7XG5cbiAgICBkYXRhW29mZnNldCArIDI3XSA9IHggKyB3aWR0aDtcbiAgICBkYXRhW29mZnNldCArIDI4XSA9IHkgKyBoZWlnaHQ7XG4gICAgZGF0YVtvZmZzZXQgKyAyOV0gPSB6O1xuICAgIGRhdGFbb2Zmc2V0ICsgMzBdID0gdC5zMjtcbiAgICBkYXRhW29mZnNldCArIDMxXSA9IHQudDI7XG4gICAgZGF0YVtvZmZzZXQgKyAzMl0gPSByO1xuICAgIGRhdGFbb2Zmc2V0ICsgMzNdID0gZztcbiAgICBkYXRhW29mZnNldCArIDM0XSA9IGI7XG4gICAgZGF0YVtvZmZzZXQgKyAzNV0gPSBhO1xuXG4gICAgZGF0YVtvZmZzZXQgKyAzNl0gPSB4O1xuICAgIGRhdGFbb2Zmc2V0ICsgMzddID0geSArIGhlaWdodDtcbiAgICBkYXRhW29mZnNldCArIDM4XSA9IHo7XG4gICAgZGF0YVtvZmZzZXQgKyAzOV0gPSB0LnMxO1xuICAgIGRhdGFbb2Zmc2V0ICsgNDBdID0gdC50MjtcbiAgICBkYXRhW29mZnNldCArIDQxXSA9IHI7XG4gICAgZGF0YVtvZmZzZXQgKyA0Ml0gPSBnO1xuICAgIGRhdGFbb2Zmc2V0ICsgNDNdID0gYjtcbiAgICBkYXRhW29mZnNldCArIDQ0XSA9IGE7XG5cbiAgICBkYXRhW29mZnNldCArIDQ1XSA9IHg7XG4gICAgZGF0YVtvZmZzZXQgKyA0Nl0gPSB5O1xuICAgIGRhdGFbb2Zmc2V0ICsgNDddID0gejtcbiAgICBkYXRhW29mZnNldCArIDQ4XSA9IHQuczE7XG4gICAgZGF0YVtvZmZzZXQgKyA0OV0gPSB0LnQxO1xuICAgIGRhdGFbb2Zmc2V0ICsgNTBdID0gcjtcbiAgICBkYXRhW29mZnNldCArIDUxXSA9IGc7XG4gICAgZGF0YVtvZmZzZXQgKyA1Ml0gPSBiO1xuICAgIGRhdGFbb2Zmc2V0ICsgNTNdID0gYTtcblxuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLnNwcml0ZUNvdW50Kys7XG59O1xuXG5TcHJpdGVzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNwcml0ZUNvdW50ID0gMDtcbn07XG5cblNwcml0ZXMucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChzaGFkZXIsIHAsIGZpcnN0U3ByaXRlLCBzcHJpdGVDb3VudCkge1xuICAgIGlmICh0aGlzLnNwcml0ZUNvdW50IDw9IDApXG4gICAgICAgIHJldHVybjtcblxuICAgIGZpcnN0U3ByaXRlID0gZmlyc3RTcHJpdGUgfHwgMDtcbiAgICBzcHJpdGVDb3VudCA9IHNwcml0ZUNvdW50IHx8IHRoaXMuc3ByaXRlQ291bnQ7XG5cbiAgICBzaGFkZXIudXNlKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyKTtcblxuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlci5hdHRyaWJ1dGVzLnZlcnRleEF0dHJpYnV0ZSk7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2hhZGVyLmF0dHJpYnV0ZXMudGV4Q29vcmRzQXR0cmlidXRlKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXIuYXR0cmlidXRlcy5jb2xvcnNBdHRyaWJ1dGUpO1xuXG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy52ZXJ0ZXhBdHRyaWJ1dGUsIDMsIGdsLkZMT0FULCBmYWxzZSwgMzYsIDApO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyLmF0dHJpYnV0ZXMudGV4Q29vcmRzQXR0cmlidXRlLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDM2LCAxMik7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy5jb2xvcnNBdHRyaWJ1dGUsIDQsIGdsLkZMT0FULCBmYWxzZSwgMzYsIDIwKTtcblxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyLnVuaWZvcm1zLnByb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBwKTtcblxuICAgIGlmICh0aGlzLmRpcnR5KSB7XG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmRhdGEsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmVzLnRleHR1cmUuaWQpO1xuICAgIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCBmaXJzdFNwcml0ZSAqIHRoaXMuc3ByaXRlVmVydGljZXMsIHNwcml0ZUNvdW50ICogdGhpcy5zcHJpdGVWZXJ0aWNlcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBTcHJpdGVzO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2dsL3Nwcml0ZXMuanNcIixcIi9nbFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciB1dGlscyA9IHJlcXVpcmUoJ3V0aWxzJyk7XG5cbnZhciBUZXh0dXJlID0gZnVuY3Rpb24oZmlsZSwgb3B0aW9ucykge1xuICAgIHZhciBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLmFscGhhID0gb3B0aW9ucy5hbHBoYSB8fCBmYWxzZTtcbiAgICBvcHRpb25zLmZvcm1hdCA9IG9wdGlvbnMuZm9ybWF0IHx8IGdsLlJHQkE7XG4gICAgb3B0aW9ucy50eXBlID0gb3B0aW9ucy50eXBlIHx8IGdsLlVOU0lHTkVEX0JZVEU7XG4gICAgb3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmZpbHRlciB8fCBnbC5MSU5FQVI7XG4gICAgb3B0aW9ucy53cmFwID0gb3B0aW9ucy53cmFwIHx8IGdsLkNMQU1QX1RPX0VER0U7XG5cbiAgICB0aGlzLmlkID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICAgIHRoaXMud2lkdGggPSBvcHRpb25zLndpZHRoIHx8IGZpbGUucmVhZFVJbnQzMigpO1xuICAgIHRoaXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQgfHwgZmlsZS5yZWFkVUludDMyKCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIG9wdGlvbnMuZmlsdGVyKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgb3B0aW9ucy5maWx0ZXIpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIG9wdGlvbnMud3JhcCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgb3B0aW9ucy53cmFwKTtcblxuICAgIGlmIChmaWxlKSB7XG4gICAgICAgIGlmICghb3B0aW9ucy5wYWxldHRlKVxuICAgICAgICAgICAgdGhyb3cgJ0Vycm9yOiBObyBwYWxldHRlIHNwZWNpZmllZCBpbiBvcHRpb25zLic7XG5cbiAgICAgICAgdmFyIHBpeGVscyA9IG9wdGlvbnMucGFsZXR0ZS51bnBhY2soZmlsZSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIG9wdGlvbnMuYWxwaGEpO1xuICAgICAgICB2YXIgbnBvdCA9IHV0aWxzLmlzUG93ZXJPZjIodGhpcy53aWR0aCkgJiYgdXRpbHMuaXNQb3dlck9mMih0aGlzLmhlaWdodCk7XG4gICAgICAgIGlmICghbnBvdCAmJiBvcHRpb25zLndyYXAgPT09IGdsLlJFUEVBVCkge1xuICAgICAgICAgICAgdmFyIG5ld1dpZHRoID0gdXRpbHMubmV4dFBvd2VyT2YyKHRoaXMud2lkdGgpO1xuICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IHV0aWxzLm5leHRQb3dlck9mMih0aGlzLmhlaWdodCk7XG4gICAgICAgICAgICBwaXhlbHMgPSB0aGlzLnJlc2FtcGxlKHBpeGVscywgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBvcHRpb25zLmZvcm1hdCwgbmV3V2lkdGgsIG5ld0hlaWdodCxcbiAgICAgICAgICAgICAgICAwLCBvcHRpb25zLmZvcm1hdCwgb3B0aW9ucy50eXBlLCBwaXhlbHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBvcHRpb25zLmZvcm1hdCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgMCwgb3B0aW9ucy5mb3JtYXQsIG9wdGlvbnMudHlwZSwgcGl4ZWxzKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgb3B0aW9ucy5mb3JtYXQsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgMCwgb3B0aW9ucy5mb3JtYXQsIG9wdGlvbnMudHlwZSwgbnVsbCk7XG4gICAgfVxufTtcblxuVGV4dHVyZS5wcm90b3R5cGUuZHJhd1RvID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIHYgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuVklFV1BPUlQpO1xuXG4gICAgLyogU2V0dXAgc2hhcmVkIGJ1ZmZlcnMgZm9yIHJlbmRlciB0YXJnZXQgZHJhd2luZyAqL1xuICAgIGlmICh0eXBlb2YgVGV4dHVyZS5mcmFtZUJ1ZmZlciA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBUZXh0dXJlLmZyYW1lQnVmZmVyID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcbiAgICAgICAgVGV4dHVyZS5yZW5kZXJCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgICB9XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIFRleHR1cmUuZnJhbWVCdWZmZXIpO1xuICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBUZXh0dXJlLnJlbmRlckJ1ZmZlcik7XG4gICAgaWYgKHRoaXMud2lkdGggIT0gVGV4dHVyZS5yZW5kZXJCdWZmZXIud2lkdGggfHwgdGhpcy5oZWlnaHQgIT0gVGV4dHVyZS5yZW5kZXJCdWZmZXIuaGVpZ2h0KSB7XG4gICAgICAgIFRleHR1cmUucmVuZGVyQnVmZmVyLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICAgICAgVGV4dHVyZS5yZW5kZXJCdWZmZXIuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5ERVBUSF9DT01QT05FTlQxNiwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCwgMCk7XG4gICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsIGdsLlJFTkRFUkJVRkZFUiwgVGV4dHVyZS5yZW5kZXJCdWZmZXIpO1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblxuICAgIHZhciBvcnRobyA9IG1hdDQub3J0aG8obWF0NC5jcmVhdGUoKSwgMCwgdGhpcy53aWR0aCwgMCwgdGhpcy5oZWlnaHQsIC0xMCwgMTApO1xuICAgIGNhbGxiYWNrKG9ydGhvKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIG51bGwpO1xuICAgIGdsLnZpZXdwb3J0KHZbMF0sIHZbMV0sIHZbMl0sIHZbM10pO1xufTtcblxuVGV4dHVyZS5wcm90b3R5cGUucmVzYW1wbGUgPSBmdW5jdGlvbihwaXhlbHMsIHdpZHRoLCBoZWlnaHQsIG5ld1dpZHRoLCBuZXdIZWlnaHQpIHtcbiAgICB2YXIgc3JjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgc3JjLndpZHRoID0gd2lkdGg7XG4gICAgc3JjLmhlaWdodCA9IGhlaWdodDtcbiAgICB2YXIgY29udGV4dCA9IHNyYy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHZhciBpbWFnZURhdGEgPSBjb250ZXh0LmNyZWF0ZUltYWdlRGF0YSh3aWR0aCwgaGVpZ2h0KTtcbiAgICBpbWFnZURhdGEuZGF0YS5zZXQocGl4ZWxzKTtcbiAgICBjb250ZXh0LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuXG4gICAgdmFyIGRlc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBkZXN0LndpZHRoID0gbmV3V2lkdGg7XG4gICAgZGVzdC5oZWlnaHQgPSBuZXdIZWlnaHQ7XG4gICAgY29udGV4dCA9IGRlc3QuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShzcmMsIDAsIDAsIGRlc3Qud2lkdGgsIGRlc3QuaGVpZ2h0KTtcbiAgICB2YXIgaW1hZ2UgPSBjb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCBkZXN0LndpZHRoLCBkZXN0LmhlaWdodCk7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGltYWdlLmRhdGEpO1xufTtcblxuVGV4dHVyZS5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKHVuaXQpIHtcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwICsgKHVuaXQgfHwgMCkpO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xufTtcblxuVGV4dHVyZS5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24odW5pdCkge1xuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTAgKyAodW5pdCB8fCAwKSk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG59O1xuXG5UZXh0dXJlLnByb3RvdHlwZS5hc0RhdGFVcmwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZnJhbWVidWZmZXIpO1xuICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGdsLkZSQU1FQlVGRkVSLCBnbC5DT0xPUl9BVFRBQ0hNRU5UMCwgZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCwgMCk7XG5cbiAgICB2YXIgd2lkdGggPSB0aGlzLndpZHRoO1xuICAgIHZhciBoZWlnaHQgPSB0aGlzLmhlaWdodDtcblxuICAgIC8vIFJlYWQgdGhlIGNvbnRlbnRzIG9mIHRoZSBmcmFtZWJ1ZmZlclxuICAgIHZhciBkYXRhID0gbmV3IFVpbnQ4QXJyYXkod2lkdGggKiBoZWlnaHQgKiA0KTtcbiAgICBnbC5yZWFkUGl4ZWxzKDAsIDAsIHdpZHRoLCBoZWlnaHQsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIGRhdGEpO1xuICAgIGdsLmRlbGV0ZUZyYW1lYnVmZmVyKGZyYW1lYnVmZmVyKTtcblxuICAgIC8vIENyZWF0ZSBhIDJEIGNhbnZhcyB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIENvcHkgdGhlIHBpeGVscyB0byBhIDJEIGNhbnZhc1xuICAgIHZhciBpbWFnZURhdGEgPSBjb250ZXh0LmNyZWF0ZUltYWdlRGF0YSh3aWR0aCwgaGVpZ2h0KTtcbiAgICBpbWFnZURhdGEuZGF0YS5zZXQoZGF0YSk7XG4gICAgY29udGV4dC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gVGV4dHVyZTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZ2wvdGV4dHVyZS5qc1wiLFwiL2dsXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIGNvbiA9IHJlcXVpcmUoJ3VpL2NvbnNvbGUnKTtcblxudmFyIGtleXMgPSB7IGxlZnQ6IDM3LCByaWdodDogMzksIHVwOiAzOCwgZG93bjogNDAsIGE6IDY1LCB6OiA5MCB9O1xuXG52YXIgSW5wdXQgPSBmdW5jdGlvbihjb25zb2xlKSB7XG4gICAgdGhpcy5sZWZ0ID0gZmFsc2U7XG4gICAgdGhpcy5yaWdodCA9IGZhbHNlO1xuICAgIHRoaXMudXAgPSBmYWxzZTtcbiAgICB0aGlzLmRvd24gPSBmYWxzZTtcbiAgICB0aGlzLmZseVVwID0gZmFsc2U7XG4gICAgdGhpcy5mbHlEb3duID0gZmFsc2U7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBjb24uaW5wdXQoZXZlbnQua2V5Q29kZSk7XG4gICAgICAgIHNlbGYua2V5RG93bihldmVudCk7XG4gICAgfSwgdHJ1ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLFxuICAgICAgICBmdW5jdGlvbihldmVudCkgeyBzZWxmLmtleVVwKGV2ZW50KTsgfSwgdHJ1ZSk7XG59O1xuXG5JbnB1dC5wcm90b3R5cGUua2V5RG93biA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICAgIGNhc2Uga2V5cy5sZWZ0OiB0aGlzLmxlZnQgPSB0cnVlOyBicmVhaztcbiAgICAgICAgY2FzZSBrZXlzLnJpZ2h0OiB0aGlzLnJpZ2h0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgICAgIGNhc2Uga2V5cy51cDogdGhpcy51cCA9IHRydWU7IGJyZWFrO1xuICAgICAgICBjYXNlIGtleXMuZG93bjogdGhpcy5kb3duID0gdHJ1ZTsgYnJlYWs7XG4gICAgICAgIGNhc2Uga2V5cy5hOiB0aGlzLmZseVVwID0gdHJ1ZTsgYnJlYWs7XG4gICAgICAgIGNhc2Uga2V5cy56OiB0aGlzLmZseURvd24gPSB0cnVlOyBicmVhaztcbiAgICB9XG59O1xuXG5JbnB1dC5wcm90b3R5cGUua2V5VXAgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgICBjYXNlIGtleXMubGVmdDogdGhpcy5sZWZ0ID0gZmFsc2U7IGJyZWFrO1xuICAgICAgICBjYXNlIGtleXMucmlnaHQ6IHRoaXMucmlnaHQgPSBmYWxzZTsgYnJlYWs7XG4gICAgICAgIGNhc2Uga2V5cy51cDogdGhpcy51cCA9IGZhbHNlOyBicmVhaztcbiAgICAgICAgY2FzZSBrZXlzLmRvd246IHRoaXMuZG93biA9IGZhbHNlOyBicmVhaztcbiAgICAgICAgY2FzZSBrZXlzLmE6IHRoaXMuZmx5VXAgPSBmYWxzZTsgYnJlYWs7XG4gICAgICAgIGNhc2Uga2V5cy56OiB0aGlzLmZseURvd24gPSBmYWxzZTsgYnJlYWs7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gSW5wdXQ7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL2lucHV0LmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuXG5cbnZhciBEaWFsb2cgPSBmdW5jdGlvbihpZCkge1xuICAgIHRoaXMuaWQgPSBpZDtcbn07XG5cbkRpYWxvZy5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5pZCk7XG4gICAgZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuRGlhbG9nLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmlkKTtcbiAgICBlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuRGlhbG9nLnByb3RvdHlwZS5zZXRDYXB0aW9uID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnIycgKyB0aGlzLmlkICsgJyBwJylbMF07XG4gICAgY2FwdGlvbi5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyMnICsgdGhpcy5pZCArICcgYnV0dG9uJylbMF07XG4gICAgYnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5EaWFsb2cucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24odGV4dCkge1xuICAgIHZhciBjYXB0aW9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnIycgKyB0aGlzLmlkICsgJyBwJylbMF07XG4gICAgY2FwdGlvbi5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyMnICsgdGhpcy5pZCArICcgYnV0dG9uJylbMF07XG4gICAgYnV0dG9uLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lLWJsb2NrJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IERpYWxvZztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9pbnN0YWxsZXIvZGlhbG9nLmpzXCIsXCIvaW5zdGFsbGVyXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIERpYWxvZyA9IHJlcXVpcmUoJ2luc3RhbGxlci9kaWFsb2cnKTtcbnZhciB6aXAgPSByZXF1aXJlKCdsaWIvemlwLmpzJykuemlwO1xudmFyIExoNCA9IHJlcXVpcmUoJ2xpYi9saDQuanMnKTtcbnZhciBhc3NldHMgPSByZXF1aXJlKCdhc3NldHMnKTtcblxudmFyIEluc3RhbGxlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZGlhbG9nID0gbmV3IERpYWxvZygnZGlhbG9nJyk7XG4gICAgdGhpcy5pc0xvY2FsID0gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lLmluZGV4T2YoJ2xvY2FsaG9zdCcpICE9PSAtMTtcbn07XG5cbkluc3RhbGxlci5sb2NhbFVybCA9ICdkYXRhL3BhazAucGFrJzsgLy8nJ2RhdGEvcXVha2UxMDYuemlwJztcbkluc3RhbGxlci5jcm9zc09yaWdpblByb3h5VXJsID0gJ2h0dHA6Ly9jcm9zc29yaWdpbi5tZS8nO1xuSW5zdGFsbGVyLm1pcnJvcnMgPSBbIC8vIFRPRE86IEFkZCBtb3JlIHZhbGlkIHF1YWtlIHNoYXJld2FyZSBtaXJyb3JzLlxuICAgICdodHRwOi8vd3d3LmdhbWVycy5vcmcvcHViL2dhbWVzL3F1YWtlL2lkc3R1ZmYvcXVha2UvcXVha2UxMDYuemlwJ1xuXTtcblxuSW5zdGFsbGVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICB0aGlzLmRpYWxvZy5lcnJvcihtZXNzYWdlKTtcbn07XG5cbkluc3RhbGxlci5wcm90b3R5cGUuZG93bmxvYWQgPSBmdW5jdGlvbihkb25lKSB7XG4gICAgdGhpcy5kaWFsb2cuc2V0Q2FwdGlvbignRG93bmxvYWRpbmcgc2hhcmV3YXJlIHZlcnNpb24gb2YgUXVha2UgKHF1YWtlMTA2LnppcCkuLi4nKTtcbiAgICB2YXIgdXJsID0gdGhpcy5pc0xvY2FsID9cbiAgICAgICAgSW5zdGFsbGVyLmxvY2FsVXJsIDpcbiAgICAgICAgSW5zdGFsbGVyLmNyb3NzT3JpZ2luUHJveHlVcmwgKyBJbnN0YWxsZXIubWlycm9yc1swXTtcbiAgICB2YXIgdW5wYWNrZWQgPSB1cmwuaW5kZXhPZigncGFrJykgIT09IC0xO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgIHhoci5vdmVycmlkZU1pbWVUeXBlKCd0ZXh0L3BsYWluOyBjaGFyc2V0PXgtdXNlci1kZWZpbmVkJyk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdhcnJheWJ1ZmZlcic7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLmRpYWxvZy5zZXRDYXB0aW9uKCdEb3dubG9hZCBjb21wbGV0ZWQuIFByb2Nlc3NpbmcgZmlsZS4uLicsIHRoaXMucmVhZHlTdGF0ZSk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgIH07XG5cbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICBpZiAoIXVucGFja2VkKSB7XG4gICAgICAgICAgICAgICAgc2VsZi51bnBhY2sodGhpcy5yZXNwb25zZSwgZG9uZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZmluYWxpemUobmV3IFVpbnQ4QXJyYXkodGhpcy5yZXNwb25zZSksIGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5lcnJvcignRG93bmxvYWQgZmFpbGVkLiBUcnkgYWdhaW4uJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHhoci5zZW5kKCk7XG59O1xuXG5JbnN0YWxsZXIucHJvdG90eXBlLnVucGFjayA9IGZ1bmN0aW9uKHJlc3BvbnNlLCBkb25lKSB7XG4gICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbcmVzcG9uc2VdKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgemlwLndvcmtlclNjcmlwdHNQYXRoID0gJ2pzL2xpYi8nO1xuICAgIHppcC5jcmVhdGVSZWFkZXIobmV3IHppcC5CbG9iUmVhZGVyKGJsb2IpLCBmdW5jdGlvbihyZWFkZXIpIHtcbiAgICAgICAgcmVhZGVyLmdldEVudHJpZXMoZnVuY3Rpb24oZW50cmllcykge1xuICAgICAgICAgICAgaWYgKGVudHJpZXMubGVuZ3RoIDw9IDAgfHwgZW50cmllc1swXS5maWxlbmFtZSAhPT0gJ3Jlc291cmNlLjEnKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5kaWFsb2cuZXJyb3IoJ0Rvd25sb2FkZWQgYXJjaGl2ZSB3YXMgY29ycnVwdC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZW50cnkgPSBlbnRyaWVzWzBdO1xuICAgICAgICAgICAgdmFyIHdyaXRlciA9IG5ldyB6aXAuQXJyYXlXcml0ZXIoZW50cnkudW5jb21wcmVzc2VkU2l6ZSk7XG4gICAgICAgICAgICBzZWxmLmRpYWxvZy5zZXRDYXB0aW9uKCdFeHRyYWN0aW5nIHppcCByZXNvdXJjZXMuLi4nKTtcbiAgICAgICAgICAgIGVudHJ5LmdldERhdGEod3JpdGVyLCBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRpYWxvZy5zZXRDYXB0aW9uKCdFeHRyYWN0aW5nIGxoYSByZXNvdXJjZXMuLi4nKTtcbiAgICAgICAgICAgICAgICB2YXIgbGhhID0gbmV3IExoNC5MaGFSZWFkZXIobmV3IExoNC5MaGFBcnJheVJlYWRlcihidWZmZXIpKTtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGxoYS5leHRyYWN0KDMpO1xuICAgICAgICAgICAgICAgIHNlbGYuZmluYWxpemUoZGF0YSwgZG9uZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG5JbnN0YWxsZXIucHJvdG90eXBlLmZpbmFsaXplID0gZnVuY3Rpb24oZGF0YSwgZG9uZSkge1xuICAgIGFzc2V0cy5zZXRQYWsoZGF0YSk7XG4gICAgdGhpcy5kaWFsb2cuc2V0Q2FwdGlvbignU3RhcnRpbmcgdXAgUXVha2UuLi4nKTtcbiAgICB0aGlzLmRpYWxvZy5oaWRlKCk7XG4gICAgZG9uZSgpO1xufTtcblxuSW5zdGFsbGVyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKGRvbmUpIHtcbiAgICB0aGlzLmRpYWxvZy5zZXRDYXB0aW9uKFwiSW5pdGlhdGluZyBkb3dubG9hZC4uLlwiKTtcbiAgICB0aGlzLmRpYWxvZy5zaG93KCk7XG4gICAgdGhpcy5kb3dubG9hZChkb25lKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5ldyBJbnN0YWxsZXIoKTtcblxuXG5cblxuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvaW5zdGFsbGVyL2luc3RhbGxlci5qc1wiLFwiL2luc3RhbGxlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxuICogQGZpbGVvdmVydmlldyBnbC1tYXRyaXggLSBIaWdoIHBlcmZvcm1hbmNlIG1hdHJpeCBhbmQgdmVjdG9yIG9wZXJhdGlvbnNcbiAqIEBhdXRob3IgQnJhbmRvbiBKb25lc1xuICogQGF1dGhvciBDb2xpbiBNYWNLZW56aWUgSVZcbiAqIEB2ZXJzaW9uIDIuMi4xXG4gKi9cbi8qIENvcHlyaWdodCAoYykgMjAxMywgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuXG4gUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbiBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb25cbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG4gV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRVxuIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SXG4gQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4gKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuIExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTlxuIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcbiBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS4gKi9cbihmdW5jdGlvbihlKXtcInVzZSBzdHJpY3RcIjt2YXIgdD17fTt0eXBlb2YgZXhwb3J0cz09XCJ1bmRlZmluZWRcIj90eXBlb2YgZGVmaW5lPT1cImZ1bmN0aW9uXCImJnR5cGVvZiBkZWZpbmUuYW1kPT1cIm9iamVjdFwiJiZkZWZpbmUuYW1kPyh0LmV4cG9ydHM9e30sZGVmaW5lKGZ1bmN0aW9uKCl7cmV0dXJuIHQuZXhwb3J0c30pKTp0LmV4cG9ydHM9dHlwZW9mIHdpbmRvdyE9XCJ1bmRlZmluZWRcIj93aW5kb3c6ZTp0LmV4cG9ydHM9ZXhwb3J0cyxmdW5jdGlvbihlKXtpZighdCl2YXIgdD0xZS02O2lmKCFuKXZhciBuPXR5cGVvZiBGbG9hdDMyQXJyYXkhPVwidW5kZWZpbmVkXCI/RmxvYXQzMkFycmF5OkFycmF5O2lmKCFyKXZhciByPU1hdGgucmFuZG9tO3ZhciBpPXt9O2kuc2V0TWF0cml4QXJyYXlUeXBlPWZ1bmN0aW9uKGUpe249ZX0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLmdsTWF0cml4PWkpO3ZhciBzPU1hdGguUEkvMTgwO2kudG9SYWRpYW49ZnVuY3Rpb24oZSl7cmV0dXJuIGUqc307dmFyIG89e307by5jcmVhdGU9ZnVuY3Rpb24oKXt2YXIgZT1uZXcgbigyKTtyZXR1cm4gZVswXT0wLGVbMV09MCxlfSxvLmNsb25lPWZ1bmN0aW9uKGUpe3ZhciB0PW5ldyBuKDIpO3JldHVybiB0WzBdPWVbMF0sdFsxXT1lWzFdLHR9LG8uZnJvbVZhbHVlcz1mdW5jdGlvbihlLHQpe3ZhciByPW5ldyBuKDIpO3JldHVybiByWzBdPWUsclsxXT10LHJ9LG8uY29weT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGV9LG8uc2V0PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10LGVbMV09bixlfSxvLmFkZD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXStuWzBdLGVbMV09dFsxXStuWzFdLGV9LG8uc3VidHJhY3Q9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0tblswXSxlWzFdPXRbMV0tblsxXSxlfSxvLnN1Yj1vLnN1YnRyYWN0LG8ubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0qblswXSxlWzFdPXRbMV0qblsxXSxlfSxvLm11bD1vLm11bHRpcGx5LG8uZGl2aWRlPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdL25bMF0sZVsxXT10WzFdL25bMV0sZX0sby5kaXY9by5kaXZpZGUsby5taW49ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPU1hdGgubWluKHRbMF0sblswXSksZVsxXT1NYXRoLm1pbih0WzFdLG5bMV0pLGV9LG8ubWF4PWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT1NYXRoLm1heCh0WzBdLG5bMF0pLGVbMV09TWF0aC5tYXgodFsxXSxuWzFdKSxlfSxvLnNjYWxlPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdKm4sZVsxXT10WzFdKm4sZX0sby5zY2FsZUFuZEFkZD1mdW5jdGlvbihlLHQsbixyKXtyZXR1cm4gZVswXT10WzBdK25bMF0qcixlWzFdPXRbMV0rblsxXSpyLGV9LG8uZGlzdGFuY2U9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLWVbMF0scj10WzFdLWVbMV07cmV0dXJuIE1hdGguc3FydChuKm4rcipyKX0sby5kaXN0PW8uZGlzdGFuY2Usby5zcXVhcmVkRGlzdGFuY2U9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLWVbMF0scj10WzFdLWVbMV07cmV0dXJuIG4qbityKnJ9LG8uc3FyRGlzdD1vLnNxdWFyZWREaXN0YW5jZSxvLmxlbmd0aD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXTtyZXR1cm4gTWF0aC5zcXJ0KHQqdCtuKm4pfSxvLmxlbj1vLmxlbmd0aCxvLnNxdWFyZWRMZW5ndGg9ZnVuY3Rpb24oZSl7dmFyIHQ9ZVswXSxuPWVbMV07cmV0dXJuIHQqdCtuKm59LG8uc3FyTGVuPW8uc3F1YXJlZExlbmd0aCxvLm5lZ2F0ZT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPS10WzBdLGVbMV09LXRbMV0sZX0sby5ub3JtYWxpemU9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPW4qbityKnI7cmV0dXJuIGk+MCYmKGk9MS9NYXRoLnNxcnQoaSksZVswXT10WzBdKmksZVsxXT10WzFdKmkpLGV9LG8uZG90PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF0qdFswXStlWzFdKnRbMV19LG8uY3Jvc3M9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0qblsxXS10WzFdKm5bMF07cmV0dXJuIGVbMF09ZVsxXT0wLGVbMl09cixlfSxvLmxlcnA9ZnVuY3Rpb24oZSx0LG4scil7dmFyIGk9dFswXSxzPXRbMV07cmV0dXJuIGVbMF09aStyKihuWzBdLWkpLGVbMV09cytyKihuWzFdLXMpLGV9LG8ucmFuZG9tPWZ1bmN0aW9uKGUsdCl7dD10fHwxO3ZhciBuPXIoKSoyKk1hdGguUEk7cmV0dXJuIGVbMF09TWF0aC5jb3MobikqdCxlWzFdPU1hdGguc2luKG4pKnQsZX0sby50cmFuc2Zvcm1NYXQyPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXTtyZXR1cm4gZVswXT1uWzBdKnIrblsyXSppLGVbMV09blsxXSpyK25bM10qaSxlfSxvLnRyYW5zZm9ybU1hdDJkPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXTtyZXR1cm4gZVswXT1uWzBdKnIrblsyXSppK25bNF0sZVsxXT1uWzFdKnIrblszXSppK25bNV0sZX0sby50cmFuc2Zvcm1NYXQzPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXTtyZXR1cm4gZVswXT1uWzBdKnIrblszXSppK25bNl0sZVsxXT1uWzFdKnIrbls0XSppK25bN10sZX0sby50cmFuc2Zvcm1NYXQ0PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXTtyZXR1cm4gZVswXT1uWzBdKnIrbls0XSppK25bMTJdLGVbMV09blsxXSpyK25bNV0qaStuWzEzXSxlfSxvLmZvckVhY2g9ZnVuY3Rpb24oKXt2YXIgZT1vLmNyZWF0ZSgpO3JldHVybiBmdW5jdGlvbih0LG4scixpLHMsbyl7dmFyIHUsYTtufHwobj0yKSxyfHwocj0wKSxpP2E9TWF0aC5taW4oaSpuK3IsdC5sZW5ndGgpOmE9dC5sZW5ndGg7Zm9yKHU9cjt1PGE7dSs9billWzBdPXRbdV0sZVsxXT10W3UrMV0scyhlLGUsbyksdFt1XT1lWzBdLHRbdSsxXT1lWzFdO3JldHVybiB0fX0oKSxvLnN0cj1mdW5jdGlvbihlKXtyZXR1cm5cInZlYzIoXCIrZVswXStcIiwgXCIrZVsxXStcIilcIn0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLnZlYzI9byk7dmFyIHU9e307dS5jcmVhdGU9ZnVuY3Rpb24oKXt2YXIgZT1uZXcgbigzKTtyZXR1cm4gZVswXT0wLGVbMV09MCxlWzJdPTAsZX0sdS5jbG9uZT1mdW5jdGlvbihlKXt2YXIgdD1uZXcgbigzKTtyZXR1cm4gdFswXT1lWzBdLHRbMV09ZVsxXSx0WzJdPWVbMl0sdH0sdS5mcm9tVmFsdWVzPWZ1bmN0aW9uKGUsdCxyKXt2YXIgaT1uZXcgbigzKTtyZXR1cm4gaVswXT1lLGlbMV09dCxpWzJdPXIsaX0sdS5jb3B5PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF09dFswXSxlWzFdPXRbMV0sZVsyXT10WzJdLGV9LHUuc2V0PWZ1bmN0aW9uKGUsdCxuLHIpe3JldHVybiBlWzBdPXQsZVsxXT1uLGVbMl09cixlfSx1LmFkZD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXStuWzBdLGVbMV09dFsxXStuWzFdLGVbMl09dFsyXStuWzJdLGV9LHUuc3VidHJhY3Q9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0tblswXSxlWzFdPXRbMV0tblsxXSxlWzJdPXRbMl0tblsyXSxlfSx1LnN1Yj11LnN1YnRyYWN0LHUubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0qblswXSxlWzFdPXRbMV0qblsxXSxlWzJdPXRbMl0qblsyXSxlfSx1Lm11bD11Lm11bHRpcGx5LHUuZGl2aWRlPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdL25bMF0sZVsxXT10WzFdL25bMV0sZVsyXT10WzJdL25bMl0sZX0sdS5kaXY9dS5kaXZpZGUsdS5taW49ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPU1hdGgubWluKHRbMF0sblswXSksZVsxXT1NYXRoLm1pbih0WzFdLG5bMV0pLGVbMl09TWF0aC5taW4odFsyXSxuWzJdKSxlfSx1Lm1heD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09TWF0aC5tYXgodFswXSxuWzBdKSxlWzFdPU1hdGgubWF4KHRbMV0sblsxXSksZVsyXT1NYXRoLm1heCh0WzJdLG5bMl0pLGV9LHUuc2NhbGU9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0qbixlWzFdPXRbMV0qbixlWzJdPXRbMl0qbixlfSx1LnNjYWxlQW5kQWRkPWZ1bmN0aW9uKGUsdCxuLHIpe3JldHVybiBlWzBdPXRbMF0rblswXSpyLGVbMV09dFsxXStuWzFdKnIsZVsyXT10WzJdK25bMl0qcixlfSx1LmRpc3RhbmNlPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXS1lWzBdLHI9dFsxXS1lWzFdLGk9dFsyXS1lWzJdO3JldHVybiBNYXRoLnNxcnQobipuK3IqcitpKmkpfSx1LmRpc3Q9dS5kaXN0YW5jZSx1LnNxdWFyZWREaXN0YW5jZT1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0tZVswXSxyPXRbMV0tZVsxXSxpPXRbMl0tZVsyXTtyZXR1cm4gbipuK3IqcitpKml9LHUuc3FyRGlzdD11LnNxdWFyZWREaXN0YW5jZSx1Lmxlbmd0aD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXSxyPWVbMl07cmV0dXJuIE1hdGguc3FydCh0KnQrbipuK3Iqcil9LHUubGVuPXUubGVuZ3RoLHUuc3F1YXJlZExlbmd0aD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXSxyPWVbMl07cmV0dXJuIHQqdCtuKm4rcipyfSx1LnNxckxlbj11LnNxdWFyZWRMZW5ndGgsdS5uZWdhdGU9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT0tdFswXSxlWzFdPS10WzFdLGVbMl09LXRbMl0sZX0sdS5ub3JtYWxpemU9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz1uKm4rcipyK2kqaTtyZXR1cm4gcz4wJiYocz0xL01hdGguc3FydChzKSxlWzBdPXRbMF0qcyxlWzFdPXRbMV0qcyxlWzJdPXRbMl0qcyksZX0sdS5kb3Q9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXSp0WzBdK2VbMV0qdFsxXStlWzJdKnRbMl19LHUuY3Jvc3M9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPW5bMF0sdT1uWzFdLGE9blsyXTtyZXR1cm4gZVswXT1pKmEtcyp1LGVbMV09cypvLXIqYSxlWzJdPXIqdS1pKm8sZX0sdS5sZXJwPWZ1bmN0aW9uKGUsdCxuLHIpe3ZhciBpPXRbMF0scz10WzFdLG89dFsyXTtyZXR1cm4gZVswXT1pK3IqKG5bMF0taSksZVsxXT1zK3IqKG5bMV0tcyksZVsyXT1vK3IqKG5bMl0tbyksZX0sdS5yYW5kb209ZnVuY3Rpb24oZSx0KXt0PXR8fDE7dmFyIG49cigpKjIqTWF0aC5QSSxpPXIoKSoyLTEscz1NYXRoLnNxcnQoMS1pKmkpKnQ7cmV0dXJuIGVbMF09TWF0aC5jb3MobikqcyxlWzFdPU1hdGguc2luKG4pKnMsZVsyXT1pKnQsZX0sdS50cmFuc2Zvcm1NYXQ0PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl07cmV0dXJuIGVbMF09blswXSpyK25bNF0qaStuWzhdKnMrblsxMl0sZVsxXT1uWzFdKnIrbls1XSppK25bOV0qcytuWzEzXSxlWzJdPW5bMl0qcituWzZdKmkrblsxMF0qcytuWzE0XSxlfSx1LnRyYW5zZm9ybU1hdDM9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXTtyZXR1cm4gZVswXT1yKm5bMF0raSpuWzNdK3Mqbls2XSxlWzFdPXIqblsxXStpKm5bNF0rcypuWzddLGVbMl09cipuWzJdK2kqbls1XStzKm5bOF0sZX0sdS50cmFuc2Zvcm1RdWF0PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz1uWzBdLHU9blsxXSxhPW5bMl0sZj1uWzNdLGw9ZipyK3Uqcy1hKmksYz1mKmkrYSpyLW8qcyxoPWYqcytvKmktdSpyLHA9LW8qci11KmktYSpzO3JldHVybiBlWzBdPWwqZitwKi1vK2MqLWEtaCotdSxlWzFdPWMqZitwKi11K2gqLW8tbCotYSxlWzJdPWgqZitwKi1hK2wqLXUtYyotbyxlfSx1LnJvdGF0ZVg9ZnVuY3Rpb24oZSx0LG4scil7dmFyIGk9W10scz1bXTtyZXR1cm4gaVswXT10WzBdLW5bMF0saVsxXT10WzFdLW5bMV0saVsyXT10WzJdLW5bMl0sc1swXT1pWzBdLHNbMV09aVsxXSpNYXRoLmNvcyhyKS1pWzJdKk1hdGguc2luKHIpLHNbMl09aVsxXSpNYXRoLnNpbihyKStpWzJdKk1hdGguY29zKHIpLGVbMF09c1swXStuWzBdLGVbMV09c1sxXStuWzFdLGVbMl09c1syXStuWzJdLGV9LHUucm90YXRlWT1mdW5jdGlvbihlLHQsbixyKXt2YXIgaT1bXSxzPVtdO3JldHVybiBpWzBdPXRbMF0tblswXSxpWzFdPXRbMV0tblsxXSxpWzJdPXRbMl0tblsyXSxzWzBdPWlbMl0qTWF0aC5zaW4ocikraVswXSpNYXRoLmNvcyhyKSxzWzFdPWlbMV0sc1syXT1pWzJdKk1hdGguY29zKHIpLWlbMF0qTWF0aC5zaW4ociksZVswXT1zWzBdK25bMF0sZVsxXT1zWzFdK25bMV0sZVsyXT1zWzJdK25bMl0sZX0sdS5yb3RhdGVaPWZ1bmN0aW9uKGUsdCxuLHIpe3ZhciBpPVtdLHM9W107cmV0dXJuIGlbMF09dFswXS1uWzBdLGlbMV09dFsxXS1uWzFdLGlbMl09dFsyXS1uWzJdLHNbMF09aVswXSpNYXRoLmNvcyhyKS1pWzFdKk1hdGguc2luKHIpLHNbMV09aVswXSpNYXRoLnNpbihyKStpWzFdKk1hdGguY29zKHIpLHNbMl09aVsyXSxlWzBdPXNbMF0rblswXSxlWzFdPXNbMV0rblsxXSxlWzJdPXNbMl0rblsyXSxlfSx1LmZvckVhY2g9ZnVuY3Rpb24oKXt2YXIgZT11LmNyZWF0ZSgpO3JldHVybiBmdW5jdGlvbih0LG4scixpLHMsbyl7dmFyIHUsYTtufHwobj0zKSxyfHwocj0wKSxpP2E9TWF0aC5taW4oaSpuK3IsdC5sZW5ndGgpOmE9dC5sZW5ndGg7Zm9yKHU9cjt1PGE7dSs9billWzBdPXRbdV0sZVsxXT10W3UrMV0sZVsyXT10W3UrMl0scyhlLGUsbyksdFt1XT1lWzBdLHRbdSsxXT1lWzFdLHRbdSsyXT1lWzJdO3JldHVybiB0fX0oKSx1LnN0cj1mdW5jdGlvbihlKXtyZXR1cm5cInZlYzMoXCIrZVswXStcIiwgXCIrZVsxXStcIiwgXCIrZVsyXStcIilcIn0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLnZlYzM9dSk7dmFyIGE9e307YS5jcmVhdGU9ZnVuY3Rpb24oKXt2YXIgZT1uZXcgbig0KTtyZXR1cm4gZVswXT0wLGVbMV09MCxlWzJdPTAsZVszXT0wLGV9LGEuY2xvbmU9ZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IG4oNCk7cmV0dXJuIHRbMF09ZVswXSx0WzFdPWVbMV0sdFsyXT1lWzJdLHRbM109ZVszXSx0fSxhLmZyb21WYWx1ZXM9ZnVuY3Rpb24oZSx0LHIsaSl7dmFyIHM9bmV3IG4oNCk7cmV0dXJuIHNbMF09ZSxzWzFdPXQsc1syXT1yLHNbM109aSxzfSxhLmNvcHk9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlWzJdPXRbMl0sZVszXT10WzNdLGV9LGEuc2V0PWZ1bmN0aW9uKGUsdCxuLHIsaSl7cmV0dXJuIGVbMF09dCxlWzFdPW4sZVsyXT1yLGVbM109aSxlfSxhLmFkZD1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXStuWzBdLGVbMV09dFsxXStuWzFdLGVbMl09dFsyXStuWzJdLGVbM109dFszXStuWzNdLGV9LGEuc3VidHJhY3Q9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0tblswXSxlWzFdPXRbMV0tblsxXSxlWzJdPXRbMl0tblsyXSxlWzNdPXRbM10tblszXSxlfSxhLnN1Yj1hLnN1YnRyYWN0LGEubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPXRbMF0qblswXSxlWzFdPXRbMV0qblsxXSxlWzJdPXRbMl0qblsyXSxlWzNdPXRbM10qblszXSxlfSxhLm11bD1hLm11bHRpcGx5LGEuZGl2aWRlPWZ1bmN0aW9uKGUsdCxuKXtyZXR1cm4gZVswXT10WzBdL25bMF0sZVsxXT10WzFdL25bMV0sZVsyXT10WzJdL25bMl0sZVszXT10WzNdL25bM10sZX0sYS5kaXY9YS5kaXZpZGUsYS5taW49ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPU1hdGgubWluKHRbMF0sblswXSksZVsxXT1NYXRoLm1pbih0WzFdLG5bMV0pLGVbMl09TWF0aC5taW4odFsyXSxuWzJdKSxlWzNdPU1hdGgubWluKHRbM10sblszXSksZX0sYS5tYXg9ZnVuY3Rpb24oZSx0LG4pe3JldHVybiBlWzBdPU1hdGgubWF4KHRbMF0sblswXSksZVsxXT1NYXRoLm1heCh0WzFdLG5bMV0pLGVbMl09TWF0aC5tYXgodFsyXSxuWzJdKSxlWzNdPU1hdGgubWF4KHRbM10sblszXSksZX0sYS5zY2FsZT1mdW5jdGlvbihlLHQsbil7cmV0dXJuIGVbMF09dFswXSpuLGVbMV09dFsxXSpuLGVbMl09dFsyXSpuLGVbM109dFszXSpuLGV9LGEuc2NhbGVBbmRBZGQ9ZnVuY3Rpb24oZSx0LG4scil7cmV0dXJuIGVbMF09dFswXStuWzBdKnIsZVsxXT10WzFdK25bMV0qcixlWzJdPXRbMl0rblsyXSpyLGVbM109dFszXStuWzNdKnIsZX0sYS5kaXN0YW5jZT1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0tZVswXSxyPXRbMV0tZVsxXSxpPXRbMl0tZVsyXSxzPXRbM10tZVszXTtyZXR1cm4gTWF0aC5zcXJ0KG4qbityKnIraSppK3Mqcyl9LGEuZGlzdD1hLmRpc3RhbmNlLGEuc3F1YXJlZERpc3RhbmNlPWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXS1lWzBdLHI9dFsxXS1lWzFdLGk9dFsyXS1lWzJdLHM9dFszXS1lWzNdO3JldHVybiBuKm4rcipyK2kqaStzKnN9LGEuc3FyRGlzdD1hLnNxdWFyZWREaXN0YW5jZSxhLmxlbmd0aD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXSxyPWVbMl0saT1lWzNdO3JldHVybiBNYXRoLnNxcnQodCp0K24qbityKnIraSppKX0sYS5sZW49YS5sZW5ndGgsYS5zcXVhcmVkTGVuZ3RoPWZ1bmN0aW9uKGUpe3ZhciB0PWVbMF0sbj1lWzFdLHI9ZVsyXSxpPWVbM107cmV0dXJuIHQqdCtuKm4rcipyK2kqaX0sYS5zcXJMZW49YS5zcXVhcmVkTGVuZ3RoLGEubmVnYXRlPWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF09LXRbMF0sZVsxXT0tdFsxXSxlWzJdPS10WzJdLGVbM109LXRbM10sZX0sYS5ub3JtYWxpemU9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89bipuK3IqcitpKmkrcypzO3JldHVybiBvPjAmJihvPTEvTWF0aC5zcXJ0KG8pLGVbMF09dFswXSpvLGVbMV09dFsxXSpvLGVbMl09dFsyXSpvLGVbM109dFszXSpvKSxlfSxhLmRvdD1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdKnRbMF0rZVsxXSp0WzFdK2VbMl0qdFsyXStlWzNdKnRbM119LGEubGVycD1mdW5jdGlvbihlLHQsbixyKXt2YXIgaT10WzBdLHM9dFsxXSxvPXRbMl0sdT10WzNdO3JldHVybiBlWzBdPWkrciooblswXS1pKSxlWzFdPXMrciooblsxXS1zKSxlWzJdPW8rciooblsyXS1vKSxlWzNdPXUrciooblszXS11KSxlfSxhLnJhbmRvbT1mdW5jdGlvbihlLHQpe3JldHVybiB0PXR8fDEsZVswXT1yKCksZVsxXT1yKCksZVsyXT1yKCksZVszXT1yKCksYS5ub3JtYWxpemUoZSxlKSxhLnNjYWxlKGUsZSx0KSxlfSxhLnRyYW5zZm9ybU1hdDQ9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM107cmV0dXJuIGVbMF09blswXSpyK25bNF0qaStuWzhdKnMrblsxMl0qbyxlWzFdPW5bMV0qcituWzVdKmkrbls5XSpzK25bMTNdKm8sZVsyXT1uWzJdKnIrbls2XSppK25bMTBdKnMrblsxNF0qbyxlWzNdPW5bM10qcituWzddKmkrblsxMV0qcytuWzE1XSpvLGV9LGEudHJhbnNmb3JtUXVhdD1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89blswXSx1PW5bMV0sYT1uWzJdLGY9blszXSxsPWYqcit1KnMtYSppLGM9ZippK2Eqci1vKnMsaD1mKnMrbyppLXUqcixwPS1vKnItdSppLWEqcztyZXR1cm4gZVswXT1sKmYrcCotbytjKi1hLWgqLXUsZVsxXT1jKmYrcCotdStoKi1vLWwqLWEsZVsyXT1oKmYrcCotYStsKi11LWMqLW8sZX0sYS5mb3JFYWNoPWZ1bmN0aW9uKCl7dmFyIGU9YS5jcmVhdGUoKTtyZXR1cm4gZnVuY3Rpb24odCxuLHIsaSxzLG8pe3ZhciB1LGE7bnx8KG49NCkscnx8KHI9MCksaT9hPU1hdGgubWluKGkqbityLHQubGVuZ3RoKTphPXQubGVuZ3RoO2Zvcih1PXI7dTxhO3UrPW4pZVswXT10W3VdLGVbMV09dFt1KzFdLGVbMl09dFt1KzJdLGVbM109dFt1KzNdLHMoZSxlLG8pLHRbdV09ZVswXSx0W3UrMV09ZVsxXSx0W3UrMl09ZVsyXSx0W3UrM109ZVszXTtyZXR1cm4gdH19KCksYS5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJ2ZWM0KFwiK2VbMF0rXCIsIFwiK2VbMV0rXCIsIFwiK2VbMl0rXCIsIFwiK2VbM10rXCIpXCJ9LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS52ZWM0PWEpO3ZhciBmPXt9O2YuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oNCk7cmV0dXJuIGVbMF09MSxlWzFdPTAsZVsyXT0wLGVbM109MSxlfSxmLmNsb25lPWZ1bmN0aW9uKGUpe3ZhciB0PW5ldyBuKDQpO3JldHVybiB0WzBdPWVbMF0sdFsxXT1lWzFdLHRbMl09ZVsyXSx0WzNdPWVbM10sdH0sZi5jb3B5PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIGVbMF09dFswXSxlWzFdPXRbMV0sZVsyXT10WzJdLGVbM109dFszXSxlfSxmLmlkZW50aXR5PWZ1bmN0aW9uKGUpe3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTEsZX0sZi50cmFuc3Bvc2U9ZnVuY3Rpb24oZSx0KXtpZihlPT09dCl7dmFyIG49dFsxXTtlWzFdPXRbMl0sZVsyXT1ufWVsc2UgZVswXT10WzBdLGVbMV09dFsyXSxlWzJdPXRbMV0sZVszXT10WzNdO3JldHVybiBlfSxmLmludmVydD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz1uKnMtaSpyO3JldHVybiBvPyhvPTEvbyxlWzBdPXMqbyxlWzFdPS1yKm8sZVsyXT0taSpvLGVbM109bipvLGUpOm51bGx9LGYuYWRqb2ludD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF07cmV0dXJuIGVbMF09dFszXSxlWzFdPS10WzFdLGVbMl09LXRbMl0sZVszXT1uLGV9LGYuZGV0ZXJtaW5hbnQ9ZnVuY3Rpb24oZSl7cmV0dXJuIGVbMF0qZVszXS1lWzJdKmVbMV19LGYubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT1uWzBdLGE9blsxXSxmPW5bMl0sbD1uWzNdO3JldHVybiBlWzBdPXIqdStzKmEsZVsxXT1pKnUrbyphLGVbMl09cipmK3MqbCxlWzNdPWkqZitvKmwsZX0sZi5tdWw9Zi5tdWx0aXBseSxmLnJvdGF0ZT1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PU1hdGguc2luKG4pLGE9TWF0aC5jb3Mobik7cmV0dXJuIGVbMF09ciphK3MqdSxlWzFdPWkqYStvKnUsZVsyXT1yKi11K3MqYSxlWzNdPWkqLXUrbyphLGV9LGYuc2NhbGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT1uWzBdLGE9blsxXTtyZXR1cm4gZVswXT1yKnUsZVsxXT1pKnUsZVsyXT1zKmEsZVszXT1vKmEsZX0sZi5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJtYXQyKFwiK2VbMF0rXCIsIFwiK2VbMV0rXCIsIFwiK2VbMl0rXCIsIFwiK2VbM10rXCIpXCJ9LGYuZnJvYj1mdW5jdGlvbihlKXtyZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGVbMF0sMikrTWF0aC5wb3coZVsxXSwyKStNYXRoLnBvdyhlWzJdLDIpK01hdGgucG93KGVbM10sMikpfSxmLkxEVT1mdW5jdGlvbihlLHQsbixyKXtyZXR1cm4gZVsyXT1yWzJdL3JbMF0sblswXT1yWzBdLG5bMV09clsxXSxuWzNdPXJbM10tZVsyXSpuWzFdLFtlLHQsbl19LHR5cGVvZiBlIT1cInVuZGVmaW5lZFwiJiYoZS5tYXQyPWYpO3ZhciBsPXt9O2wuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oNik7cmV0dXJuIGVbMF09MSxlWzFdPTAsZVsyXT0wLGVbM109MSxlWzRdPTAsZVs1XT0wLGV9LGwuY2xvbmU9ZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IG4oNik7cmV0dXJuIHRbMF09ZVswXSx0WzFdPWVbMV0sdFsyXT1lWzJdLHRbM109ZVszXSx0WzRdPWVbNF0sdFs1XT1lWzVdLHR9LGwuY29weT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09dFsyXSxlWzNdPXRbM10sZVs0XT10WzRdLGVbNV09dFs1XSxlfSxsLmlkZW50aXR5PWZ1bmN0aW9uKGUpe3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTEsZVs0XT0wLGVbNV09MCxlfSxsLmludmVydD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz10WzRdLHU9dFs1XSxhPW4qcy1yKmk7cmV0dXJuIGE/KGE9MS9hLGVbMF09cyphLGVbMV09LXIqYSxlWzJdPS1pKmEsZVszXT1uKmEsZVs0XT0oaSp1LXMqbykqYSxlWzVdPShyKm8tbip1KSphLGUpOm51bGx9LGwuZGV0ZXJtaW5hbnQ9ZnVuY3Rpb24oZSl7cmV0dXJuIGVbMF0qZVszXS1lWzFdKmVbMl19LGwubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT10WzRdLGE9dFs1XSxmPW5bMF0sbD1uWzFdLGM9blsyXSxoPW5bM10scD1uWzRdLGQ9bls1XTtyZXR1cm4gZVswXT1yKmYrcypsLGVbMV09aSpmK28qbCxlWzJdPXIqYytzKmgsZVszXT1pKmMrbypoLGVbNF09cipwK3MqZCt1LGVbNV09aSpwK28qZCthLGV9LGwubXVsPWwubXVsdGlwbHksbC5yb3RhdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT10WzRdLGE9dFs1XSxmPU1hdGguc2luKG4pLGw9TWF0aC5jb3Mobik7cmV0dXJuIGVbMF09cipsK3MqZixlWzFdPWkqbCtvKmYsZVsyXT1yKi1mK3MqbCxlWzNdPWkqLWYrbypsLGVbNF09dSxlWzVdPWEsZX0sbC5zY2FsZT1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PXRbNF0sYT10WzVdLGY9blswXSxsPW5bMV07cmV0dXJuIGVbMF09cipmLGVbMV09aSpmLGVbMl09cypsLGVbM109bypsLGVbNF09dSxlWzVdPWEsZX0sbC50cmFuc2xhdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT10WzRdLGE9dFs1XSxmPW5bMF0sbD1uWzFdO3JldHVybiBlWzBdPXIsZVsxXT1pLGVbMl09cyxlWzNdPW8sZVs0XT1yKmYrcypsK3UsZVs1XT1pKmYrbypsK2EsZX0sbC5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJtYXQyZChcIitlWzBdK1wiLCBcIitlWzFdK1wiLCBcIitlWzJdK1wiLCBcIitlWzNdK1wiLCBcIitlWzRdK1wiLCBcIitlWzVdK1wiKVwifSxsLmZyb2I9ZnVuY3Rpb24oZSl7cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhlWzBdLDIpK01hdGgucG93KGVbMV0sMikrTWF0aC5wb3coZVsyXSwyKStNYXRoLnBvdyhlWzNdLDIpK01hdGgucG93KGVbNF0sMikrTWF0aC5wb3coZVs1XSwyKSsxKX0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLm1hdDJkPWwpO3ZhciBjPXt9O2MuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG4oOSk7cmV0dXJuIGVbMF09MSxlWzFdPTAsZVsyXT0wLGVbM109MCxlWzRdPTEsZVs1XT0wLGVbNl09MCxlWzddPTAsZVs4XT0xLGV9LGMuZnJvbU1hdDQ9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZVswXT10WzBdLGVbMV09dFsxXSxlWzJdPXRbMl0sZVszXT10WzRdLGVbNF09dFs1XSxlWzVdPXRbNl0sZVs2XT10WzhdLGVbN109dFs5XSxlWzhdPXRbMTBdLGV9LGMuY2xvbmU9ZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IG4oOSk7cmV0dXJuIHRbMF09ZVswXSx0WzFdPWVbMV0sdFsyXT1lWzJdLHRbM109ZVszXSx0WzRdPWVbNF0sdFs1XT1lWzVdLHRbNl09ZVs2XSx0WzddPWVbN10sdFs4XT1lWzhdLHR9LGMuY29weT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09dFsyXSxlWzNdPXRbM10sZVs0XT10WzRdLGVbNV09dFs1XSxlWzZdPXRbNl0sZVs3XT10WzddLGVbOF09dFs4XSxlfSxjLmlkZW50aXR5PWZ1bmN0aW9uKGUpe3JldHVybiBlWzBdPTEsZVsxXT0wLGVbMl09MCxlWzNdPTAsZVs0XT0xLGVbNV09MCxlWzZdPTAsZVs3XT0wLGVbOF09MSxlfSxjLnRyYW5zcG9zZT1mdW5jdGlvbihlLHQpe2lmKGU9PT10KXt2YXIgbj10WzFdLHI9dFsyXSxpPXRbNV07ZVsxXT10WzNdLGVbMl09dFs2XSxlWzNdPW4sZVs1XT10WzddLGVbNl09cixlWzddPWl9ZWxzZSBlWzBdPXRbMF0sZVsxXT10WzNdLGVbMl09dFs2XSxlWzNdPXRbMV0sZVs0XT10WzRdLGVbNV09dFs3XSxlWzZdPXRbMl0sZVs3XT10WzVdLGVbOF09dFs4XTtyZXR1cm4gZX0sYy5pbnZlcnQ9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz10WzNdLG89dFs0XSx1PXRbNV0sYT10WzZdLGY9dFs3XSxsPXRbOF0sYz1sKm8tdSpmLGg9LWwqcyt1KmEscD1mKnMtbyphLGQ9bipjK3IqaCtpKnA7cmV0dXJuIGQ/KGQ9MS9kLGVbMF09YypkLGVbMV09KC1sKnIraSpmKSpkLGVbMl09KHUqci1pKm8pKmQsZVszXT1oKmQsZVs0XT0obCpuLWkqYSkqZCxlWzVdPSgtdSpuK2kqcykqZCxlWzZdPXAqZCxlWzddPSgtZipuK3IqYSkqZCxlWzhdPShvKm4tcipzKSpkLGUpOm51bGx9LGMuYWRqb2ludD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz10WzRdLHU9dFs1XSxhPXRbNl0sZj10WzddLGw9dFs4XTtyZXR1cm4gZVswXT1vKmwtdSpmLGVbMV09aSpmLXIqbCxlWzJdPXIqdS1pKm8sZVszXT11KmEtcypsLGVbNF09bipsLWkqYSxlWzVdPWkqcy1uKnUsZVs2XT1zKmYtbyphLGVbN109ciphLW4qZixlWzhdPW4qby1yKnMsZX0sYy5kZXRlcm1pbmFudD1mdW5jdGlvbihlKXt2YXIgdD1lWzBdLG49ZVsxXSxyPWVbMl0saT1lWzNdLHM9ZVs0XSxvPWVbNV0sdT1lWzZdLGE9ZVs3XSxmPWVbOF07cmV0dXJuIHQqKGYqcy1vKmEpK24qKC1mKmkrbyp1KStyKihhKmktcyp1KX0sYy5tdWx0aXBseT1mdW5jdGlvbihlLHQsbil7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PXRbNF0sYT10WzVdLGY9dFs2XSxsPXRbN10sYz10WzhdLGg9blswXSxwPW5bMV0sZD1uWzJdLHY9blszXSxtPW5bNF0sZz1uWzVdLHk9bls2XSxiPW5bN10sdz1uWzhdO3JldHVybiBlWzBdPWgqcitwKm8rZCpmLGVbMV09aCppK3AqdStkKmwsZVsyXT1oKnMrcCphK2QqYyxlWzNdPXYqcittKm8rZypmLGVbNF09dippK20qdStnKmwsZVs1XT12KnMrbSphK2cqYyxlWzZdPXkqcitiKm8rdypmLGVbN109eSppK2IqdSt3KmwsZVs4XT15KnMrYiphK3cqYyxlfSxjLm11bD1jLm11bHRpcGx5LGMudHJhbnNsYXRlPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9dFs0XSxhPXRbNV0sZj10WzZdLGw9dFs3XSxjPXRbOF0saD1uWzBdLHA9blsxXTtyZXR1cm4gZVswXT1yLGVbMV09aSxlWzJdPXMsZVszXT1vLGVbNF09dSxlWzVdPWEsZVs2XT1oKnIrcCpvK2YsZVs3XT1oKmkrcCp1K2wsZVs4XT1oKnMrcCphK2MsZX0sYy5yb3RhdGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT10WzRdLGE9dFs1XSxmPXRbNl0sbD10WzddLGM9dFs4XSxoPU1hdGguc2luKG4pLHA9TWF0aC5jb3Mobik7cmV0dXJuIGVbMF09cCpyK2gqbyxlWzFdPXAqaStoKnUsZVsyXT1wKnMraCphLGVbM109cCpvLWgqcixlWzRdPXAqdS1oKmksZVs1XT1wKmEtaCpzLGVbNl09ZixlWzddPWwsZVs4XT1jLGV9LGMuc2NhbGU9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPW5bMF0saT1uWzFdO3JldHVybiBlWzBdPXIqdFswXSxlWzFdPXIqdFsxXSxlWzJdPXIqdFsyXSxlWzNdPWkqdFszXSxlWzRdPWkqdFs0XSxlWzVdPWkqdFs1XSxlWzZdPXRbNl0sZVs3XT10WzddLGVbOF09dFs4XSxlfSxjLmZyb21NYXQyZD1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09MCxlWzNdPXRbMl0sZVs0XT10WzNdLGVbNV09MCxlWzZdPXRbNF0sZVs3XT10WzVdLGVbOF09MSxlfSxjLmZyb21RdWF0PWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdLHM9dFszXSxvPW4rbix1PXIrcixhPWkraSxmPW4qbyxsPXIqbyxjPXIqdSxoPWkqbyxwPWkqdSxkPWkqYSx2PXMqbyxtPXMqdSxnPXMqYTtyZXR1cm4gZVswXT0xLWMtZCxlWzNdPWwtZyxlWzZdPWgrbSxlWzFdPWwrZyxlWzRdPTEtZi1kLGVbN109cC12LGVbMl09aC1tLGVbNV09cCt2LGVbOF09MS1mLWMsZX0sYy5ub3JtYWxGcm9tTWF0ND1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz10WzRdLHU9dFs1XSxhPXRbNl0sZj10WzddLGw9dFs4XSxjPXRbOV0saD10WzEwXSxwPXRbMTFdLGQ9dFsxMl0sdj10WzEzXSxtPXRbMTRdLGc9dFsxNV0seT1uKnUtcipvLGI9biphLWkqbyx3PW4qZi1zKm8sRT1yKmEtaSp1LFM9cipmLXMqdSx4PWkqZi1zKmEsVD1sKnYtYypkLE49bCptLWgqZCxDPWwqZy1wKmQsaz1jKm0taCp2LEw9YypnLXAqdixBPWgqZy1wKm0sTz15KkEtYipMK3cqaytFKkMtUypOK3gqVDtyZXR1cm4gTz8oTz0xL08sZVswXT0odSpBLWEqTCtmKmspKk8sZVsxXT0oYSpDLW8qQS1mKk4pKk8sZVsyXT0obypMLXUqQytmKlQpKk8sZVszXT0oaSpMLXIqQS1zKmspKk8sZVs0XT0obipBLWkqQytzKk4pKk8sZVs1XT0ocipDLW4qTC1zKlQpKk8sZVs2XT0odip4LW0qUytnKkUpKk8sZVs3XT0obSp3LWQqeC1nKmIpKk8sZVs4XT0oZCpTLXYqdytnKnkpKk8sZSk6bnVsbH0sYy5zdHI9ZnVuY3Rpb24oZSl7cmV0dXJuXCJtYXQzKFwiK2VbMF0rXCIsIFwiK2VbMV0rXCIsIFwiK2VbMl0rXCIsIFwiK2VbM10rXCIsIFwiK2VbNF0rXCIsIFwiK2VbNV0rXCIsIFwiK2VbNl0rXCIsIFwiK2VbN10rXCIsIFwiK2VbOF0rXCIpXCJ9LGMuZnJvYj1mdW5jdGlvbihlKXtyZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGVbMF0sMikrTWF0aC5wb3coZVsxXSwyKStNYXRoLnBvdyhlWzJdLDIpK01hdGgucG93KGVbM10sMikrTWF0aC5wb3coZVs0XSwyKStNYXRoLnBvdyhlWzVdLDIpK01hdGgucG93KGVbNl0sMikrTWF0aC5wb3coZVs3XSwyKStNYXRoLnBvdyhlWzhdLDIpKX0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLm1hdDM9Yyk7dmFyIGg9e307aC5jcmVhdGU9ZnVuY3Rpb24oKXt2YXIgZT1uZXcgbigxNik7cmV0dXJuIGVbMF09MSxlWzFdPTAsZVsyXT0wLGVbM109MCxlWzRdPTAsZVs1XT0xLGVbNl09MCxlWzddPTAsZVs4XT0wLGVbOV09MCxlWzEwXT0xLGVbMTFdPTAsZVsxMl09MCxlWzEzXT0wLGVbMTRdPTAsZVsxNV09MSxlfSxoLmNsb25lPWZ1bmN0aW9uKGUpe3ZhciB0PW5ldyBuKDE2KTtyZXR1cm4gdFswXT1lWzBdLHRbMV09ZVsxXSx0WzJdPWVbMl0sdFszXT1lWzNdLHRbNF09ZVs0XSx0WzVdPWVbNV0sdFs2XT1lWzZdLHRbN109ZVs3XSx0WzhdPWVbOF0sdFs5XT1lWzldLHRbMTBdPWVbMTBdLHRbMTFdPWVbMTFdLHRbMTJdPWVbMTJdLHRbMTNdPWVbMTNdLHRbMTRdPWVbMTRdLHRbMTVdPWVbMTVdLHR9LGguY29weT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPXRbMF0sZVsxXT10WzFdLGVbMl09dFsyXSxlWzNdPXRbM10sZVs0XT10WzRdLGVbNV09dFs1XSxlWzZdPXRbNl0sZVs3XT10WzddLGVbOF09dFs4XSxlWzldPXRbOV0sZVsxMF09dFsxMF0sZVsxMV09dFsxMV0sZVsxMl09dFsxMl0sZVsxM109dFsxM10sZVsxNF09dFsxNF0sZVsxNV09dFsxNV0sZX0saC5pZGVudGl0eT1mdW5jdGlvbihlKXtyZXR1cm4gZVswXT0xLGVbMV09MCxlWzJdPTAsZVszXT0wLGVbNF09MCxlWzVdPTEsZVs2XT0wLGVbN109MCxlWzhdPTAsZVs5XT0wLGVbMTBdPTEsZVsxMV09MCxlWzEyXT0wLGVbMTNdPTAsZVsxNF09MCxlWzE1XT0xLGV9LGgudHJhbnNwb3NlPWZ1bmN0aW9uKGUsdCl7aWYoZT09PXQpe3ZhciBuPXRbMV0scj10WzJdLGk9dFszXSxzPXRbNl0sbz10WzddLHU9dFsxMV07ZVsxXT10WzRdLGVbMl09dFs4XSxlWzNdPXRbMTJdLGVbNF09bixlWzZdPXRbOV0sZVs3XT10WzEzXSxlWzhdPXIsZVs5XT1zLGVbMTFdPXRbMTRdLGVbMTJdPWksZVsxM109byxlWzE0XT11fWVsc2UgZVswXT10WzBdLGVbMV09dFs0XSxlWzJdPXRbOF0sZVszXT10WzEyXSxlWzRdPXRbMV0sZVs1XT10WzVdLGVbNl09dFs5XSxlWzddPXRbMTNdLGVbOF09dFsyXSxlWzldPXRbNl0sZVsxMF09dFsxMF0sZVsxMV09dFsxNF0sZVsxMl09dFszXSxlWzEzXT10WzddLGVbMTRdPXRbMTFdLGVbMTVdPXRbMTVdO3JldHVybiBlfSxoLmludmVydD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz10WzRdLHU9dFs1XSxhPXRbNl0sZj10WzddLGw9dFs4XSxjPXRbOV0saD10WzEwXSxwPXRbMTFdLGQ9dFsxMl0sdj10WzEzXSxtPXRbMTRdLGc9dFsxNV0seT1uKnUtcipvLGI9biphLWkqbyx3PW4qZi1zKm8sRT1yKmEtaSp1LFM9cipmLXMqdSx4PWkqZi1zKmEsVD1sKnYtYypkLE49bCptLWgqZCxDPWwqZy1wKmQsaz1jKm0taCp2LEw9YypnLXAqdixBPWgqZy1wKm0sTz15KkEtYipMK3cqaytFKkMtUypOK3gqVDtyZXR1cm4gTz8oTz0xL08sZVswXT0odSpBLWEqTCtmKmspKk8sZVsxXT0oaSpMLXIqQS1zKmspKk8sZVsyXT0odip4LW0qUytnKkUpKk8sZVszXT0oaCpTLWMqeC1wKkUpKk8sZVs0XT0oYSpDLW8qQS1mKk4pKk8sZVs1XT0obipBLWkqQytzKk4pKk8sZVs2XT0obSp3LWQqeC1nKmIpKk8sZVs3XT0obCp4LWgqdytwKmIpKk8sZVs4XT0obypMLXUqQytmKlQpKk8sZVs5XT0ocipDLW4qTC1zKlQpKk8sZVsxMF09KGQqUy12KncrZyp5KSpPLGVbMTFdPShjKnctbCpTLXAqeSkqTyxlWzEyXT0odSpOLW8qay1hKlQpKk8sZVsxM109KG4qay1yKk4raSpUKSpPLGVbMTRdPSh2KmItZCpFLW0qeSkqTyxlWzE1XT0obCpFLWMqYitoKnkpKk8sZSk6bnVsbH0saC5hZGpvaW50PWZ1bmN0aW9uKGUsdCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdLHM9dFszXSxvPXRbNF0sdT10WzVdLGE9dFs2XSxmPXRbN10sbD10WzhdLGM9dFs5XSxoPXRbMTBdLHA9dFsxMV0sZD10WzEyXSx2PXRbMTNdLG09dFsxNF0sZz10WzE1XTtyZXR1cm4gZVswXT11KihoKmctcCptKS1jKihhKmctZiptKSt2KihhKnAtZipoKSxlWzFdPS0ociooaCpnLXAqbSktYyooaSpnLXMqbSkrdiooaSpwLXMqaCkpLGVbMl09ciooYSpnLWYqbSktdSooaSpnLXMqbSkrdiooaSpmLXMqYSksZVszXT0tKHIqKGEqcC1mKmgpLXUqKGkqcC1zKmgpK2MqKGkqZi1zKmEpKSxlWzRdPS0obyooaCpnLXAqbSktbCooYSpnLWYqbSkrZCooYSpwLWYqaCkpLGVbNV09biooaCpnLXAqbSktbCooaSpnLXMqbSkrZCooaSpwLXMqaCksZVs2XT0tKG4qKGEqZy1mKm0pLW8qKGkqZy1zKm0pK2QqKGkqZi1zKmEpKSxlWzddPW4qKGEqcC1mKmgpLW8qKGkqcC1zKmgpK2wqKGkqZi1zKmEpLGVbOF09byooYypnLXAqdiktbCoodSpnLWYqdikrZCoodSpwLWYqYyksZVs5XT0tKG4qKGMqZy1wKnYpLWwqKHIqZy1zKnYpK2QqKHIqcC1zKmMpKSxlWzEwXT1uKih1KmctZip2KS1vKihyKmctcyp2KStkKihyKmYtcyp1KSxlWzExXT0tKG4qKHUqcC1mKmMpLW8qKHIqcC1zKmMpK2wqKHIqZi1zKnUpKSxlWzEyXT0tKG8qKGMqbS1oKnYpLWwqKHUqbS1hKnYpK2QqKHUqaC1hKmMpKSxlWzEzXT1uKihjKm0taCp2KS1sKihyKm0taSp2KStkKihyKmgtaSpjKSxlWzE0XT0tKG4qKHUqbS1hKnYpLW8qKHIqbS1pKnYpK2QqKHIqYS1pKnUpKSxlWzE1XT1uKih1KmgtYSpjKS1vKihyKmgtaSpjKStsKihyKmEtaSp1KSxlfSxoLmRldGVybWluYW50PWZ1bmN0aW9uKGUpe3ZhciB0PWVbMF0sbj1lWzFdLHI9ZVsyXSxpPWVbM10scz1lWzRdLG89ZVs1XSx1PWVbNl0sYT1lWzddLGY9ZVs4XSxsPWVbOV0sYz1lWzEwXSxoPWVbMTFdLHA9ZVsxMl0sZD1lWzEzXSx2PWVbMTRdLG09ZVsxNV0sZz10Km8tbipzLHk9dCp1LXIqcyxiPXQqYS1pKnMsdz1uKnUtcipvLEU9biphLWkqbyxTPXIqYS1pKnUseD1mKmQtbCpwLFQ9Zip2LWMqcCxOPWYqbS1oKnAsQz1sKnYtYypkLGs9bCptLWgqZCxMPWMqbS1oKnY7cmV0dXJuIGcqTC15KmsrYipDK3cqTi1FKlQrUyp4fSxoLm11bHRpcGx5PWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9dFs0XSxhPXRbNV0sZj10WzZdLGw9dFs3XSxjPXRbOF0saD10WzldLHA9dFsxMF0sZD10WzExXSx2PXRbMTJdLG09dFsxM10sZz10WzE0XSx5PXRbMTVdLGI9blswXSx3PW5bMV0sRT1uWzJdLFM9blszXTtyZXR1cm4gZVswXT1iKnIrdyp1K0UqYytTKnYsZVsxXT1iKmkrdyphK0UqaCtTKm0sZVsyXT1iKnMrdypmK0UqcCtTKmcsZVszXT1iKm8rdypsK0UqZCtTKnksYj1uWzRdLHc9bls1XSxFPW5bNl0sUz1uWzddLGVbNF09YipyK3cqdStFKmMrUyp2LGVbNV09YippK3cqYStFKmgrUyptLGVbNl09YipzK3cqZitFKnArUypnLGVbN109YipvK3cqbCtFKmQrUyp5LGI9bls4XSx3PW5bOV0sRT1uWzEwXSxTPW5bMTFdLGVbOF09YipyK3cqdStFKmMrUyp2LGVbOV09YippK3cqYStFKmgrUyptLGVbMTBdPWIqcyt3KmYrRSpwK1MqZyxlWzExXT1iKm8rdypsK0UqZCtTKnksYj1uWzEyXSx3PW5bMTNdLEU9blsxNF0sUz1uWzE1XSxlWzEyXT1iKnIrdyp1K0UqYytTKnYsZVsxM109YippK3cqYStFKmgrUyptLGVbMTRdPWIqcyt3KmYrRSpwK1MqZyxlWzE1XT1iKm8rdypsK0UqZCtTKnksZX0saC5tdWw9aC5tdWx0aXBseSxoLnRyYW5zbGF0ZT1mdW5jdGlvbihlLHQsbil7dmFyIHI9blswXSxpPW5bMV0scz1uWzJdLG8sdSxhLGYsbCxjLGgscCxkLHYsbSxnO3JldHVybiB0PT09ZT8oZVsxMl09dFswXSpyK3RbNF0qaSt0WzhdKnMrdFsxMl0sZVsxM109dFsxXSpyK3RbNV0qaSt0WzldKnMrdFsxM10sZVsxNF09dFsyXSpyK3RbNl0qaSt0WzEwXSpzK3RbMTRdLGVbMTVdPXRbM10qcit0WzddKmkrdFsxMV0qcyt0WzE1XSk6KG89dFswXSx1PXRbMV0sYT10WzJdLGY9dFszXSxsPXRbNF0sYz10WzVdLGg9dFs2XSxwPXRbN10sZD10WzhdLHY9dFs5XSxtPXRbMTBdLGc9dFsxMV0sZVswXT1vLGVbMV09dSxlWzJdPWEsZVszXT1mLGVbNF09bCxlWzVdPWMsZVs2XT1oLGVbN109cCxlWzhdPWQsZVs5XT12LGVbMTBdPW0sZVsxMV09ZyxlWzEyXT1vKnIrbCppK2Qqcyt0WzEyXSxlWzEzXT11KnIrYyppK3Yqcyt0WzEzXSxlWzE0XT1hKnIraCppK20qcyt0WzE0XSxlWzE1XT1mKnIrcCppK2cqcyt0WzE1XSksZX0saC5zY2FsZT1mdW5jdGlvbihlLHQsbil7dmFyIHI9blswXSxpPW5bMV0scz1uWzJdO3JldHVybiBlWzBdPXRbMF0qcixlWzFdPXRbMV0qcixlWzJdPXRbMl0qcixlWzNdPXRbM10qcixlWzRdPXRbNF0qaSxlWzVdPXRbNV0qaSxlWzZdPXRbNl0qaSxlWzddPXRbN10qaSxlWzhdPXRbOF0qcyxlWzldPXRbOV0qcyxlWzEwXT10WzEwXSpzLGVbMTFdPXRbMTFdKnMsZVsxMl09dFsxMl0sZVsxM109dFsxM10sZVsxNF09dFsxNF0sZVsxNV09dFsxNV0sZX0saC5yb3RhdGU9ZnVuY3Rpb24oZSxuLHIsaSl7dmFyIHM9aVswXSxvPWlbMV0sdT1pWzJdLGE9TWF0aC5zcXJ0KHMqcytvKm8rdSp1KSxmLGwsYyxoLHAsZCx2LG0sZyx5LGIsdyxFLFMseCxULE4sQyxrLEwsQSxPLE0sXztyZXR1cm4gTWF0aC5hYnMoYSk8dD9udWxsOihhPTEvYSxzKj1hLG8qPWEsdSo9YSxmPU1hdGguc2luKHIpLGw9TWF0aC5jb3MociksYz0xLWwsaD1uWzBdLHA9blsxXSxkPW5bMl0sdj1uWzNdLG09bls0XSxnPW5bNV0seT1uWzZdLGI9bls3XSx3PW5bOF0sRT1uWzldLFM9blsxMF0seD1uWzExXSxUPXMqcypjK2wsTj1vKnMqYyt1KmYsQz11KnMqYy1vKmYsaz1zKm8qYy11KmYsTD1vKm8qYytsLEE9dSpvKmMrcypmLE89cyp1KmMrbypmLE09byp1KmMtcypmLF89dSp1KmMrbCxlWzBdPWgqVCttKk4rdypDLGVbMV09cCpUK2cqTitFKkMsZVsyXT1kKlQreSpOK1MqQyxlWzNdPXYqVCtiKk4reCpDLGVbNF09aCprK20qTCt3KkEsZVs1XT1wKmsrZypMK0UqQSxlWzZdPWQqayt5KkwrUypBLGVbN109diprK2IqTCt4KkEsZVs4XT1oKk8rbSpNK3cqXyxlWzldPXAqTytnKk0rRSpfLGVbMTBdPWQqTyt5Kk0rUypfLGVbMTFdPXYqTytiKk0reCpfLG4hPT1lJiYoZVsxMl09blsxMl0sZVsxM109blsxM10sZVsxNF09blsxNF0sZVsxNV09blsxNV0pLGUpfSxoLnJvdGF0ZVg9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPU1hdGguc2luKG4pLGk9TWF0aC5jb3Mobikscz10WzRdLG89dFs1XSx1PXRbNl0sYT10WzddLGY9dFs4XSxsPXRbOV0sYz10WzEwXSxoPXRbMTFdO3JldHVybiB0IT09ZSYmKGVbMF09dFswXSxlWzFdPXRbMV0sZVsyXT10WzJdLGVbM109dFszXSxlWzEyXT10WzEyXSxlWzEzXT10WzEzXSxlWzE0XT10WzE0XSxlWzE1XT10WzE1XSksZVs0XT1zKmkrZipyLGVbNV09byppK2wqcixlWzZdPXUqaStjKnIsZVs3XT1hKmkraCpyLGVbOF09ZippLXMqcixlWzldPWwqaS1vKnIsZVsxMF09YyppLXUqcixlWzExXT1oKmktYSpyLGV9LGgucm90YXRlWT1mdW5jdGlvbihlLHQsbil7dmFyIHI9TWF0aC5zaW4obiksaT1NYXRoLmNvcyhuKSxzPXRbMF0sbz10WzFdLHU9dFsyXSxhPXRbM10sZj10WzhdLGw9dFs5XSxjPXRbMTBdLGg9dFsxMV07cmV0dXJuIHQhPT1lJiYoZVs0XT10WzRdLGVbNV09dFs1XSxlWzZdPXRbNl0sZVs3XT10WzddLGVbMTJdPXRbMTJdLGVbMTNdPXRbMTNdLGVbMTRdPXRbMTRdLGVbMTVdPXRbMTVdKSxlWzBdPXMqaS1mKnIsZVsxXT1vKmktbCpyLGVbMl09dSppLWMqcixlWzNdPWEqaS1oKnIsZVs4XT1zKnIrZippLGVbOV09bypyK2wqaSxlWzEwXT11KnIrYyppLGVbMTFdPWEqcitoKmksZX0saC5yb3RhdGVaPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj1NYXRoLnNpbihuKSxpPU1hdGguY29zKG4pLHM9dFswXSxvPXRbMV0sdT10WzJdLGE9dFszXSxmPXRbNF0sbD10WzVdLGM9dFs2XSxoPXRbN107cmV0dXJuIHQhPT1lJiYoZVs4XT10WzhdLGVbOV09dFs5XSxlWzEwXT10WzEwXSxlWzExXT10WzExXSxlWzEyXT10WzEyXSxlWzEzXT10WzEzXSxlWzE0XT10WzE0XSxlWzE1XT10WzE1XSksZVswXT1zKmkrZipyLGVbMV09byppK2wqcixlWzJdPXUqaStjKnIsZVszXT1hKmkraCpyLGVbNF09ZippLXMqcixlWzVdPWwqaS1vKnIsZVs2XT1jKmktdSpyLGVbN109aCppLWEqcixlfSxoLmZyb21Sb3RhdGlvblRyYW5zbGF0aW9uPWZ1bmN0aW9uKGUsdCxuKXt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9cityLGE9aStpLGY9cytzLGw9cip1LGM9ciphLGg9cipmLHA9aSphLGQ9aSpmLHY9cypmLG09byp1LGc9byphLHk9bypmO3JldHVybiBlWzBdPTEtKHArdiksZVsxXT1jK3ksZVsyXT1oLWcsZVszXT0wLGVbNF09Yy15LGVbNV09MS0obCt2KSxlWzZdPWQrbSxlWzddPTAsZVs4XT1oK2csZVs5XT1kLW0sZVsxMF09MS0obCtwKSxlWzExXT0wLGVbMTJdPW5bMF0sZVsxM109blsxXSxlWzE0XT1uWzJdLGVbMTVdPTEsZX0saC5mcm9tUXVhdD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz1uK24sdT1yK3IsYT1pK2ksZj1uKm8sbD1yKm8sYz1yKnUsaD1pKm8scD1pKnUsZD1pKmEsdj1zKm8sbT1zKnUsZz1zKmE7cmV0dXJuIGVbMF09MS1jLWQsZVsxXT1sK2csZVsyXT1oLW0sZVszXT0wLGVbNF09bC1nLGVbNV09MS1mLWQsZVs2XT1wK3YsZVs3XT0wLGVbOF09aCttLGVbOV09cC12LGVbMTBdPTEtZi1jLGVbMTFdPTAsZVsxMl09MCxlWzEzXT0wLGVbMTRdPTAsZVsxNV09MSxlfSxoLmZydXN0dW09ZnVuY3Rpb24oZSx0LG4scixpLHMsbyl7dmFyIHU9MS8obi10KSxhPTEvKGktciksZj0xLyhzLW8pO3JldHVybiBlWzBdPXMqMip1LGVbMV09MCxlWzJdPTAsZVszXT0wLGVbNF09MCxlWzVdPXMqMiphLGVbNl09MCxlWzddPTAsZVs4XT0obit0KSp1LGVbOV09KGkrcikqYSxlWzEwXT0obytzKSpmLGVbMTFdPS0xLGVbMTJdPTAsZVsxM109MCxlWzE0XT1vKnMqMipmLGVbMTVdPTAsZX0saC5wZXJzcGVjdGl2ZT1mdW5jdGlvbihlLHQsbixyLGkpe3ZhciBzPTEvTWF0aC50YW4odC8yKSxvPTEvKHItaSk7cmV0dXJuIGVbMF09cy9uLGVbMV09MCxlWzJdPTAsZVszXT0wLGVbNF09MCxlWzVdPXMsZVs2XT0wLGVbN109MCxlWzhdPTAsZVs5XT0wLGVbMTBdPShpK3IpKm8sZVsxMV09LTEsZVsxMl09MCxlWzEzXT0wLGVbMTRdPTIqaSpyKm8sZVsxNV09MCxlfSxoLm9ydGhvPWZ1bmN0aW9uKGUsdCxuLHIsaSxzLG8pe3ZhciB1PTEvKHQtbiksYT0xLyhyLWkpLGY9MS8ocy1vKTtyZXR1cm4gZVswXT0tMip1LGVbMV09MCxlWzJdPTAsZVszXT0wLGVbNF09MCxlWzVdPS0yKmEsZVs2XT0wLGVbN109MCxlWzhdPTAsZVs5XT0wLGVbMTBdPTIqZixlWzExXT0wLGVbMTJdPSh0K24pKnUsZVsxM109KGkrcikqYSxlWzE0XT0obytzKSpmLGVbMTVdPTEsZX0saC5sb29rQXQ9ZnVuY3Rpb24oZSxuLHIsaSl7dmFyIHMsbyx1LGEsZixsLGMscCxkLHYsbT1uWzBdLGc9blsxXSx5PW5bMl0sYj1pWzBdLHc9aVsxXSxFPWlbMl0sUz1yWzBdLHg9clsxXSxUPXJbMl07cmV0dXJuIE1hdGguYWJzKG0tUyk8dCYmTWF0aC5hYnMoZy14KTx0JiZNYXRoLmFicyh5LVQpPHQ/aC5pZGVudGl0eShlKTooYz1tLVMscD1nLXgsZD15LVQsdj0xL01hdGguc3FydChjKmMrcCpwK2QqZCksYyo9dixwKj12LGQqPXYscz13KmQtRSpwLG89RSpjLWIqZCx1PWIqcC13KmMsdj1NYXRoLnNxcnQocypzK28qbyt1KnUpLHY/KHY9MS92LHMqPXYsbyo9dix1Kj12KToocz0wLG89MCx1PTApLGE9cCp1LWQqbyxmPWQqcy1jKnUsbD1jKm8tcCpzLHY9TWF0aC5zcXJ0KGEqYStmKmYrbCpsKSx2Pyh2PTEvdixhKj12LGYqPXYsbCo9dik6KGE9MCxmPTAsbD0wKSxlWzBdPXMsZVsxXT1hLGVbMl09YyxlWzNdPTAsZVs0XT1vLGVbNV09ZixlWzZdPXAsZVs3XT0wLGVbOF09dSxlWzldPWwsZVsxMF09ZCxlWzExXT0wLGVbMTJdPS0ocyptK28qZyt1KnkpLGVbMTNdPS0oYSptK2YqZytsKnkpLGVbMTRdPS0oYyptK3AqZytkKnkpLGVbMTVdPTEsZSl9LGguc3RyPWZ1bmN0aW9uKGUpe3JldHVyblwibWF0NChcIitlWzBdK1wiLCBcIitlWzFdK1wiLCBcIitlWzJdK1wiLCBcIitlWzNdK1wiLCBcIitlWzRdK1wiLCBcIitlWzVdK1wiLCBcIitlWzZdK1wiLCBcIitlWzddK1wiLCBcIitlWzhdK1wiLCBcIitlWzldK1wiLCBcIitlWzEwXStcIiwgXCIrZVsxMV0rXCIsIFwiK2VbMTJdK1wiLCBcIitlWzEzXStcIiwgXCIrZVsxNF0rXCIsIFwiK2VbMTVdK1wiKVwifSxoLmZyb2I9ZnVuY3Rpb24oZSl7cmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyhlWzBdLDIpK01hdGgucG93KGVbMV0sMikrTWF0aC5wb3coZVsyXSwyKStNYXRoLnBvdyhlWzNdLDIpK01hdGgucG93KGVbNF0sMikrTWF0aC5wb3coZVs1XSwyKStNYXRoLnBvdyhlWzZdLDIpK01hdGgucG93KGVbNl0sMikrTWF0aC5wb3coZVs3XSwyKStNYXRoLnBvdyhlWzhdLDIpK01hdGgucG93KGVbOV0sMikrTWF0aC5wb3coZVsxMF0sMikrTWF0aC5wb3coZVsxMV0sMikrTWF0aC5wb3coZVsxMl0sMikrTWF0aC5wb3coZVsxM10sMikrTWF0aC5wb3coZVsxNF0sMikrTWF0aC5wb3coZVsxNV0sMikpfSx0eXBlb2YgZSE9XCJ1bmRlZmluZWRcIiYmKGUubWF0ND1oKTt2YXIgcD17fTtwLmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBlPW5ldyBuKDQpO3JldHVybiBlWzBdPTAsZVsxXT0wLGVbMl09MCxlWzNdPTEsZX0scC5yb3RhdGlvblRvPWZ1bmN0aW9uKCl7dmFyIGU9dS5jcmVhdGUoKSx0PXUuZnJvbVZhbHVlcygxLDAsMCksbj11LmZyb21WYWx1ZXMoMCwxLDApO3JldHVybiBmdW5jdGlvbihyLGkscyl7dmFyIG89dS5kb3QoaSxzKTtyZXR1cm4gbzwtMC45OTk5OTk/KHUuY3Jvc3MoZSx0LGkpLHUubGVuZ3RoKGUpPDFlLTYmJnUuY3Jvc3MoZSxuLGkpLHUubm9ybWFsaXplKGUsZSkscC5zZXRBeGlzQW5nbGUocixlLE1hdGguUEkpLHIpOm8+Ljk5OTk5OT8oclswXT0wLHJbMV09MCxyWzJdPTAsclszXT0xLHIpOih1LmNyb3NzKGUsaSxzKSxyWzBdPWVbMF0sclsxXT1lWzFdLHJbMl09ZVsyXSxyWzNdPTErbyxwLm5vcm1hbGl6ZShyLHIpKX19KCkscC5zZXRBeGVzPWZ1bmN0aW9uKCl7dmFyIGU9Yy5jcmVhdGUoKTtyZXR1cm4gZnVuY3Rpb24odCxuLHIsaSl7cmV0dXJuIGVbMF09clswXSxlWzNdPXJbMV0sZVs2XT1yWzJdLGVbMV09aVswXSxlWzRdPWlbMV0sZVs3XT1pWzJdLGVbMl09LW5bMF0sZVs1XT0tblsxXSxlWzhdPS1uWzJdLHAubm9ybWFsaXplKHQscC5mcm9tTWF0Myh0LGUpKX19KCkscC5jbG9uZT1hLmNsb25lLHAuZnJvbVZhbHVlcz1hLmZyb21WYWx1ZXMscC5jb3B5PWEuY29weSxwLnNldD1hLnNldCxwLmlkZW50aXR5PWZ1bmN0aW9uKGUpe3JldHVybiBlWzBdPTAsZVsxXT0wLGVbMl09MCxlWzNdPTEsZX0scC5zZXRBeGlzQW5nbGU9ZnVuY3Rpb24oZSx0LG4pe24qPS41O3ZhciByPU1hdGguc2luKG4pO3JldHVybiBlWzBdPXIqdFswXSxlWzFdPXIqdFsxXSxlWzJdPXIqdFsyXSxlWzNdPU1hdGguY29zKG4pLGV9LHAuYWRkPWEuYWRkLHAubXVsdGlwbHk9ZnVuY3Rpb24oZSx0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT1uWzBdLGE9blsxXSxmPW5bMl0sbD1uWzNdO3JldHVybiBlWzBdPXIqbCtvKnUraSpmLXMqYSxlWzFdPWkqbCtvKmErcyp1LXIqZixlWzJdPXMqbCtvKmYrciphLWkqdSxlWzNdPW8qbC1yKnUtaSphLXMqZixlfSxwLm11bD1wLm11bHRpcGx5LHAuc2NhbGU9YS5zY2FsZSxwLnJvdGF0ZVg9ZnVuY3Rpb24oZSx0LG4pe24qPS41O3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPXRbM10sdT1NYXRoLnNpbihuKSxhPU1hdGguY29zKG4pO3JldHVybiBlWzBdPXIqYStvKnUsZVsxXT1pKmErcyp1LGVbMl09cyphLWkqdSxlWzNdPW8qYS1yKnUsZX0scC5yb3RhdGVZPWZ1bmN0aW9uKGUsdCxuKXtuKj0uNTt2YXIgcj10WzBdLGk9dFsxXSxzPXRbMl0sbz10WzNdLHU9TWF0aC5zaW4obiksYT1NYXRoLmNvcyhuKTtyZXR1cm4gZVswXT1yKmEtcyp1LGVbMV09aSphK28qdSxlWzJdPXMqYStyKnUsZVszXT1vKmEtaSp1LGV9LHAucm90YXRlWj1mdW5jdGlvbihlLHQsbil7bio9LjU7dmFyIHI9dFswXSxpPXRbMV0scz10WzJdLG89dFszXSx1PU1hdGguc2luKG4pLGE9TWF0aC5jb3Mobik7cmV0dXJuIGVbMF09ciphK2kqdSxlWzFdPWkqYS1yKnUsZVsyXT1zKmErbyp1LGVbM109byphLXMqdSxlfSxwLmNhbGN1bGF0ZVc9ZnVuY3Rpb24oZSx0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl07cmV0dXJuIGVbMF09bixlWzFdPXIsZVsyXT1pLGVbM109LU1hdGguc3FydChNYXRoLmFicygxLW4qbi1yKnItaSppKSksZX0scC5kb3Q9YS5kb3QscC5sZXJwPWEubGVycCxwLnNsZXJwPWZ1bmN0aW9uKGUsdCxuLHIpe3ZhciBpPXRbMF0scz10WzFdLG89dFsyXSx1PXRbM10sYT1uWzBdLGY9blsxXSxsPW5bMl0sYz1uWzNdLGgscCxkLHYsbTtyZXR1cm4gcD1pKmErcypmK28qbCt1KmMscDwwJiYocD0tcCxhPS1hLGY9LWYsbD0tbCxjPS1jKSwxLXA+MWUtNj8oaD1NYXRoLmFjb3MocCksZD1NYXRoLnNpbihoKSx2PU1hdGguc2luKCgxLXIpKmgpL2QsbT1NYXRoLnNpbihyKmgpL2QpOih2PTEtcixtPXIpLGVbMF09dippK20qYSxlWzFdPXYqcyttKmYsZVsyXT12Km8rbSpsLGVbM109dip1K20qYyxlfSxwLmludmVydD1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPXRbM10sbz1uKm4rcipyK2kqaStzKnMsdT1vPzEvbzowO3JldHVybiBlWzBdPS1uKnUsZVsxXT0tcip1LGVbMl09LWkqdSxlWzNdPXMqdSxlfSxwLmNvbmp1Z2F0ZT1mdW5jdGlvbihlLHQpe3JldHVybiBlWzBdPS10WzBdLGVbMV09LXRbMV0sZVsyXT0tdFsyXSxlWzNdPXRbM10sZX0scC5sZW5ndGg9YS5sZW5ndGgscC5sZW49cC5sZW5ndGgscC5zcXVhcmVkTGVuZ3RoPWEuc3F1YXJlZExlbmd0aCxwLnNxckxlbj1wLnNxdWFyZWRMZW5ndGgscC5ub3JtYWxpemU9YS5ub3JtYWxpemUscC5mcm9tTWF0Mz1mdW5jdGlvbihlLHQpe3ZhciBuPXRbMF0rdFs0XSt0WzhdLHI7aWYobj4wKXI9TWF0aC5zcXJ0KG4rMSksZVszXT0uNSpyLHI9LjUvcixlWzBdPSh0WzddLXRbNV0pKnIsZVsxXT0odFsyXS10WzZdKSpyLGVbMl09KHRbM10tdFsxXSkqcjtlbHNle3ZhciBpPTA7dFs0XT50WzBdJiYoaT0xKSx0WzhdPnRbaSozK2ldJiYoaT0yKTt2YXIgcz0oaSsxKSUzLG89KGkrMiklMztyPU1hdGguc3FydCh0W2kqMytpXS10W3MqMytzXS10W28qMytvXSsxKSxlW2ldPS41KnIscj0uNS9yLGVbM109KHRbbyozK3NdLXRbcyozK29dKSpyLGVbc109KHRbcyozK2ldK3RbaSozK3NdKSpyLGVbb109KHRbbyozK2ldK3RbaSozK29dKSpyfXJldHVybiBlfSxwLnN0cj1mdW5jdGlvbihlKXtyZXR1cm5cInF1YXQoXCIrZVswXStcIiwgXCIrZVsxXStcIiwgXCIrZVsyXStcIiwgXCIrZVszXStcIilcIn0sdHlwZW9mIGUhPVwidW5kZWZpbmVkXCImJihlLnF1YXQ9cCl9KHQuZXhwb3J0cyl9KSh0aGlzKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvbGliL2dsLW1hdHJpeC1taW4uanNcIixcIi9saWJcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vLyBMSDQsIExIQSAoLWxoNC0pIGV4dHJhY3Rvciwgbm8gY3JjL3N1bS1jaGVja3MuIFdpbGwgZXh0cmFjdCBTRlgtYXJjaGl2ZXMgYXMgd2VsbC5cclxuLy8gRXJsYW5kIFJhbnZpbmdlIChlcmxhbmQucmFudmluZ2VAZ21haWwuY29tKVxyXG4vLyBCYXNlZCBvbiBhIG1peCBvZiBOb2J1eWFzdSBTdWVoaXJvJ3MgSmF2YSBpbXBsZW1lbnRhdGlvbiBhbmQgU2ltb24gSG93YXJkJ3MgQyB2ZXJzaW9uLlxyXG5cclxudmFyIExoYUFycmF5UmVhZGVyID0gZnVuY3Rpb24oYnVmZmVyKSB7XHJcbiAgICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcclxuICAgIHRoaXMub2Zmc2V0ID0gMDtcclxuICAgIHRoaXMuc3ViT2Zmc2V0ID0gNztcclxufTtcclxuTGhhQXJyYXlSZWFkZXIuU2Vla0Fic29sdXRlID0gMDtcclxuTGhhQXJyYXlSZWFkZXIuU2Vla1JlbGF0aXZlID0gMTtcclxuXHJcbkxoYUFycmF5UmVhZGVyLnByb3RvdHlwZS5yZWFkQml0cyA9IGZ1bmN0aW9uKGJpdHMpIHtcclxuICAgIHZhciBiaXRNYXNrcyA9IFsxLCAyLCA0LCA4LCAxNiwgMzIsIDY0LCAxMjhdO1xyXG4gICAgdmFyIGJ5dGUgPSB0aGlzLmJ1ZmZlclt0aGlzLm9mZnNldF07XHJcbiAgICB2YXIgcmVzdWx0ID0gMDtcclxuXHJcbiAgICBmb3IgKHZhciBiaXRJbmRleCA9IDA7IGJpdEluZGV4IDwgYml0czsgYml0SW5kZXgrKykge1xyXG4gICAgICAgIHZhciBiaXQgPSAoYnl0ZSAmIGJpdE1hc2tzW3RoaXMuc3ViT2Zmc2V0XSkgPj4gdGhpcy5zdWJPZmZzZXQ7XHJcbiAgICAgICAgcmVzdWx0IDw8PSAxO1xyXG4gICAgICAgIHJlc3VsdCA9IHJlc3VsdCB8IGJpdDtcclxuICAgICAgICB0aGlzLnN1Yk9mZnNldC0tO1xyXG4gICAgICAgIGlmICh0aGlzLnN1Yk9mZnNldCA8IDApIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMub2Zmc2V0ICsgMSA+PSB0aGlzLmJ1ZmZlci5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcblxyXG4gICAgICAgICAgICBieXRlID0gdGhpcy5idWZmZXJbKyt0aGlzLm9mZnNldF07XHJcbiAgICAgICAgICAgIHRoaXMuc3ViT2Zmc2V0ID0gNztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuTGhhQXJyYXlSZWFkZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHRoaXMub2Zmc2V0ICsgMSA+PSB0aGlzLmJ1ZmZlci5sZW5ndGgpXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyW3RoaXMub2Zmc2V0KytdO1xyXG59O1xyXG5MaGFBcnJheVJlYWRlci5wcm90b3R5cGUucmVhZFVJbnQxNiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHRoaXMub2Zmc2V0ICsgMiA+PSB0aGlzLmJ1ZmZlci5sZW5ndGgpXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgdmFyIHZhbHVlID1cclxuICAgICAgICAodGhpcy5idWZmZXJbdGhpcy5vZmZzZXRdICYgMHhGRikgfFxyXG4gICAgICAgICgodGhpcy5idWZmZXJbdGhpcy5vZmZzZXQrMV0gPDwgOCkgJiAweEZGMDApO1xyXG4gICAgdGhpcy5vZmZzZXQgKz0gMjtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufTtcclxuTGhhQXJyYXlSZWFkZXIucHJvdG90eXBlLnJlYWRVSW50MzIgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmICh0aGlzLm9mZnNldCArIDQgPj0gdGhpcy5idWZmZXIubGVuZ3RoKVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIHZhciB2YWx1ZSA9XHJcbiAgICAgICAgKHRoaXMuYnVmZmVyW3RoaXMub2Zmc2V0XSAmIDB4RkYpIHxcclxuICAgICAgICAoKHRoaXMuYnVmZmVyW3RoaXMub2Zmc2V0KzFdIDw8IDgpICYgMHhGRjAwKSB8XHJcbiAgICAgICAgKCh0aGlzLmJ1ZmZlclt0aGlzLm9mZnNldCsyXSA8PCAxNikgJiAweEZGMDAwMCkgfFxyXG4gICAgICAgICgodGhpcy5idWZmZXJbdGhpcy5vZmZzZXQrM10gPDwgMjQpICYgMHhGRjAwMDAwMCk7XHJcbiAgICB0aGlzLm9mZnNldCArPSA0O1xyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG5MaGFBcnJheVJlYWRlci5wcm90b3R5cGUucmVhZFN0cmluZyA9IGZ1bmN0aW9uKHNpemUpIHtcclxuICAgIGlmICh0aGlzLm9mZnNldCArIHNpemUgPj0gdGhpcy5idWZmZXIubGVuZ3RoKVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuICAgIHZhciByZXN1bHQgPSAnJztcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKVxyXG4gICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMuYnVmZmVyW3RoaXMub2Zmc2V0KytdKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5MaGFBcnJheVJlYWRlci5wcm90b3R5cGUucmVhZExlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGxlbmd0aCA9IHRoaXMucmVhZEJpdHMoMyk7XHJcbiAgICBpZiAobGVuZ3RoID09IC0xKVxyXG4gICAgICAgIHJldHVybiAtMTtcclxuXHJcbiAgICBpZiAobGVuZ3RoID09IDcpIHtcclxuICAgICAgICB3aGlsZSAodGhpcy5yZWFkQml0cygxKSAhPSAwKSB7XHJcbiAgICAgICAgICAgIGxlbmd0aCsrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBsZW5ndGg7XHJcbn07XHJcbkxoYUFycmF5UmVhZGVyLnByb3RvdHlwZS5zZWVrID0gZnVuY3Rpb24ob2Zmc2V0LCBtb2RlKSB7XHJcbiAgICBzd2l0Y2ggKG1vZGUpIHtcclxuICAgICAgICBjYXNlIExoYUFycmF5UmVhZGVyLlNlZWtBYnNvbHV0ZTpcclxuICAgICAgICAgICAgdGhpcy5vZmZzZXQgPSBvZmZzZXQ7XHJcbiAgICAgICAgICAgIHRoaXMuc3ViT2Zmc2V0ID0gNztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBMaGFBcnJheVJlYWRlci5TZWVrUmVsYXRpdmU6XHJcbiAgICAgICAgICAgIHRoaXMub2Zmc2V0ICs9IG9mZnNldDtcclxuICAgICAgICAgICAgdGhpcy5zdWJPZmZzZXQgPSA3O1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxufTtcclxuTGhhQXJyYXlSZWFkZXIucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5vZmZzZXQ7XHJcbn07XHJcblxyXG52YXIgTGhhQXJyYXlXcml0ZXIgPSBmdW5jdGlvbihzaXplKSB7XHJcbiAgICB0aGlzLm9mZnNldCA9IDA7XHJcbiAgICB0aGlzLnNpemUgPSBzaXplO1xyXG4gICAgdGhpcy5kYXRhID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSk7XHJcbn07XHJcblxyXG5MaGFBcnJheVdyaXRlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICB0aGlzLmRhdGFbdGhpcy5vZmZzZXQrK10gPSBkYXRhO1xyXG59O1xyXG5cclxudmFyIExoYVRyZWUgPSBmdW5jdGlvbigpIHt9O1xyXG5MaGFUcmVlLkxFQUYgPSAxIDw8IDE1O1xyXG5cclxuTGhhVHJlZS5wcm90b3R5cGUuc2V0Q29uc3RhbnQgPSBmdW5jdGlvbihjb2RlKSB7XHJcbiAgICB0aGlzLnRyZWVbMF0gPSBjb2RlIHwgTGhhVHJlZS5MRUFGO1xyXG59O1xyXG5cclxuTGhhVHJlZS5wcm90b3R5cGUuZXhwYW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgZW5kT2Zmc2V0ID0gdGhpcy5hbGxvY2F0ZWQ7XHJcbiAgICB3aGlsZSAodGhpcy5uZXh0RW50cnkgPCBlbmRPZmZzZXQpIHtcclxuICAgICAgICB0aGlzLnRyZWVbdGhpcy5uZXh0RW50cnldID0gdGhpcy5hbGxvY2F0ZWQ7XHJcbiAgICAgICAgdGhpcy5hbGxvY2F0ZWQgKz0gMjtcclxuICAgICAgICB0aGlzLm5leHRFbnRyeSsrO1xyXG4gICAgfVxyXG59O1xyXG5cclxuTGhhVHJlZS5wcm90b3R5cGUuYWRkQ29kZXNXaXRoTGVuZ3RoID0gZnVuY3Rpb24oY29kZUxlbmd0aHMsIGNvZGVMZW5ndGgpIHtcclxuICAgIHZhciBkb25lID0gdHJ1ZTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29kZUxlbmd0aHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBpZiAoY29kZUxlbmd0aHNbaV0gPT0gY29kZUxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMubmV4dEVudHJ5Kys7XHJcbiAgICAgICAgICAgIHRoaXMudHJlZVtub2RlXSA9IGkgfCBMaGFUcmVlLkxFQUY7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlTGVuZ3Roc1tpXSA+IGNvZGVMZW5ndGgpIHtcclxuICAgICAgICAgICAgZG9uZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBkb25lO1xyXG59O1xyXG5cclxuTGhhVHJlZS5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbihjb2RlTGVuZ3Rocywgc2l6ZSkge1xyXG4gICAgdGhpcy50cmVlID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKylcclxuICAgICAgICB0aGlzLnRyZWVbaV0gPSBMaGFUcmVlLkxFQUY7XHJcblxyXG4gICAgdGhpcy5uZXh0RW50cnkgPSAwO1xyXG4gICAgdGhpcy5hbGxvY2F0ZWQgPSAxO1xyXG4gICAgdmFyIGNvZGVMZW5ndGggPSAwO1xyXG4gICAgZG8ge1xyXG4gICAgICAgIHRoaXMuZXhwYW5kKCk7XHJcbiAgICAgICAgY29kZUxlbmd0aCsrO1xyXG4gICAgfSB3aGlsZSAoIXRoaXMuYWRkQ29kZXNXaXRoTGVuZ3RoKGNvZGVMZW5ndGhzLCBjb2RlTGVuZ3RoKSk7XHJcbn07XHJcblxyXG5MaGFUcmVlLnByb3RvdHlwZS5yZWFkQ29kZSA9IGZ1bmN0aW9uKHJlYWRlcikge1xyXG4gICAgdmFyIGNvZGUgPSB0aGlzLnRyZWVbMF07XHJcbiAgICB3aGlsZSAoKGNvZGUgJiBMaGFUcmVlLkxFQUYpID09IDApIHtcclxuICAgICAgICB2YXIgYml0ID0gcmVhZGVyLnJlYWRCaXRzKDEpO1xyXG4gICAgICAgIGNvZGUgPSB0aGlzLnRyZWVbY29kZSArIGJpdF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY29kZSAmIH5MaGFUcmVlLkxFQUY7XHJcbn07XHJcblxyXG52YXIgTGhhUmluZ0J1ZmZlciA9IGZ1bmN0aW9uKHNpemUpIHtcclxuICAgIHRoaXMuZGF0YSA9IFtdO1xyXG4gICAgdGhpcy5zaXplID0gc2l6ZTtcclxuICAgIHRoaXMub2Zmc2V0ID0gMDtcclxufTtcclxuXHJcbkxoYVJpbmdCdWZmZXIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICB0aGlzLmRhdGFbdGhpcy5vZmZzZXRdID0gdmFsdWU7XHJcbiAgICB0aGlzLm9mZnNldCA9ICh0aGlzLm9mZnNldCArIDEpICUgdGhpcy5zaXplO1xyXG59O1xyXG5cclxuTGhhUmluZ0J1ZmZlci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ob2Zmc2V0LCBsZW5ndGgpIHtcclxuICAgIHZhciBwb3MgPSB0aGlzLm9mZnNldCArIHRoaXMuc2l6ZSAtIG9mZnNldCAtIDE7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGNvZGUgPSB0aGlzLmRhdGFbKHBvcyArIGkpICUgdGhpcy5zaXplXTtcclxuICAgICAgICByZXN1bHQucHVzaChjb2RlKTtcclxuICAgICAgICB0aGlzLmFkZChjb2RlKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG52YXIgTGhhUmVhZGVyID0gZnVuY3Rpb24ocmVhZGVyKSB7XHJcbiAgICB0aGlzLnJlYWRlciA9IHJlYWRlcjtcclxuICAgIHRoaXMub2Zmc2V0VHJlZSA9IG5ldyBMaGFUcmVlKCk7XHJcbiAgICB0aGlzLmNvZGVUcmVlID0gbmV3IExoYVRyZWUoKTtcclxuICAgIHRoaXMucmluZ0J1ZmZlciA9IG5ldyBMaGFSaW5nQnVmZmVyKDEgPDwgMTMpOyAvLyBsaDQgc3BlY2lmaWMuXHJcbiAgICB0aGlzLmVudHJpZXMgPSB7fTtcclxuXHJcbiAgICBpZiAocmVhZGVyLnJlYWRTdHJpbmcoMikgPT0gJ01aJykgeyAvLyBDaGVjayBmb3IgU0ZYIGhlYWRlciwgYW5kIHNraXAgaXQgaWYgaXQgZXhpc3RzLlxyXG4gICAgICAgIHZhciBsYXN0QmxvY2tTaXplID0gcmVhZGVyLnJlYWRVSW50MTYoKTtcclxuICAgICAgICB2YXIgYmxvY2tDb3VudCA9IHJlYWRlci5yZWFkVUludDE2KCk7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IChibG9ja0NvdW50IC0gMSkgKiA1MTIgKyAobGFzdEJsb2NrU2l6ZSAhPSAwID8gbGFzdEJsb2NrU2l6ZSA6IDUxMik7XHJcbiAgICAgICAgcmVhZGVyLnNlZWsob2Zmc2V0LCBMaGFBcnJheVJlYWRlci5TZWVrQWJzb2x1dGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZWFkZXIuc2VlaygwLCBMaGFBcnJheVJlYWRlci5TZWVrQWJzb2x1dGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAoOzspIHtcclxuICAgICAgICB2YXIgaGVhZGVyID0ge307XHJcbiAgICAgICAgaGVhZGVyLnNpemUgPSByZWFkZXIucmVhZFVJbnQ4KCk7XHJcbiAgICAgICAgaWYgKGhlYWRlci5zaXplIDw9IDApXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICBoZWFkZXIuY2hlY2tzdW0gPSByZWFkZXIucmVhZFVJbnQ4KCk7XHJcbiAgICAgICAgaGVhZGVyLmlkID0gcmVhZGVyLnJlYWRTdHJpbmcoNSk7XHJcbiAgICAgICAgaGVhZGVyLnBhY2tlZFNpemUgPSByZWFkZXIucmVhZFVJbnQzMigpO1xyXG4gICAgICAgIGhlYWRlci5vcmlnaW5hbFNpemUgPSByZWFkZXIucmVhZFVJbnQzMigpO1xyXG4gICAgICAgIGhlYWRlci5kYXRldGltZSA9IHJlYWRlci5yZWFkVUludDMyKCk7XHJcbiAgICAgICAgaGVhZGVyLmF0dHJpYnV0ZXMgPSByZWFkZXIucmVhZFVJbnQxNigpO1xyXG4gICAgICAgIHZhciBmaWxlbmFtZVNpemUgPSByZWFkZXIucmVhZFVJbnQ4KCk7XHJcbiAgICAgICAgaGVhZGVyLmZpbGVuYW1lID0gcmVhZGVyLnJlYWRTdHJpbmcoZmlsZW5hbWVTaXplKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIGhlYWRlci5jcmMgPSByZWFkZXIucmVhZFVJbnQxNigpO1xyXG4gICAgICAgIGhlYWRlci5vZmZzZXQgPSByZWFkZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICB0aGlzLmVudHJpZXNbaGVhZGVyLmZpbGVuYW1lXSA9IGhlYWRlcjtcclxuICAgICAgICByZWFkZXIuc2VlayhoZWFkZXIucGFja2VkU2l6ZSwgTGhhQXJyYXlSZWFkZXIuU2Vla1JlbGF0aXZlKTtcclxuICAgIH1cclxufTtcclxuXHJcbkxoYVJlYWRlci5wcm90b3R5cGUucmVhZFRlbXBUYWJsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciByZWFkZXIgPSB0aGlzLnJlYWRlcjtcclxuICAgIHZhciBjb2RlQ291bnQgPSBNYXRoLm1pbihyZWFkZXIucmVhZEJpdHMoNSksIDE5KTtcclxuICAgIGlmIChjb2RlQ291bnQgPD0gMCkge1xyXG4gICAgICAgIHZhciBjb25zdGFudCA9IHJlYWRlci5yZWFkQml0cyg1KTtcclxuICAgICAgICB0aGlzLm9mZnNldFRyZWUuc2V0Q29uc3RhbnQoY29uc3RhbnQpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBjb2RlTGVuZ3RocyA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2RlQ291bnQ7IGkrKykge1xyXG4gICAgICAgIHZhciBjb2RlTGVuZ3RoID0gcmVhZGVyLnJlYWRMZW5ndGgoKTtcclxuICAgICAgICBjb2RlTGVuZ3Rocy5wdXNoKGNvZGVMZW5ndGgpO1xyXG4gICAgICAgIGlmIChpID09IDIpIHsgLy8gVGhlIGRyZWFkZWQgc3BlY2lhbCBiaXQgdGhhdCBuby1vbmUgKGluY2x1ZGluZyBtZSkgc2VlbXMgdG8gdW5kZXJzdGFuZC5cclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHJlYWRlci5yZWFkQml0cygyKTtcclxuICAgICAgICAgICAgd2hpbGUgKGxlbmd0aC0tID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29kZUxlbmd0aHMucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMub2Zmc2V0VHJlZS5idWlsZChjb2RlTGVuZ3RocywgMTkgKiAyKTtcclxufTtcclxuXHJcbkxoYVJlYWRlci5wcm90b3R5cGUucmVhZENvZGVUYWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHJlYWRlciA9IHRoaXMucmVhZGVyO1xyXG4gICAgdmFyIGNvZGVDb3VudCA9IE1hdGgubWluKHJlYWRlci5yZWFkQml0cyg5KSwgNTEwKTtcclxuICAgIGlmIChjb2RlQ291bnQgPD0gMCkge1xyXG4gICAgICAgIHZhciBjb25zdGFudCA9IHJlYWRlci5yZWFkQml0cyg5KTtcclxuICAgICAgICB0aGlzLmNvZGVUcmVlLnNldENvbnN0YW50KGNvbnN0YW50KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvZGVMZW5ndGhzID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvZGVDb3VudDsgKSB7XHJcbiAgICAgICAgdmFyIGNvZGUgPSB0aGlzLm9mZnNldFRyZWUucmVhZENvZGUocmVhZGVyKTtcclxuICAgICAgICBpZiAoY29kZSA8PSAyKSB7XHJcbiAgICAgICAgICAgIHZhciBza2lwID0gMTtcclxuICAgICAgICAgICAgaWYgKGNvZGUgPT0gMSlcclxuICAgICAgICAgICAgICAgIHNraXAgPSByZWFkZXIucmVhZEJpdHMoNCkgKyAzO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChjb2RlID09IDIpXHJcbiAgICAgICAgICAgICAgICBza2lwID0gcmVhZGVyLnJlYWRCaXRzKDkpICsgMjA7XHJcbiAgICAgICAgICAgIHdoaWxlICgtLXNraXAgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29kZUxlbmd0aHMucHVzaCgwKTtcclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvZGVMZW5ndGhzLnB1c2goY29kZSAtIDIpO1xyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5jb2RlVHJlZS5idWlsZChjb2RlTGVuZ3RocywgNTEwICogMik7XHJcbn07XHJcblxyXG5MaGFSZWFkZXIucHJvdG90eXBlLnJlYWRPZmZzZXRUYWJsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHJlYWRlciA9IHRoaXMucmVhZGVyO1xyXG4gICAgdmFyIGNvZGVDb3VudCA9IE1hdGgubWluKHJlYWRlci5yZWFkQml0cyg0KSwgMTQpO1xyXG4gICAgaWYgKGNvZGVDb3VudCA8PSAwKSB7XHJcbiAgICAgICAgdmFyIGNvbnN0YW50ID0gcmVhZGVyLnJlYWRCaXRzKDQpO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0VHJlZS5zZXRDb25zdGFudChjb25zdGFudCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBjb2RlTGVuZ3RocyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29kZUNvdW50OyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNvZGUgPSByZWFkZXIucmVhZExlbmd0aCgpO1xyXG4gICAgICAgICAgICBjb2RlTGVuZ3Roc1tpXSA9IGNvZGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub2Zmc2V0VHJlZS5idWlsZChjb2RlTGVuZ3RocywgMTkgKiAyKTtcclxuICAgIH1cclxufTtcclxuXHJcbkxoYVJlYWRlci5wcm90b3R5cGUuZXh0cmFjdCA9IGZ1bmN0aW9uKGlkLCBjYWxsYmFjaywgb25lcnJvcikge1xyXG4gICAgdmFyIGVudHJ5ID0gdGhpcy5lbnRyaWVzW2lkXTtcclxuICAgIGlmICghZW50cnkpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdGhpcy5yZWFkZXIuc2VlayhlbnRyeS5vZmZzZXQsIExoYUFycmF5UmVhZGVyLlNlZWtBYnNvbHV0ZSk7XHJcbiAgICB2YXIgd3JpdGVyID0gbmV3IExoYUFycmF5V3JpdGVyKGVudHJ5Lm9yaWdpbmFsU2l6ZSk7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBmdW5jdGlvbiBzdGVwKCkgeyAvLyBUaGlzIHN0ZXAgc29sdXRpb24gd2FzIGJvcnJvd2VkIGZyb20gWklQLWxpYiB0byBwcmV2ZW50IGJyb3dzZXIgc2NyaXB0IHRpbWVvdXQgd2FybmluZ3MuXHJcbiAgICAgICAgaWYgKHRoYXQuZXh0cmFjdEJsb2NrKHdyaXRlcikpIHtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKVxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sod3JpdGVyLm9mZnNldCwgd3JpdGVyLnNpemUpO1xyXG4gICAgICAgICAgICBpZiAod3JpdGVyLm9mZnNldCA+PSB3cml0ZXIuc2l6ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoc3RlcCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc3RlcCgpO1xyXG4gICAgcmV0dXJuIHdyaXRlci5kYXRhO1xyXG59O1xyXG5cclxuTGhhUmVhZGVyLnByb3RvdHlwZS5leHRyYWN0QmxvY2sgPSBmdW5jdGlvbih3cml0ZXIpIHtcclxuICAgIHZhciByZWFkZXIgPSB0aGlzLnJlYWRlcjtcclxuICAgIHZhciBibG9ja1NpemUgPSByZWFkZXIucmVhZEJpdHMoMTYpO1xyXG4gICAgaWYgKGJsb2NrU2l6ZSA8PSAwIHx8IHJlYWRlci5vZmZzZXQgPj0gcmVhZGVyLnNpemUpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIHRoaXMucmVhZFRlbXBUYWJsZSgpO1xyXG4gICAgdGhpcy5yZWFkQ29kZVRhYmxlKCk7XHJcbiAgICB0aGlzLnJlYWRPZmZzZXRUYWJsZSgpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmxvY2tTaXplOyBpKyspIHtcclxuICAgICAgICB2YXIgY29kZSA9IHRoaXMuY29kZVRyZWUucmVhZENvZGUocmVhZGVyKTtcclxuICAgICAgICBpZiAoY29kZSA8IDI1Nikge1xyXG4gICAgICAgICAgICB0aGlzLnJpbmdCdWZmZXIuYWRkKGNvZGUpO1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUoY29kZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGJpdHMgPSB0aGlzLm9mZnNldFRyZWUucmVhZENvZGUocmVhZGVyKTtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IGJpdHM7XHJcbiAgICAgICAgICAgIGlmIChiaXRzID49IDIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSByZWFkZXIucmVhZEJpdHMoYml0cyAtIDEpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gb2Zmc2V0ICsgKDEgPDwgKGJpdHMgLSAxKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBjb2RlIC0gMjU2ICsgMztcclxuICAgICAgICAgICAgdmFyIGNodW5rID0gdGhpcy5yaW5nQnVmZmVyLmdldChvZmZzZXQsIGxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogaW4gY2h1bmspXHJcbiAgICAgICAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmtbal0pOyAvLyBUT0RPOiBMb29rIGF0IGJ1bGstY29weWluZyB0aGlzLlxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9saWIvbGg0LmpzXCIsXCIvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuLypcbiBDb3B5cmlnaHQgKGMpIDIwMTIgR2lsZGFzIExvcm1lYXUuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5cbiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcblxuIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuXG4gMi4gUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW5cbiB0aGUgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuIDMuIFRoZSBuYW1lcyBvZiB0aGUgYXV0aG9ycyBtYXkgbm90IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzXG4gZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG5cbiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIGBgQVMgSVMnJyBBTkQgQU5ZIEVYUFJFU1NFRCBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsXG4gSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORFxuIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBKQ1JBRlQsXG4gSU5DLiBPUiBBTlkgQ09OVFJJQlVUT1JTIFRPIFRISVMgU09GVFdBUkUgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCxcbiBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UXG4gTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsXG4gT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRlxuIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HXG4gTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLFxuIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cblxuKGZ1bmN0aW9uKG9iaikge1xuXG5cdHZhciBFUlJfQkFEX0ZPUk1BVCA9IFwiRmlsZSBmb3JtYXQgaXMgbm90IHJlY29nbml6ZWQuXCI7XG5cdHZhciBFUlJfRU5DUllQVEVEID0gXCJGaWxlIGNvbnRhaW5zIGVuY3J5cHRlZCBlbnRyeS5cIjtcblx0dmFyIEVSUl9aSVA2NCA9IFwiRmlsZSBpcyB1c2luZyBaaXA2NCAoNGdiKyBmaWxlIHNpemUpLlwiO1xuXHR2YXIgRVJSX1JFQUQgPSBcIkVycm9yIHdoaWxlIHJlYWRpbmcgemlwIGZpbGUuXCI7XG5cdHZhciBFUlJfV1JJVEUgPSBcIkVycm9yIHdoaWxlIHdyaXRpbmcgemlwIGZpbGUuXCI7XG5cdHZhciBFUlJfV1JJVEVfREFUQSA9IFwiRXJyb3Igd2hpbGUgd3JpdGluZyBmaWxlIGRhdGEuXCI7XG5cdHZhciBFUlJfUkVBRF9EQVRBID0gXCJFcnJvciB3aGlsZSByZWFkaW5nIGZpbGUgZGF0YS5cIjtcblx0dmFyIEVSUl9EVVBMSUNBVEVEX05BTUUgPSBcIkZpbGUgYWxyZWFkeSBleGlzdHMuXCI7XG5cdHZhciBFUlJfSFRUUF9SQU5HRSA9IFwiSFRUUCBSYW5nZSBub3Qgc3VwcG9ydGVkLlwiO1xuXHR2YXIgQ0hVTktfU0laRSA9IDUxMiAqIDEwMjQ7XG5cblx0dmFyIElORkxBVEVfSlMgPSBcImluZmxhdGUuanNcIjtcblx0dmFyIERFRkxBVEVfSlMgPSBcImRlZmxhdGUuanNcIjtcblxuXHR2YXIgQmxvYkJ1aWxkZXIgPSBvYmouV2ViS2l0QmxvYkJ1aWxkZXIgfHwgb2JqLk1vekJsb2JCdWlsZGVyIHx8IG9iai5NU0Jsb2JCdWlsZGVyIHx8IG9iai5CbG9iQnVpbGRlcjtcblxuXHR2YXIgYXBwZW5kQUJWaWV3U3VwcG9ydGVkO1xuXG5cdGZ1bmN0aW9uIGlzQXBwZW5kQUJWaWV3U3VwcG9ydGVkKCkge1xuXHRcdGlmICh0eXBlb2YgYXBwZW5kQUJWaWV3U3VwcG9ydGVkID09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdHZhciBibG9iQnVpbGRlcjtcblx0XHRcdGJsb2JCdWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdFx0XHRibG9iQnVpbGRlci5hcHBlbmQoZ2V0RGF0YUhlbHBlcigwKS52aWV3KTtcblx0XHRcdGFwcGVuZEFCVmlld1N1cHBvcnRlZCA9IGJsb2JCdWlsZGVyLmdldEJsb2IoKS5zaXplID09IDA7XG5cdFx0fVxuXHRcdHJldHVybiBhcHBlbmRBQlZpZXdTdXBwb3J0ZWQ7XG5cdH1cblxuXHRmdW5jdGlvbiBDcmMzMigpIHtcblx0XHR2YXIgY3JjID0gLTEsIHRoYXQgPSB0aGlzO1xuXHRcdHRoYXQuYXBwZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dmFyIG9mZnNldCwgdGFibGUgPSB0aGF0LnRhYmxlO1xuXHRcdFx0Zm9yIChvZmZzZXQgPSAwOyBvZmZzZXQgPCBkYXRhLmxlbmd0aDsgb2Zmc2V0KyspXG5cdFx0XHRcdGNyYyA9IChjcmMgPj4+IDgpIF4gdGFibGVbKGNyYyBeIGRhdGFbb2Zmc2V0XSkgJiAweEZGXTtcblx0XHR9O1xuXHRcdHRoYXQuZ2V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gfmNyYztcblx0XHR9O1xuXHR9XG5cdENyYzMyLnByb3RvdHlwZS50YWJsZSA9IChmdW5jdGlvbigpIHtcblx0XHR2YXIgaSwgaiwgdCwgdGFibGUgPSBbXTtcblx0XHRmb3IgKGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcblx0XHRcdHQgPSBpO1xuXHRcdFx0Zm9yIChqID0gMDsgaiA8IDg7IGorKylcblx0XHRcdFx0aWYgKHQgJiAxKVxuXHRcdFx0XHRcdHQgPSAodCA+Pj4gMSkgXiAweEVEQjg4MzIwO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0dCA9IHQgPj4+IDE7XG5cdFx0XHR0YWJsZVtpXSA9IHQ7XG5cdFx0fVxuXHRcdHJldHVybiB0YWJsZTtcblx0fSkoKTtcblxuXHRmdW5jdGlvbiBibG9iU2xpY2UoYmxvYiwgaW5kZXgsIGxlbmd0aCkge1xuXHRcdGlmIChibG9iLnNsaWNlKVxuXHRcdFx0cmV0dXJuIGJsb2Iuc2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcblx0XHRlbHNlIGlmIChibG9iLndlYmtpdFNsaWNlKVxuXHRcdFx0cmV0dXJuIGJsb2Iud2Via2l0U2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcblx0XHRlbHNlIGlmIChibG9iLm1velNsaWNlKVxuXHRcdFx0cmV0dXJuIGJsb2IubW96U2xpY2UoaW5kZXgsIGluZGV4ICsgbGVuZ3RoKTtcblx0XHRlbHNlIGlmIChibG9iLm1zU2xpY2UpXG5cdFx0XHRyZXR1cm4gYmxvYi5tc1NsaWNlKGluZGV4LCBpbmRleCArIGxlbmd0aCk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXREYXRhSGVscGVyKGJ5dGVMZW5ndGgsIGJ5dGVzKSB7XG5cdFx0dmFyIGRhdGFCdWZmZXIsIGRhdGFBcnJheTtcblx0XHRkYXRhQnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ5dGVMZW5ndGgpO1xuXHRcdGRhdGFBcnJheSA9IG5ldyBVaW50OEFycmF5KGRhdGFCdWZmZXIpO1xuXHRcdGlmIChieXRlcylcblx0XHRcdGRhdGFBcnJheS5zZXQoYnl0ZXMsIDApO1xuXHRcdHJldHVybiB7XG5cdFx0XHRidWZmZXIgOiBkYXRhQnVmZmVyLFxuXHRcdFx0YXJyYXkgOiBkYXRhQXJyYXksXG5cdFx0XHR2aWV3IDogbmV3IERhdGFWaWV3KGRhdGFCdWZmZXIpXG5cdFx0fTtcblx0fVxuXG5cdC8vIFJlYWRlcnNcblx0ZnVuY3Rpb24gUmVhZGVyKCkge1xuXHR9XG5cblx0ZnVuY3Rpb24gVGV4dFJlYWRlcih0ZXh0KSB7XG5cdFx0dmFyIHRoYXQgPSB0aGlzLCBibG9iUmVhZGVyO1xuXG5cdFx0ZnVuY3Rpb24gaW5pdChjYWxsYmFjaywgb25lcnJvcikge1xuXHRcdFx0dmFyIGJsb2JCdWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdFx0XHRibG9iQnVpbGRlci5hcHBlbmQodGV4dCk7XG5cdFx0XHRibG9iUmVhZGVyID0gbmV3IEJsb2JSZWFkZXIoYmxvYkJ1aWxkZXIuZ2V0QmxvYihcInRleHQvcGxhaW5cIikpO1xuXHRcdFx0YmxvYlJlYWRlci5pbml0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGF0LnNpemUgPSBibG9iUmVhZGVyLnNpemU7XG5cdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHR9LCBvbmVycm9yKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiByZWFkVWludDhBcnJheShpbmRleCwgbGVuZ3RoLCBjYWxsYmFjaywgb25lcnJvcikge1xuXHRcdFx0YmxvYlJlYWRlci5yZWFkVWludDhBcnJheShpbmRleCwgbGVuZ3RoLCBjYWxsYmFjaywgb25lcnJvcik7XG5cdFx0fVxuXG5cdFx0dGhhdC5zaXplID0gMDtcblx0XHR0aGF0LmluaXQgPSBpbml0O1xuXHRcdHRoYXQucmVhZFVpbnQ4QXJyYXkgPSByZWFkVWludDhBcnJheTtcblx0fVxuXHRUZXh0UmVhZGVyLnByb3RvdHlwZSA9IG5ldyBSZWFkZXIoKTtcblx0VGV4dFJlYWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUZXh0UmVhZGVyO1xuXG5cdGZ1bmN0aW9uIERhdGE2NFVSSVJlYWRlcihkYXRhVVJJKSB7XG5cdFx0dmFyIHRoYXQgPSB0aGlzLCBkYXRhU3RhcnQ7XG5cblx0XHRmdW5jdGlvbiBpbml0KGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgZGF0YUVuZCA9IGRhdGFVUkkubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGRhdGFVUkkuY2hhckF0KGRhdGFFbmQgLSAxKSA9PSBcIj1cIilcblx0XHRcdFx0ZGF0YUVuZC0tO1xuXHRcdFx0ZGF0YVN0YXJ0ID0gZGF0YVVSSS5pbmRleE9mKFwiLFwiKSArIDE7XG5cdFx0XHR0aGF0LnNpemUgPSBNYXRoLmZsb29yKChkYXRhRW5kIC0gZGF0YVN0YXJ0KSAqIDAuNzUpO1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiByZWFkVWludDhBcnJheShpbmRleCwgbGVuZ3RoLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIGksIGRhdGEgPSBnZXREYXRhSGVscGVyKGxlbmd0aCk7XG5cdFx0XHR2YXIgc3RhcnQgPSBNYXRoLmZsb29yKGluZGV4IC8gMykgKiA0O1xuXHRcdFx0dmFyIGVuZCA9IE1hdGguY2VpbCgoaW5kZXggKyBsZW5ndGgpIC8gMykgKiA0O1xuXHRcdFx0dmFyIGJ5dGVzID0gb2JqLmF0b2IoZGF0YVVSSS5zdWJzdHJpbmcoc3RhcnQgKyBkYXRhU3RhcnQsIGVuZCArIGRhdGFTdGFydCkpO1xuXHRcdFx0dmFyIGRlbHRhID0gaW5kZXggLSBNYXRoLmZsb29yKHN0YXJ0IC8gNCkgKiAzO1xuXHRcdFx0Zm9yIChpID0gZGVsdGE7IGkgPCBkZWx0YSArIGxlbmd0aDsgaSsrKVxuXHRcdFx0XHRkYXRhLmFycmF5W2kgLSBkZWx0YV0gPSBieXRlcy5jaGFyQ29kZUF0KGkpO1xuXHRcdFx0Y2FsbGJhY2soZGF0YS5hcnJheSk7XG5cdFx0fVxuXG5cdFx0dGhhdC5zaXplID0gMDtcblx0XHR0aGF0LmluaXQgPSBpbml0O1xuXHRcdHRoYXQucmVhZFVpbnQ4QXJyYXkgPSByZWFkVWludDhBcnJheTtcblx0fVxuXHREYXRhNjRVUklSZWFkZXIucHJvdG90eXBlID0gbmV3IFJlYWRlcigpO1xuXHREYXRhNjRVUklSZWFkZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGF0YTY0VVJJUmVhZGVyO1xuXG5cdGZ1bmN0aW9uIEJsb2JSZWFkZXIoYmxvYikge1xuXHRcdHZhciB0aGF0ID0gdGhpcztcblxuXHRcdGZ1bmN0aW9uIGluaXQoY2FsbGJhY2spIHtcblx0XHRcdHRoaXMuc2l6ZSA9IGJsb2Iuc2l6ZTtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcmVhZFVpbnQ4QXJyYXkoaW5kZXgsIGxlbmd0aCwgY2FsbGJhY2ssIG9uZXJyb3IpIHtcblx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0Y2FsbGJhY2sobmV3IFVpbnQ4QXJyYXkoZS50YXJnZXQucmVzdWx0KSk7XG5cdFx0XHR9O1xuXHRcdFx0cmVhZGVyLm9uZXJyb3IgPSBvbmVycm9yO1xuXHRcdFx0cmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2JTbGljZShibG9iLCBpbmRleCwgbGVuZ3RoKSk7XG5cdFx0fVxuXG5cdFx0dGhhdC5zaXplID0gMDtcblx0XHR0aGF0LmluaXQgPSBpbml0O1xuXHRcdHRoYXQucmVhZFVpbnQ4QXJyYXkgPSByZWFkVWludDhBcnJheTtcblx0fVxuXHRCbG9iUmVhZGVyLnByb3RvdHlwZSA9IG5ldyBSZWFkZXIoKTtcblx0QmxvYlJlYWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCbG9iUmVhZGVyO1xuXG5cdGZ1bmN0aW9uIEh0dHBSZWFkZXIodXJsKSB7XG5cdFx0dmFyIHRoYXQgPSB0aGlzO1xuXG5cdFx0ZnVuY3Rpb24gZ2V0RGF0YShjYWxsYmFjaywgb25lcnJvcikge1xuXHRcdFx0dmFyIHJlcXVlc3Q7XG5cdFx0XHRpZiAoIXRoYXQuZGF0YSkge1xuXHRcdFx0XHRyZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0XHRcdHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKCF0aGF0LnNpemUpXG5cdFx0XHRcdFx0XHR0aGF0LnNpemUgPSBOdW1iZXIocmVxdWVzdC5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtTGVuZ3RoXCIpKTtcblx0XHRcdFx0XHR0aGF0LmRhdGEgPSBuZXcgVWludDhBcnJheShyZXF1ZXN0LnJlc3BvbnNlKTtcblx0XHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0XHR9LCBmYWxzZSk7XG5cdFx0XHRcdHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIG9uZXJyb3IsIGZhbHNlKTtcblx0XHRcdFx0cmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCk7XG5cdFx0XHRcdHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuXHRcdFx0XHRyZXF1ZXN0LnNlbmQoKTtcblx0XHRcdH0gZWxzZVxuXHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGluaXQoY2FsbGJhY2ssIG9uZXJyb3IpIHtcblx0XHRcdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICBkZWJ1Z2dlcjtcblx0XHRcdHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRoYXQuc2l6ZSA9IE51bWJlcihyZXF1ZXN0LmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1MZW5ndGhcIikpO1xuXHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0fSwgZmFsc2UpO1xuXHRcdFx0cmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgb25lcnJvciwgZmFsc2UpO1xuXHRcdFx0cmVxdWVzdC5vcGVuKFwiSEVBRFwiLCB1cmwpO1xuXHRcdFx0cmVxdWVzdC5zZW5kKCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gcmVhZFVpbnQ4QXJyYXkoaW5kZXgsIGxlbmd0aCwgY2FsbGJhY2ssIG9uZXJyb3IpIHtcblx0XHRcdGdldERhdGEoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNhbGxiYWNrKG5ldyBVaW50OEFycmF5KHRoYXQuZGF0YS5zdWJhcnJheShpbmRleCwgaW5kZXggKyBsZW5ndGgpKSk7XG5cdFx0XHR9LCBvbmVycm9yKTtcblx0XHR9XG5cblx0XHR0aGF0LnNpemUgPSAwO1xuXHRcdHRoYXQuaW5pdCA9IGluaXQ7XG5cdFx0dGhhdC5yZWFkVWludDhBcnJheSA9IHJlYWRVaW50OEFycmF5O1xuXHR9XG5cdEh0dHBSZWFkZXIucHJvdG90eXBlID0gbmV3IFJlYWRlcigpO1xuXHRIdHRwUmVhZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEh0dHBSZWFkZXI7XG5cblx0ZnVuY3Rpb24gSHR0cFJhbmdlUmVhZGVyKHVybCkge1xuXHRcdHZhciB0aGF0ID0gdGhpcztcblxuXHRcdGZ1bmN0aW9uIGluaXQoY2FsbGJhY2ssIG9uZXJyb3IpIHtcblx0XHRcdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGF0LnNpemUgPSBOdW1iZXIocmVxdWVzdC5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtTGVuZ3RoXCIpKTtcblx0XHRcdFx0aWYgKHJlcXVlc3QuZ2V0UmVzcG9uc2VIZWFkZXIoXCJBY2NlcHQtUmFuZ2VzXCIpID09IFwiYnl0ZXNcIilcblx0XHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0b25lcnJvcihFUlJfSFRUUF9SQU5HRSk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCBvbmVycm9yLCBmYWxzZSk7XG5cdFx0XHRyZXF1ZXN0Lm9wZW4oXCJIRUFEXCIsIHVybCk7XG5cdFx0XHRyZXF1ZXN0LnNlbmQoKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiByZWFkQXJyYXlCdWZmZXIoaW5kZXgsIGxlbmd0aCwgY2FsbGJhY2ssIG9uZXJyb3IpIHtcblx0XHRcdHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cdFx0XHRyZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsKTtcblx0XHRcdHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuXHRcdFx0cmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKFwiUmFuZ2VcIiwgXCJieXRlcz1cIiArIGluZGV4ICsgXCItXCIgKyAoaW5kZXggKyBsZW5ndGggLSAxKSk7XG5cdFx0XHRyZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRjYWxsYmFjayhyZXF1ZXN0LnJlc3BvbnNlKTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHRcdHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIG9uZXJyb3IsIGZhbHNlKTtcblx0XHRcdHJlcXVlc3Quc2VuZCgpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHJlYWRVaW50OEFycmF5KGluZGV4LCBsZW5ndGgsIGNhbGxiYWNrLCBvbmVycm9yKSB7XG5cdFx0XHRyZWFkQXJyYXlCdWZmZXIoaW5kZXgsIGxlbmd0aCwgZnVuY3Rpb24oYXJyYXlidWZmZXIpIHtcblx0XHRcdFx0Y2FsbGJhY2sobmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpKTtcblx0XHRcdH0sIG9uZXJyb3IpO1xuXHRcdH1cblxuXHRcdHRoYXQuc2l6ZSA9IDA7XG5cdFx0dGhhdC5pbml0ID0gaW5pdDtcblx0XHR0aGF0LnJlYWRVaW50OEFycmF5ID0gcmVhZFVpbnQ4QXJyYXk7XG5cdH1cblx0SHR0cFJhbmdlUmVhZGVyLnByb3RvdHlwZSA9IG5ldyBSZWFkZXIoKTtcblx0SHR0cFJhbmdlUmVhZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEh0dHBSYW5nZVJlYWRlcjtcblxuXHQvLyBXcml0ZXJzXG5cblx0ZnVuY3Rpb24gV3JpdGVyKCkge1xuXHR9XG5cdFdyaXRlci5wcm90b3R5cGUuZ2V0RGF0YSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdFx0Y2FsbGJhY2sodGhpcy5kYXRhKTtcblx0fTtcblxuXHRmdW5jdGlvbiBUZXh0V3JpdGVyKCkge1xuXHRcdHZhciB0aGF0ID0gdGhpcywgYmxvYkJ1aWxkZXI7XG5cblx0XHRmdW5jdGlvbiBpbml0KGNhbGxiYWNrKSB7XG5cdFx0XHRibG9iQnVpbGRlciA9IG5ldyBCbG9iQnVpbGRlcigpO1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB3cml0ZVVpbnQ4QXJyYXkoYXJyYXksIGNhbGxiYWNrKSB7XG5cdFx0XHRibG9iQnVpbGRlci5hcHBlbmQoaXNBcHBlbmRBQlZpZXdTdXBwb3J0ZWQoKSA/IGFycmF5IDogYXJyYXkuYnVmZmVyKTtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0RGF0YShjYWxsYmFjaywgb25lcnJvcikge1xuXHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRjYWxsYmFjayhlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0fTtcblx0XHRcdHJlYWRlci5vbmVycm9yID0gb25lcnJvcjtcblx0XHRcdHJlYWRlci5yZWFkQXNUZXh0KGJsb2JCdWlsZGVyLmdldEJsb2IoXCJ0ZXh0L3BsYWluXCIpKTtcblx0XHR9XG5cblx0XHR0aGF0LmluaXQgPSBpbml0O1xuXHRcdHRoYXQud3JpdGVVaW50OEFycmF5ID0gd3JpdGVVaW50OEFycmF5O1xuXHRcdHRoYXQuZ2V0RGF0YSA9IGdldERhdGE7XG5cdH1cblx0VGV4dFdyaXRlci5wcm90b3R5cGUgPSBuZXcgV3JpdGVyKCk7XG5cdFRleHRXcml0ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVGV4dFdyaXRlcjtcblxuXG5cdGZ1bmN0aW9uIERhdGE2NFVSSVdyaXRlcihjb250ZW50VHlwZSkge1xuXHRcdHZhciB0aGF0ID0gdGhpcywgZGF0YSA9IFwiXCIsIHBlbmRpbmcgPSBcIlwiO1xuXG5cdFx0ZnVuY3Rpb24gaW5pdChjYWxsYmFjaykge1xuXHRcdFx0ZGF0YSArPSBcImRhdGE6XCIgKyAoY29udGVudFR5cGUgfHwgXCJcIikgKyBcIjtiYXNlNjQsXCI7XG5cdFx0XHRjYWxsYmFjaygpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHdyaXRlVWludDhBcnJheShhcnJheSwgY2FsbGJhY2spIHtcblx0XHRcdHZhciBpLCBkZWx0YSA9IHBlbmRpbmcubGVuZ3RoLCBkYXRhU3RyaW5nID0gcGVuZGluZztcblx0XHRcdHBlbmRpbmcgPSBcIlwiO1xuXHRcdFx0Zm9yIChpID0gMDsgaSA8IChNYXRoLmZsb29yKChkZWx0YSArIGFycmF5Lmxlbmd0aCkgLyAzKSAqIDMpIC0gZGVsdGE7IGkrKylcblx0XHRcdFx0ZGF0YVN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGFycmF5W2ldKTtcblx0XHRcdGZvciAoOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHBlbmRpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShhcnJheVtpXSk7XG5cdFx0XHRpZiAoZGF0YVN0cmluZy5sZW5ndGggPiAyKVxuXHRcdFx0XHRkYXRhICs9IG9iai5idG9hKGRhdGFTdHJpbmcpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRwZW5kaW5nID0gZGF0YVN0cmluZztcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gZ2V0RGF0YShjYWxsYmFjaykge1xuXHRcdFx0Y2FsbGJhY2soZGF0YSArIG9iai5idG9hKHBlbmRpbmcpKTtcblx0XHR9XG5cblx0XHR0aGF0LmluaXQgPSBpbml0O1xuXHRcdHRoYXQud3JpdGVVaW50OEFycmF5ID0gd3JpdGVVaW50OEFycmF5O1xuXHRcdHRoYXQuZ2V0RGF0YSA9IGdldERhdGE7XG5cdH1cblx0RGF0YTY0VVJJV3JpdGVyLnByb3RvdHlwZSA9IG5ldyBXcml0ZXIoKTtcblx0RGF0YTY0VVJJV3JpdGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERhdGE2NFVSSVdyaXRlcjtcblxuXHRmdW5jdGlvbiBGaWxlV3JpdGVyKGZpbGVFbnRyeSwgY29udGVudFR5cGUpIHtcblx0XHR2YXIgd3JpdGVyLCB0aGF0ID0gdGhpcztcblxuXHRcdGZ1bmN0aW9uIGluaXQoY2FsbGJhY2ssIG9uZXJyb3IpIHtcblx0XHRcdGZpbGVFbnRyeS5jcmVhdGVXcml0ZXIoZnVuY3Rpb24oZmlsZVdyaXRlcikge1xuXHRcdFx0XHR3cml0ZXIgPSBmaWxlV3JpdGVyO1xuXHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0fSwgb25lcnJvcik7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gd3JpdGVVaW50OEFycmF5KGFycmF5LCBjYWxsYmFjaywgb25lcnJvcikge1xuXHRcdFx0dmFyIGJsb2JCdWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdFx0XHRibG9iQnVpbGRlci5hcHBlbmQoaXNBcHBlbmRBQlZpZXdTdXBwb3J0ZWQoKSA/IGFycmF5IDogYXJyYXkuYnVmZmVyKTtcblx0XHRcdHdyaXRlci5vbndyaXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHdyaXRlci5vbndyaXRlID0gbnVsbDtcblx0XHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdH07XG5cdFx0XHR3cml0ZXIub25lcnJvciA9IG9uZXJyb3I7XG5cdFx0XHR3cml0ZXIud3JpdGUoYmxvYkJ1aWxkZXIuZ2V0QmxvYihjb250ZW50VHlwZSkpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGdldERhdGEoY2FsbGJhY2spIHtcblx0XHRcdGZpbGVFbnRyeS5maWxlKGNhbGxiYWNrKTtcblx0XHR9XG5cblx0XHR0aGF0LmluaXQgPSBpbml0O1xuXHRcdHRoYXQud3JpdGVVaW50OEFycmF5ID0gd3JpdGVVaW50OEFycmF5O1xuXHRcdHRoYXQuZ2V0RGF0YSA9IGdldERhdGE7XG5cdH1cblx0RmlsZVdyaXRlci5wcm90b3R5cGUgPSBuZXcgV3JpdGVyKCk7XG5cdEZpbGVXcml0ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmlsZVdyaXRlcjtcblxuXHRmdW5jdGlvbiBCbG9iV3JpdGVyKGNvbnRlbnRUeXBlKSB7XG5cdFx0dmFyIGJsb2JCdWlsZGVyLCB0aGF0ID0gdGhpcztcblxuXHRcdGZ1bmN0aW9uIGluaXQoY2FsbGJhY2spIHtcblx0XHRcdGJsb2JCdWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdFx0XHRjYWxsYmFjaygpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHdyaXRlVWludDhBcnJheShhcnJheSwgY2FsbGJhY2spIHtcblx0XHRcdGJsb2JCdWlsZGVyLmFwcGVuZChpc0FwcGVuZEFCVmlld1N1cHBvcnRlZCgpID8gYXJyYXkgOiBhcnJheS5idWZmZXIpO1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXREYXRhKGNhbGxiYWNrKSB7XG5cdFx0XHRjYWxsYmFjayhibG9iQnVpbGRlci5nZXRCbG9iKGNvbnRlbnRUeXBlKSk7XG5cdFx0fVxuXG5cdFx0dGhhdC5pbml0ID0gaW5pdDtcblx0XHR0aGF0LndyaXRlVWludDhBcnJheSA9IHdyaXRlVWludDhBcnJheTtcblx0XHR0aGF0LmdldERhdGEgPSBnZXREYXRhO1xuXHR9XG5cdEJsb2JXcml0ZXIucHJvdG90eXBlID0gbmV3IFdyaXRlcigpO1xuXHRCbG9iV3JpdGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJsb2JXcml0ZXI7XG5cbiAgICBmdW5jdGlvbiBBcnJheVdyaXRlcihzaXplKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgZnVuY3Rpb24gaW5pdChjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhhdC5idWZmZXIgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgICAgICAgICAgIHRoYXQub2Zmc2V0ID0gMDtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB3cml0ZVVpbnQ4QXJyYXkoYXJyYXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGF0LmJ1ZmZlci5zZXQoYXJyYXksIHRoYXQub2Zmc2V0KTtcbiAgICAgICAgICAgIHRoYXQub2Zmc2V0ICs9IGFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXREYXRhKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGF0LmJ1ZmZlcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGF0LmluaXQgPSBpbml0O1xuICAgICAgICB0aGF0LndyaXRlVWludDhBcnJheSA9IHdyaXRlVWludDhBcnJheTtcbiAgICAgICAgdGhhdC5nZXREYXRhID0gZ2V0RGF0YTtcbiAgICB9XG4gICAgQXJyYXlXcml0ZXIucHJvdG90eXBlID0gbmV3IFdyaXRlcigpO1xuICAgIEFycmF5V3JpdGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEFycmF5V3JpdGVyO1xuXG5cdC8vIGluZmxhdGUvZGVmbGF0ZSBjb3JlIGZ1bmN0aW9uc1xuXHRmdW5jdGlvbiBsYXVuY2hXb3JrZXJQcm9jZXNzKHdvcmtlciwgcmVhZGVyLCB3cml0ZXIsIG9mZnNldCwgc2l6ZSwgb25hcHBlbmQsIG9ucHJvZ3Jlc3MsIG9uZW5kLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKSB7XG5cdFx0dmFyIGNodW5rSW5kZXggPSAwLCBpbmRleCwgb3V0cHV0U2l6ZTtcblxuXHRcdGZ1bmN0aW9uIG9uZmx1c2goKSB7XG5cdFx0XHR3b3JrZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgb25tZXNzYWdlLCBmYWxzZSk7XG5cdFx0XHRvbmVuZChvdXRwdXRTaXplKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvbm1lc3NhZ2UoZXZlbnQpIHtcblx0XHRcdHZhciBtZXNzYWdlID0gZXZlbnQuZGF0YSwgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcblxuXHRcdFx0aWYgKG1lc3NhZ2Uub25hcHBlbmQpIHtcblx0XHRcdFx0b3V0cHV0U2l6ZSArPSBkYXRhLmxlbmd0aDtcblx0XHRcdFx0d3JpdGVyLndyaXRlVWludDhBcnJheShkYXRhLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRvbmFwcGVuZChmYWxzZSwgZGF0YSk7XG5cdFx0XHRcdFx0c3RlcCgpO1xuXHRcdFx0XHR9LCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKG1lc3NhZ2Uub25mbHVzaClcblx0XHRcdFx0aWYgKGRhdGEpIHtcblx0XHRcdFx0XHRvdXRwdXRTaXplICs9IGRhdGEubGVuZ3RoO1xuXHRcdFx0XHRcdHdyaXRlci53cml0ZVVpbnQ4QXJyYXkoZGF0YSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRvbmFwcGVuZChmYWxzZSwgZGF0YSk7XG5cdFx0XHRcdFx0XHRvbmZsdXNoKCk7XG5cdFx0XHRcdFx0fSwgb253cml0ZWVycm9yKTtcblx0XHRcdFx0fSBlbHNlXG5cdFx0XHRcdFx0b25mbHVzaCgpO1xuXHRcdFx0aWYgKG1lc3NhZ2UucHJvZ3Jlc3MgJiYgb25wcm9ncmVzcylcblx0XHRcdFx0b25wcm9ncmVzcyhpbmRleCArIG1lc3NhZ2UuY3VycmVudCwgc2l6ZSk7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gc3RlcCgpIHtcblx0XHRcdGluZGV4ID0gY2h1bmtJbmRleCAqIENIVU5LX1NJWkU7XG5cdFx0XHRpZiAoaW5kZXggPCBzaXplKVxuXHRcdFx0XHRyZWFkZXIucmVhZFVpbnQ4QXJyYXkob2Zmc2V0ICsgaW5kZXgsIE1hdGgubWluKENIVU5LX1NJWkUsIHNpemUgLSBpbmRleCksIGZ1bmN0aW9uKGFycmF5KSB7XG5cdFx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHRcdGFwcGVuZCA6IHRydWUsXG5cdFx0XHRcdFx0XHRkYXRhIDogYXJyYXlcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRjaHVua0luZGV4Kys7XG5cdFx0XHRcdFx0aWYgKG9ucHJvZ3Jlc3MpXG5cdFx0XHRcdFx0XHRvbnByb2dyZXNzKGluZGV4LCBzaXplKTtcblx0XHRcdFx0XHRvbmFwcGVuZCh0cnVlLCBhcnJheSk7XG5cdFx0XHRcdH0sIG9ucmVhZGVycm9yKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0d29ya2VyLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHRmbHVzaCA6IHRydWVcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0b3V0cHV0U2l6ZSA9IDA7XG5cdFx0d29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIG9ubWVzc2FnZSwgZmFsc2UpO1xuXHRcdHN0ZXAoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGxhdW5jaFByb2Nlc3MocHJvY2VzcywgcmVhZGVyLCB3cml0ZXIsIG9mZnNldCwgc2l6ZSwgb25hcHBlbmQsIG9ucHJvZ3Jlc3MsIG9uZW5kLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKSB7XG5cdFx0dmFyIGNodW5rSW5kZXggPSAwLCBpbmRleCwgb3V0cHV0U2l6ZSA9IDA7XG5cblx0XHRmdW5jdGlvbiBzdGVwKCkge1xuXHRcdFx0dmFyIG91dHB1dERhdGE7XG5cdFx0XHRpbmRleCA9IGNodW5rSW5kZXggKiBDSFVOS19TSVpFO1xuXHRcdFx0aWYgKGluZGV4IDwgc2l6ZSlcblx0XHRcdFx0cmVhZGVyLnJlYWRVaW50OEFycmF5KG9mZnNldCArIGluZGV4LCBNYXRoLm1pbihDSFVOS19TSVpFLCBzaXplIC0gaW5kZXgpLCBmdW5jdGlvbihpbnB1dERhdGEpIHtcblx0XHRcdFx0XHR2YXIgb3V0cHV0RGF0YSA9IHByb2Nlc3MuYXBwZW5kKGlucHV0RGF0YSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRpZiAob25wcm9ncmVzcylcblx0XHRcdFx0XHRcdFx0b25wcm9ncmVzcyhvZmZzZXQgKyBpbmRleCwgc2l6ZSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0b3V0cHV0U2l6ZSArPSBvdXRwdXREYXRhLmxlbmd0aDtcblx0XHRcdFx0XHRvbmFwcGVuZCh0cnVlLCBpbnB1dERhdGEpO1xuXHRcdFx0XHRcdHdyaXRlci53cml0ZVVpbnQ4QXJyYXkob3V0cHV0RGF0YSwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRvbmFwcGVuZChmYWxzZSwgb3V0cHV0RGF0YSk7XG5cdFx0XHRcdFx0XHRjaHVua0luZGV4Kys7XG5cdFx0XHRcdFx0XHRzZXRUaW1lb3V0KHN0ZXAsIDEpO1xuXHRcdFx0XHRcdH0sIG9ud3JpdGVlcnJvcik7XG5cdFx0XHRcdFx0aWYgKG9ucHJvZ3Jlc3MpXG5cdFx0XHRcdFx0XHRvbnByb2dyZXNzKGluZGV4LCBzaXplKTtcblx0XHRcdFx0fSwgb25yZWFkZXJyb3IpO1xuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdG91dHB1dERhdGEgPSBwcm9jZXNzLmZsdXNoKCk7XG5cdFx0XHRcdGlmIChvdXRwdXREYXRhKSB7XG5cdFx0XHRcdFx0b3V0cHV0U2l6ZSArPSBvdXRwdXREYXRhLmxlbmd0aDtcblx0XHRcdFx0XHR3cml0ZXIud3JpdGVVaW50OEFycmF5KG91dHB1dERhdGEsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0b25hcHBlbmQoZmFsc2UsIG91dHB1dERhdGEpO1xuXHRcdFx0XHRcdFx0b25lbmQob3V0cHV0U2l6ZSk7XG5cdFx0XHRcdFx0fSwgb253cml0ZWVycm9yKTtcblx0XHRcdFx0fSBlbHNlXG5cdFx0XHRcdFx0b25lbmQob3V0cHV0U2l6ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0c3RlcCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5mbGF0ZShyZWFkZXIsIHdyaXRlciwgb2Zmc2V0LCBzaXplLCBjb21wdXRlQ3JjMzIsIG9uZW5kLCBvbnByb2dyZXNzLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKSB7XG5cdFx0dmFyIHdvcmtlciwgY3JjMzIgPSBuZXcgQ3JjMzIoKTtcblxuXHRcdGZ1bmN0aW9uIG9uaW5mbGF0ZWFwcGVuZChzZW5kaW5nLCBhcnJheSkge1xuXHRcdFx0aWYgKGNvbXB1dGVDcmMzMiAmJiAhc2VuZGluZylcblx0XHRcdFx0Y3JjMzIuYXBwZW5kKGFycmF5KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvbmluZmxhdGVlbmQob3V0cHV0U2l6ZSkge1xuXHRcdFx0b25lbmQob3V0cHV0U2l6ZSwgY3JjMzIuZ2V0KCkpO1xuXHRcdH1cblxuXHRcdGlmIChvYmouemlwLnVzZVdlYldvcmtlcnMpIHtcblx0XHRcdHdvcmtlciA9IG5ldyBXb3JrZXIob2JqLnppcC53b3JrZXJTY3JpcHRzUGF0aCArIElORkxBVEVfSlMpO1xuXHRcdFx0bGF1bmNoV29ya2VyUHJvY2Vzcyh3b3JrZXIsIHJlYWRlciwgd3JpdGVyLCBvZmZzZXQsIHNpemUsIG9uaW5mbGF0ZWFwcGVuZCwgb25wcm9ncmVzcywgb25pbmZsYXRlZW5kLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKTtcblx0XHR9IGVsc2Vcblx0XHRcdGxhdW5jaFByb2Nlc3MobmV3IG9iai56aXAuSW5mbGF0ZXIoKSwgcmVhZGVyLCB3cml0ZXIsIG9mZnNldCwgc2l6ZSwgb25pbmZsYXRlYXBwZW5kLCBvbnByb2dyZXNzLCBvbmluZmxhdGVlbmQsIG9ucmVhZGVycm9yLCBvbndyaXRlZXJyb3IpO1xuXHRcdHJldHVybiB3b3JrZXI7XG5cdH1cblxuXHRmdW5jdGlvbiBkZWZsYXRlKHJlYWRlciwgd3JpdGVyLCBsZXZlbCwgb25lbmQsIG9ucHJvZ3Jlc3MsIG9ucmVhZGVycm9yLCBvbndyaXRlZXJyb3IpIHtcblx0XHR2YXIgd29ya2VyLCBjcmMzMiA9IG5ldyBDcmMzMigpO1xuXG5cdFx0ZnVuY3Rpb24gb25kZWZsYXRlYXBwZW5kKHNlbmRpbmcsIGFycmF5KSB7XG5cdFx0XHRpZiAoc2VuZGluZylcblx0XHRcdFx0Y3JjMzIuYXBwZW5kKGFycmF5KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvbmRlZmxhdGVlbmQob3V0cHV0U2l6ZSkge1xuXHRcdFx0b25lbmQob3V0cHV0U2l6ZSwgY3JjMzIuZ2V0KCkpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG9ubWVzc2FnZSgpIHtcblx0XHRcdHdvcmtlci5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBvbm1lc3NhZ2UsIGZhbHNlKTtcblx0XHRcdGxhdW5jaFdvcmtlclByb2Nlc3Mod29ya2VyLCByZWFkZXIsIHdyaXRlciwgMCwgcmVhZGVyLnNpemUsIG9uZGVmbGF0ZWFwcGVuZCwgb25wcm9ncmVzcywgb25kZWZsYXRlZW5kLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKTtcblx0XHR9XG5cblx0XHRpZiAob2JqLnppcC51c2VXZWJXb3JrZXJzKSB7XG5cdFx0XHR3b3JrZXIgPSBuZXcgV29ya2VyKG9iai56aXAud29ya2VyU2NyaXB0c1BhdGggKyBERUZMQVRFX0pTKTtcblx0XHRcdHdvcmtlci5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBvbm1lc3NhZ2UsIGZhbHNlKTtcblx0XHRcdHdvcmtlci5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdGluaXQgOiB0cnVlLFxuXHRcdFx0XHRsZXZlbCA6IGxldmVsXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Vcblx0XHRcdGxhdW5jaFByb2Nlc3MobmV3IG9iai56aXAuRGVmbGF0ZXIoKSwgcmVhZGVyLCB3cml0ZXIsIDAsIHJlYWRlci5zaXplLCBvbmRlZmxhdGVhcHBlbmQsIG9ucHJvZ3Jlc3MsIG9uZGVmbGF0ZWVuZCwgb25yZWFkZXJyb3IsIG9ud3JpdGVlcnJvcik7XG5cdFx0cmV0dXJuIHdvcmtlcjtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvcHkocmVhZGVyLCB3cml0ZXIsIG9mZnNldCwgc2l6ZSwgY29tcHV0ZUNyYzMyLCBvbmVuZCwgb25wcm9ncmVzcywgb25yZWFkZXJyb3IsIG9ud3JpdGVlcnJvcikge1xuXHRcdHZhciBjaHVua0luZGV4ID0gMCwgY3JjMzIgPSBuZXcgQ3JjMzIoKTtcblxuXHRcdGZ1bmN0aW9uIHN0ZXAoKSB7XG5cdFx0XHR2YXIgaW5kZXggPSBjaHVua0luZGV4ICogQ0hVTktfU0laRTtcblx0XHRcdGlmIChpbmRleCA8IHNpemUpXG5cdFx0XHRcdHJlYWRlci5yZWFkVWludDhBcnJheShvZmZzZXQgKyBpbmRleCwgTWF0aC5taW4oQ0hVTktfU0laRSwgc2l6ZSAtIGluZGV4KSwgZnVuY3Rpb24oYXJyYXkpIHtcblx0XHRcdFx0XHRpZiAoY29tcHV0ZUNyYzMyKVxuXHRcdFx0XHRcdFx0Y3JjMzIuYXBwZW5kKGFycmF5KTtcblx0XHRcdFx0XHRpZiAob25wcm9ncmVzcylcblx0XHRcdFx0XHRcdG9ucHJvZ3Jlc3MoaW5kZXgsIHNpemUsIGFycmF5KTtcblx0XHRcdFx0XHR3cml0ZXIud3JpdGVVaW50OEFycmF5KGFycmF5LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGNodW5rSW5kZXgrKztcblx0XHRcdFx0XHRcdHN0ZXAoKTtcblx0XHRcdFx0XHR9LCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0XHR9LCBvbnJlYWRlcnJvcik7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdG9uZW5kKHNpemUsIGNyYzMyLmdldCgpKTtcblx0XHR9XG5cblx0XHRzdGVwKCk7XG5cdH1cblxuXHQvLyBaaXBSZWFkZXJcblxuXHRmdW5jdGlvbiBkZWNvZGVBU0NJSShzdHIpIHtcblx0XHR2YXIgaSwgb3V0ID0gXCJcIiwgY2hhckNvZGUsIGV4dGVuZGVkQVNDSUkgPSBbICdcXHUwMEM3JywgJ1xcdTAwRkMnLCAnXFx1MDBFOScsICdcXHUwMEUyJywgJ1xcdTAwRTQnLCAnXFx1MDBFMCcsICdcXHUwMEU1JywgJ1xcdTAwRTcnLCAnXFx1MDBFQScsICdcXHUwMEVCJyxcblx0XHRcdFx0J1xcdTAwRTgnLCAnXFx1MDBFRicsICdcXHUwMEVFJywgJ1xcdTAwRUMnLCAnXFx1MDBDNCcsICdcXHUwMEM1JywgJ1xcdTAwQzknLCAnXFx1MDBFNicsICdcXHUwMEM2JywgJ1xcdTAwRjQnLCAnXFx1MDBGNicsICdcXHUwMEYyJywgJ1xcdTAwRkInLCAnXFx1MDBGOScsXG5cdFx0XHRcdCdcXHUwMEZGJywgJ1xcdTAwRDYnLCAnXFx1MDBEQycsICdcXHUwMEY4JywgJ1xcdTAwQTMnLCAnXFx1MDBEOCcsICdcXHUwMEQ3JywgJ1xcdTAxOTInLCAnXFx1MDBFMScsICdcXHUwMEVEJywgJ1xcdTAwRjMnLCAnXFx1MDBGQScsICdcXHUwMEYxJywgJ1xcdTAwRDEnLFxuXHRcdFx0XHQnXFx1MDBBQScsICdcXHUwMEJBJywgJ1xcdTAwQkYnLCAnXFx1MDBBRScsICdcXHUwMEFDJywgJ1xcdTAwQkQnLCAnXFx1MDBCQycsICdcXHUwMEExJywgJ1xcdTAwQUInLCAnXFx1MDBCQicsICdfJywgJ18nLCAnXycsICdcXHUwMEE2JywgJ1xcdTAwQTYnLFxuXHRcdFx0XHQnXFx1MDBDMScsICdcXHUwMEMyJywgJ1xcdTAwQzAnLCAnXFx1MDBBOScsICdcXHUwMEE2JywgJ1xcdTAwQTYnLCAnKycsICcrJywgJ1xcdTAwQTInLCAnXFx1MDBBNScsICcrJywgJysnLCAnLScsICctJywgJysnLCAnLScsICcrJywgJ1xcdTAwRTMnLFxuXHRcdFx0XHQnXFx1MDBDMycsICcrJywgJysnLCAnLScsICctJywgJ1xcdTAwQTYnLCAnLScsICcrJywgJ1xcdTAwQTQnLCAnXFx1MDBGMCcsICdcXHUwMEQwJywgJ1xcdTAwQ0EnLCAnXFx1MDBDQicsICdcXHUwMEM4JywgJ2knLCAnXFx1MDBDRCcsICdcXHUwMENFJyxcblx0XHRcdFx0J1xcdTAwQ0YnLCAnKycsICcrJywgJ18nLCAnXycsICdcXHUwMEE2JywgJ1xcdTAwQ0MnLCAnXycsICdcXHUwMEQzJywgJ1xcdTAwREYnLCAnXFx1MDBENCcsICdcXHUwMEQyJywgJ1xcdTAwRjUnLCAnXFx1MDBENScsICdcXHUwMEI1JywgJ1xcdTAwRkUnLFxuXHRcdFx0XHQnXFx1MDBERScsICdcXHUwMERBJywgJ1xcdTAwREInLCAnXFx1MDBEOScsICdcXHUwMEZEJywgJ1xcdTAwREQnLCAnXFx1MDBBRicsICdcXHUwMEI0JywgJ1xcdTAwQUQnLCAnXFx1MDBCMScsICdfJywgJ1xcdTAwQkUnLCAnXFx1MDBCNicsICdcXHUwMEE3Jyxcblx0XHRcdFx0J1xcdTAwRjcnLCAnXFx1MDBCOCcsICdcXHUwMEIwJywgJ1xcdTAwQTgnLCAnXFx1MDBCNycsICdcXHUwMEI5JywgJ1xcdTAwQjMnLCAnXFx1MDBCMicsICdfJywgJyAnIF07XG5cdFx0Zm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y2hhckNvZGUgPSBzdHIuY2hhckNvZGVBdChpKSAmIDB4RkY7XG5cdFx0XHRpZiAoY2hhckNvZGUgPiAxMjcpXG5cdFx0XHRcdG91dCArPSBleHRlbmRlZEFTQ0lJW2NoYXJDb2RlIC0gMTI4XTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0b3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpO1xuXHRcdH1cblx0XHRyZXR1cm4gb3V0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZGVjb2RlVVRGOChzdHJfZGF0YSkge1xuXHRcdHZhciB0bXBfYXJyID0gW10sIGkgPSAwLCBhYyA9IDAsIGMxID0gMCwgYzIgPSAwLCBjMyA9IDA7XG5cblx0XHRzdHJfZGF0YSArPSAnJztcblxuXHRcdHdoaWxlIChpIDwgc3RyX2RhdGEubGVuZ3RoKSB7XG5cdFx0XHRjMSA9IHN0cl9kYXRhLmNoYXJDb2RlQXQoaSk7XG5cdFx0XHRpZiAoYzEgPCAxMjgpIHtcblx0XHRcdFx0dG1wX2FyclthYysrXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYzEpO1xuXHRcdFx0XHRpKys7XG5cdFx0XHR9IGVsc2UgaWYgKGMxID4gMTkxICYmIGMxIDwgMjI0KSB7XG5cdFx0XHRcdGMyID0gc3RyX2RhdGEuY2hhckNvZGVBdChpICsgMSk7XG5cdFx0XHRcdHRtcF9hcnJbYWMrK10gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYzEgJiAzMSkgPDwgNikgfCAoYzIgJiA2MykpO1xuXHRcdFx0XHRpICs9IDI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjMiA9IHN0cl9kYXRhLmNoYXJDb2RlQXQoaSArIDEpO1xuXHRcdFx0XHRjMyA9IHN0cl9kYXRhLmNoYXJDb2RlQXQoaSArIDIpO1xuXHRcdFx0XHR0bXBfYXJyW2FjKytdID0gU3RyaW5nLmZyb21DaGFyQ29kZSgoKGMxICYgMTUpIDw8IDEyKSB8ICgoYzIgJiA2MykgPDwgNikgfCAoYzMgJiA2MykpO1xuXHRcdFx0XHRpICs9IDM7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRtcF9hcnIuam9pbignJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTdHJpbmcoYnl0ZXMpIHtcblx0XHR2YXIgaSwgc3RyID0gXCJcIjtcblx0XHRmb3IgKGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpKyspXG5cdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSk7XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldERhdGUodGltZVJhdykge1xuXHRcdHZhciBkYXRlID0gKHRpbWVSYXcgJiAweGZmZmYwMDAwKSA+PiAxNiwgdGltZSA9IHRpbWVSYXcgJiAweDAwMDBmZmZmO1xuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gbmV3IERhdGUoMTk4MCArICgoZGF0ZSAmIDB4RkUwMCkgPj4gOSksICgoZGF0ZSAmIDB4MDFFMCkgPj4gNSkgLSAxLCBkYXRlICYgMHgwMDFGLCAodGltZSAmIDB4RjgwMCkgPj4gMTEsICh0aW1lICYgMHgwN0UwKSA+PiA1LFxuXHRcdFx0XHRcdCh0aW1lICYgMHgwMDFGKSAqIDIsIDApO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiByZWFkQ29tbW9uSGVhZGVyKGVudHJ5LCBkYXRhLCBpbmRleCwgY2VudHJhbERpcmVjdG9yeSwgb25lcnJvcikge1xuXHRcdGVudHJ5LnZlcnNpb24gPSBkYXRhLnZpZXcuZ2V0VWludDE2KGluZGV4LCB0cnVlKTtcblx0XHRlbnRyeS5iaXRGbGFnID0gZGF0YS52aWV3LmdldFVpbnQxNihpbmRleCArIDIsIHRydWUpO1xuXHRcdGVudHJ5LmNvbXByZXNzaW9uTWV0aG9kID0gZGF0YS52aWV3LmdldFVpbnQxNihpbmRleCArIDQsIHRydWUpO1xuXHRcdGVudHJ5Lmxhc3RNb2REYXRlUmF3ID0gZGF0YS52aWV3LmdldFVpbnQzMihpbmRleCArIDYsIHRydWUpO1xuXHRcdGVudHJ5Lmxhc3RNb2REYXRlID0gZ2V0RGF0ZShlbnRyeS5sYXN0TW9kRGF0ZVJhdyk7XG5cdFx0aWYgKChlbnRyeS5iaXRGbGFnICYgMHgwMSkgPT09IDB4MDEpIHtcblx0XHRcdG9uZXJyb3IoRVJSX0VOQ1JZUFRFRCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmIChjZW50cmFsRGlyZWN0b3J5IHx8IChlbnRyeS5iaXRGbGFnICYgMHgwMDA4KSAhPSAweDAwMDgpIHtcblx0XHRcdGVudHJ5LmNyYzMyID0gZGF0YS52aWV3LmdldFVpbnQzMihpbmRleCArIDEwLCB0cnVlKTtcblx0XHRcdGVudHJ5LmNvbXByZXNzZWRTaXplID0gZGF0YS52aWV3LmdldFVpbnQzMihpbmRleCArIDE0LCB0cnVlKTtcblx0XHRcdGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPSBkYXRhLnZpZXcuZ2V0VWludDMyKGluZGV4ICsgMTgsIHRydWUpO1xuXHRcdH1cblx0XHRpZiAoZW50cnkuY29tcHJlc3NlZFNpemUgPT09IDB4RkZGRkZGRkYgfHwgZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9PT0gMHhGRkZGRkZGRikge1xuXHRcdFx0b25lcnJvcihFUlJfWklQNjQpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRlbnRyeS5maWxlbmFtZUxlbmd0aCA9IGRhdGEudmlldy5nZXRVaW50MTYoaW5kZXggKyAyMiwgdHJ1ZSk7XG5cdFx0ZW50cnkuZXh0cmFGaWVsZExlbmd0aCA9IGRhdGEudmlldy5nZXRVaW50MTYoaW5kZXggKyAyNCwgdHJ1ZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjcmVhdGVaaXBSZWFkZXIocmVhZGVyLCBvbmVycm9yKSB7XG5cdFx0ZnVuY3Rpb24gRW50cnkoKSB7XG5cdFx0fVxuXG5cdFx0RW50cnkucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbih3cml0ZXIsIG9uZW5kLCBvbnByb2dyZXNzLCBjaGVja0NyYzMyKSB7XG5cdFx0XHR2YXIgdGhhdCA9IHRoaXMsIHdvcmtlcjtcblxuXHRcdFx0ZnVuY3Rpb24gdGVybWluYXRlKGNhbGxiYWNrLCBwYXJhbSkge1xuXHRcdFx0XHRpZiAod29ya2VyKVxuXHRcdFx0XHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcblx0XHRcdFx0d29ya2VyID0gbnVsbDtcblx0XHRcdFx0aWYgKGNhbGxiYWNrKVxuXHRcdFx0XHRcdGNhbGxiYWNrKHBhcmFtKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gdGVzdENyYzMyKGNyYzMyKSB7XG5cdFx0XHRcdHZhciBkYXRhQ3JjMzIgPSBnZXREYXRhSGVscGVyKDQpO1xuXHRcdFx0XHRkYXRhQ3JjMzIudmlldy5zZXRVaW50MzIoMCwgY3JjMzIpO1xuXHRcdFx0XHRyZXR1cm4gdGhhdC5jcmMzMiA9PSBkYXRhQ3JjMzIudmlldy5nZXRVaW50MzIoMCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGdldFdyaXRlckRhdGEodW5jb21wcmVzc2VkU2l6ZSwgY3JjMzIpIHtcblx0XHRcdFx0aWYgKGNoZWNrQ3JjMzIgJiYgIXRlc3RDcmMzMihjcmMzMikpXG5cdFx0XHRcdFx0b25yZWFkZXJyb3IoKTtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHdyaXRlci5nZXREYXRhKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHRcdHRlcm1pbmF0ZShvbmVuZCwgZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIG9ucmVhZGVycm9yKCkge1xuXHRcdFx0XHR0ZXJtaW5hdGUob25lcnJvciwgRVJSX1JFQURfREFUQSk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIG9ud3JpdGVlcnJvcigpIHtcblx0XHRcdFx0dGVybWluYXRlKG9uZXJyb3IsIEVSUl9XUklURV9EQVRBKTtcblx0XHRcdH1cblxuXHRcdFx0cmVhZGVyLnJlYWRVaW50OEFycmF5KHRoYXQub2Zmc2V0LCAzMCwgZnVuY3Rpb24oYnl0ZXMpIHtcblx0XHRcdFx0dmFyIGRhdGEgPSBnZXREYXRhSGVscGVyKGJ5dGVzLmxlbmd0aCwgYnl0ZXMpLCBkYXRhT2Zmc2V0O1xuXHRcdFx0XHRpZiAoZGF0YS52aWV3LmdldFVpbnQzMigwKSAhPSAweDUwNGIwMzA0KSB7XG5cdFx0XHRcdFx0b25lcnJvcihFUlJfQkFEX0ZPUk1BVCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlYWRDb21tb25IZWFkZXIodGhhdCwgZGF0YSwgNCwgZmFsc2UsIGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdFx0b25lcnJvcihlcnJvcik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0ZGF0YU9mZnNldCA9IHRoYXQub2Zmc2V0ICsgMzAgKyB0aGF0LmZpbGVuYW1lTGVuZ3RoICsgdGhhdC5leHRyYUZpZWxkTGVuZ3RoO1xuXHRcdFx0XHR3cml0ZXIuaW5pdChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAodGhhdC5jb21wcmVzc2lvbk1ldGhvZCA9PT0gMClcblx0XHRcdFx0XHRcdGNvcHkocmVhZGVyLCB3cml0ZXIsIGRhdGFPZmZzZXQsIHRoYXQuY29tcHJlc3NlZFNpemUsIGNoZWNrQ3JjMzIsIGdldFdyaXRlckRhdGEsIG9ucHJvZ3Jlc3MsIG9ucmVhZGVycm9yLCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHdvcmtlciA9IGluZmxhdGUocmVhZGVyLCB3cml0ZXIsIGRhdGFPZmZzZXQsIHRoYXQuY29tcHJlc3NlZFNpemUsIGNoZWNrQ3JjMzIsIGdldFdyaXRlckRhdGEsIG9ucHJvZ3Jlc3MsIG9ucmVhZGVycm9yLCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0XHR9LCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0fSwgb25yZWFkZXJyb3IpO1xuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBzZWVrRU9DRFIob2Zmc2V0LCBlbnRyaWVzQ2FsbGJhY2spIHtcblx0XHRcdHJlYWRlci5yZWFkVWludDhBcnJheShyZWFkZXIuc2l6ZSAtIG9mZnNldCwgb2Zmc2V0LCBmdW5jdGlvbihieXRlcykge1xuXHRcdFx0XHR2YXIgZGF0YVZpZXcgPSBnZXREYXRhSGVscGVyKGJ5dGVzLmxlbmd0aCwgYnl0ZXMpLnZpZXc7XG5cdFx0XHRcdGlmIChkYXRhVmlldy5nZXRVaW50MzIoMCkgIT0gMHg1MDRiMDUwNikge1xuXHRcdFx0XHRcdHNlZWtFT0NEUihvZmZzZXQrMSwgZW50cmllc0NhbGxiYWNrKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRlbnRyaWVzQ2FsbGJhY2soZGF0YVZpZXcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0b25lcnJvcihFUlJfUkVBRCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHtcblx0XHRcdGdldEVudHJpZXMgOiBmdW5jdGlvbihjYWxsYmFjaykge1xuXHRcdFx0XHRpZiAocmVhZGVyLnNpemUgPCAyMikge1xuXHRcdFx0XHRcdG9uZXJyb3IoRVJSX0JBRF9GT1JNQVQpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBsb29rIGZvciBFbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkXG5cdFx0XHRcdHNlZWtFT0NEUigyMiwgZnVuY3Rpb24oZGF0YVZpZXcpIHtcblx0XHRcdFx0XHRkYXRhbGVuZ3RoID0gZGF0YVZpZXcuZ2V0VWludDMyKDE2LCB0cnVlKTtcblx0XHRcdFx0XHRmaWxlc2xlbmd0aCA9IGRhdGFWaWV3LmdldFVpbnQxNig4LCB0cnVlKTtcblx0XHRcdFx0XHRyZWFkZXIucmVhZFVpbnQ4QXJyYXkoZGF0YWxlbmd0aCwgcmVhZGVyLnNpemUgLSBkYXRhbGVuZ3RoLCBmdW5jdGlvbihieXRlcykge1xuXHRcdFx0XHRcdFx0dmFyIGksIGluZGV4ID0gMCwgZW50cmllcyA9IFtdLCBlbnRyeSwgZmlsZW5hbWUsIGNvbW1lbnQsIGRhdGEgPSBnZXREYXRhSGVscGVyKGJ5dGVzLmxlbmd0aCwgYnl0ZXMpO1xuXHRcdFx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGZpbGVzbGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRcdFx0ZW50cnkgPSBuZXcgRW50cnkoKTtcblx0XHRcdFx0XHRcdFx0aWYgKGRhdGEudmlldy5nZXRVaW50MzIoaW5kZXgpICE9IDB4NTA0YjAxMDIpIHtcblx0XHRcdFx0XHRcdFx0XHRvbmVycm9yKEVSUl9CQURfRk9STUFUKTtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmVhZENvbW1vbkhlYWRlcihlbnRyeSwgZGF0YSwgaW5kZXggKyA2LCB0cnVlLCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRcdFx0XHRcdG9uZXJyb3IoZXJyb3IpO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGVudHJ5LmNvbW1lbnRMZW5ndGggPSBkYXRhLnZpZXcuZ2V0VWludDE2KGluZGV4ICsgMzIsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRlbnRyeS5kaXJlY3RvcnkgPSAoKGRhdGEudmlldy5nZXRVaW50OChpbmRleCArIDM4KSAmIDB4MTApID09IDB4MTApO1xuXHRcdFx0XHRcdFx0XHRlbnRyeS5vZmZzZXQgPSBkYXRhLnZpZXcuZ2V0VWludDMyKGluZGV4ICsgNDIsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZSA9IGdldFN0cmluZyhkYXRhLmFycmF5LnN1YmFycmF5KGluZGV4ICsgNDYsIGluZGV4ICsgNDYgKyBlbnRyeS5maWxlbmFtZUxlbmd0aCkpO1xuXHRcdFx0XHRcdFx0XHRlbnRyeS5maWxlbmFtZSA9ICgoZW50cnkuYml0RmxhZyAmIDB4MDgwMCkgPT09IDB4MDgwMCkgPyBkZWNvZGVVVEY4KGZpbGVuYW1lKSA6IGRlY29kZUFTQ0lJKGZpbGVuYW1lKTtcblx0XHRcdFx0XHRcdFx0aWYgKCFlbnRyeS5kaXJlY3RvcnkgJiYgZW50cnkuZmlsZW5hbWUuY2hhckF0KGVudHJ5LmZpbGVuYW1lLmxlbmd0aCAtIDEpID09IFwiL1wiKVxuXHRcdFx0XHRcdFx0XHRcdGVudHJ5LmRpcmVjdG9yeSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdGNvbW1lbnQgPSBnZXRTdHJpbmcoZGF0YS5hcnJheS5zdWJhcnJheShpbmRleCArIDQ2ICsgZW50cnkuZmlsZW5hbWVMZW5ndGggKyBlbnRyeS5leHRyYUZpZWxkTGVuZ3RoLCBpbmRleCArIDQ2XG5cdFx0XHRcdFx0XHRcdFx0XHQrIGVudHJ5LmZpbGVuYW1lTGVuZ3RoICsgZW50cnkuZXh0cmFGaWVsZExlbmd0aCArIGVudHJ5LmNvbW1lbnRMZW5ndGgpKTtcblx0XHRcdFx0XHRcdFx0ZW50cnkuY29tbWVudCA9ICgoZW50cnkuYml0RmxhZyAmIDB4MDgwMCkgPT09IDB4MDgwMCkgPyBkZWNvZGVVVEY4KGNvbW1lbnQpIDogZGVjb2RlQVNDSUkoY29tbWVudCk7XG5cdFx0XHRcdFx0XHRcdGVudHJpZXMucHVzaChlbnRyeSk7XG5cdFx0XHRcdFx0XHRcdGluZGV4ICs9IDQ2ICsgZW50cnkuZmlsZW5hbWVMZW5ndGggKyBlbnRyeS5leHRyYUZpZWxkTGVuZ3RoICsgZW50cnkuY29tbWVudExlbmd0aDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGNhbGxiYWNrKGVudHJpZXMpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0b25lcnJvcihFUlJfUkVBRCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSxcblx0XHRcdGNsb3NlIDogZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdFx0aWYgKGNhbGxiYWNrKVxuXHRcdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdC8vIFppcFdyaXRlclxuXG5cdGZ1bmN0aW9uIGVuY29kZVVURjgoc3RyaW5nKSB7XG5cdFx0dmFyIG4sIGMxLCBlbmMsIHV0ZnRleHQgPSBbXSwgc3RhcnQgPSAwLCBlbmQgPSAwLCBzdHJpbmdsID0gc3RyaW5nLmxlbmd0aDtcblx0XHRmb3IgKG4gPSAwOyBuIDwgc3RyaW5nbDsgbisrKSB7XG5cdFx0XHRjMSA9IHN0cmluZy5jaGFyQ29kZUF0KG4pO1xuXHRcdFx0ZW5jID0gbnVsbDtcblx0XHRcdGlmIChjMSA8IDEyOClcblx0XHRcdFx0ZW5kKys7XG5cdFx0XHRlbHNlIGlmIChjMSA+IDEyNyAmJiBjMSA8IDIwNDgpXG5cdFx0XHRcdGVuYyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoKGMxID4+IDYpIHwgMTkyKSArIFN0cmluZy5mcm9tQ2hhckNvZGUoKGMxICYgNjMpIHwgMTI4KTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0ZW5jID0gU3RyaW5nLmZyb21DaGFyQ29kZSgoYzEgPj4gMTIpIHwgMjI0KSArIFN0cmluZy5mcm9tQ2hhckNvZGUoKChjMSA+PiA2KSAmIDYzKSB8IDEyOCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKChjMSAmIDYzKSB8IDEyOCk7XG5cdFx0XHRpZiAoZW5jICE9IG51bGwpIHtcblx0XHRcdFx0aWYgKGVuZCA+IHN0YXJ0KVxuXHRcdFx0XHRcdHV0ZnRleHQgKz0gc3RyaW5nLnNsaWNlKHN0YXJ0LCBlbmQpO1xuXHRcdFx0XHR1dGZ0ZXh0ICs9IGVuYztcblx0XHRcdFx0c3RhcnQgPSBlbmQgPSBuICsgMTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKGVuZCA+IHN0YXJ0KVxuXHRcdFx0dXRmdGV4dCArPSBzdHJpbmcuc2xpY2Uoc3RhcnQsIHN0cmluZ2wpO1xuXHRcdHJldHVybiB1dGZ0ZXh0O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Qnl0ZXMoc3RyKSB7XG5cdFx0dmFyIGksIGFycmF5ID0gW107XG5cdFx0Zm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKylcblx0XHRcdGFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkpO1xuXHRcdHJldHVybiBhcnJheTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNyZWF0ZVppcFdyaXRlcih3cml0ZXIsIG9uZXJyb3IsIGRvbnREZWZsYXRlKSB7XG5cdFx0dmFyIHdvcmtlciwgZmlsZXMgPSBbXSwgZmlsZW5hbWVzID0gW10sIGRhdGFsZW5ndGggPSAwO1xuXG5cdFx0ZnVuY3Rpb24gdGVybWluYXRlKGNhbGxiYWNrLCBtZXNzYWdlKSB7XG5cdFx0XHRpZiAod29ya2VyKVxuXHRcdFx0XHR3b3JrZXIudGVybWluYXRlKCk7XG5cdFx0XHR3b3JrZXIgPSBudWxsO1xuXHRcdFx0aWYgKGNhbGxiYWNrKVxuXHRcdFx0XHRjYWxsYmFjayhtZXNzYWdlKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvbndyaXRlZXJyb3IoKSB7XG5cdFx0XHR0ZXJtaW5hdGUob25lcnJvciwgRVJSX1dSSVRFKTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBvbnJlYWRlcnJvcigpIHtcblx0XHRcdHRlcm1pbmF0ZShvbmVycm9yLCBFUlJfUkVBRF9EQVRBKTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0YWRkIDogZnVuY3Rpb24obmFtZSwgcmVhZGVyLCBvbmVuZCwgb25wcm9ncmVzcywgb3B0aW9ucykge1xuXHRcdFx0XHR2YXIgaGVhZGVyLCBmaWxlbmFtZSwgZGF0ZTtcblxuXHRcdFx0XHRmdW5jdGlvbiB3cml0ZUhlYWRlcihjYWxsYmFjaykge1xuXHRcdFx0XHRcdHZhciBkYXRhO1xuXHRcdFx0XHRcdGRhdGUgPSBvcHRpb25zLmxhc3RNb2REYXRlIHx8IG5ldyBEYXRlKCk7XG5cdFx0XHRcdFx0aGVhZGVyID0gZ2V0RGF0YUhlbHBlcigyNik7XG5cdFx0XHRcdFx0ZmlsZXNbbmFtZV0gPSB7XG5cdFx0XHRcdFx0XHRoZWFkZXJBcnJheSA6IGhlYWRlci5hcnJheSxcblx0XHRcdFx0XHRcdGRpcmVjdG9yeSA6IG9wdGlvbnMuZGlyZWN0b3J5LFxuXHRcdFx0XHRcdFx0ZmlsZW5hbWUgOiBmaWxlbmFtZSxcblx0XHRcdFx0XHRcdG9mZnNldCA6IGRhdGFsZW5ndGgsXG5cdFx0XHRcdFx0XHRjb21tZW50IDogZ2V0Qnl0ZXMoZW5jb2RlVVRGOChvcHRpb25zLmNvbW1lbnQgfHwgXCJcIikpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MzIoMCwgMHgxNDAwMDgwOCk7XG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMudmVyc2lvbilcblx0XHRcdFx0XHRcdGhlYWRlci52aWV3LnNldFVpbnQ4KDAsIG9wdGlvbnMudmVyc2lvbik7XG5cdFx0XHRcdFx0aWYgKCFkb250RGVmbGF0ZSAmJiBvcHRpb25zLmxldmVsICE9IDApXG5cdFx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MTYoNCwgMHgwODAwKTtcblx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MTYoNiwgKCgoZGF0ZS5nZXRIb3VycygpIDw8IDYpIHwgZGF0ZS5nZXRNaW51dGVzKCkpIDw8IDUpIHwgZGF0ZS5nZXRTZWNvbmRzKCkgLyAyLCB0cnVlKTtcblx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MTYoOCwgKCgoKGRhdGUuZ2V0RnVsbFllYXIoKSAtIDE5ODApIDw8IDQpIHwgKGRhdGUuZ2V0TW9udGgoKSArIDEpKSA8PCA1KSB8IGRhdGUuZ2V0RGF0ZSgpLCB0cnVlKTtcblx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MTYoMjIsIGZpbGVuYW1lLmxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdFx0ZGF0YSA9IGdldERhdGFIZWxwZXIoMzAgKyBmaWxlbmFtZS5sZW5ndGgpO1xuXHRcdFx0XHRcdGRhdGEudmlldy5zZXRVaW50MzIoMCwgMHg1MDRiMDMwNCk7XG5cdFx0XHRcdFx0ZGF0YS5hcnJheS5zZXQoaGVhZGVyLmFycmF5LCA0KTtcblx0XHRcdFx0XHRkYXRhLmFycmF5LnNldChbXSwgMzApOyAvLyBGSVhNRTogcmVtb3ZlIHdoZW4gY2hyb21lIDE4IHdpbGwgYmUgc3RhYmxlICgxNDogT0ssIDE2OiBLTywgMTc6IE9LKVxuXHRcdFx0XHRcdGRhdGEuYXJyYXkuc2V0KGZpbGVuYW1lLCAzMCk7XG5cdFx0XHRcdFx0ZGF0YWxlbmd0aCArPSBkYXRhLmFycmF5Lmxlbmd0aDtcblx0XHRcdFx0XHR3cml0ZXIud3JpdGVVaW50OEFycmF5KGRhdGEuYXJyYXksIGNhbGxiYWNrLCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZnVuY3Rpb24gd3JpdGVGb290ZXIoY29tcHJlc3NlZExlbmd0aCwgY3JjMzIpIHtcblx0XHRcdFx0XHR2YXIgZm9vdGVyID0gZ2V0RGF0YUhlbHBlcigxNik7XG5cdFx0XHRcdFx0ZGF0YWxlbmd0aCArPSBjb21wcmVzc2VkTGVuZ3RoIHx8IDA7XG5cdFx0XHRcdFx0Zm9vdGVyLnZpZXcuc2V0VWludDMyKDAsIDB4NTA0YjA3MDgpO1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgY3JjMzIgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRcdFx0aGVhZGVyLnZpZXcuc2V0VWludDMyKDEwLCBjcmMzMiwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRmb290ZXIudmlldy5zZXRVaW50MzIoNCwgY3JjMzIsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAocmVhZGVyKSB7XG5cdFx0XHRcdFx0XHRmb290ZXIudmlldy5zZXRVaW50MzIoOCwgY29tcHJlc3NlZExlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MzIoMTQsIGNvbXByZXNzZWRMZW5ndGgsIHRydWUpO1xuXHRcdFx0XHRcdFx0Zm9vdGVyLnZpZXcuc2V0VWludDMyKDEyLCByZWFkZXIuc2l6ZSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRoZWFkZXIudmlldy5zZXRVaW50MzIoMTgsIHJlYWRlci5zaXplLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0d3JpdGVyLndyaXRlVWludDhBcnJheShmb290ZXIuYXJyYXksIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZGF0YWxlbmd0aCArPSAxNjtcblx0XHRcdFx0XHRcdHRlcm1pbmF0ZShvbmVuZCk7XG5cdFx0XHRcdFx0fSwgb253cml0ZWVycm9yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZ1bmN0aW9uIHdyaXRlRmlsZSgpIHtcblx0XHRcdFx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRcdFx0XHRuYW1lID0gbmFtZS50cmltKCk7XG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMuZGlyZWN0b3J5ICYmIG5hbWUuY2hhckF0KG5hbWUubGVuZ3RoIC0gMSkgIT0gXCIvXCIpXG5cdFx0XHRcdFx0XHRuYW1lICs9IFwiL1wiO1xuXHRcdFx0XHRcdGlmIChmaWxlc1tuYW1lXSlcblx0XHRcdFx0XHRcdHRocm93IEVSUl9EVVBMSUNBVEVEX05BTUU7XG5cdFx0XHRcdFx0ZmlsZW5hbWUgPSBnZXRCeXRlcyhlbmNvZGVVVEY4KG5hbWUpKTtcblx0XHRcdFx0XHRmaWxlbmFtZXMucHVzaChuYW1lKTtcblx0XHRcdFx0XHR3cml0ZUhlYWRlcihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGlmIChyZWFkZXIpXG5cdFx0XHRcdFx0XHRcdGlmIChkb250RGVmbGF0ZSB8fCBvcHRpb25zLmxldmVsID09IDApXG5cdFx0XHRcdFx0XHRcdFx0Y29weShyZWFkZXIsIHdyaXRlciwgMCwgcmVhZGVyLnNpemUsIHRydWUsIHdyaXRlRm9vdGVyLCBvbnByb2dyZXNzLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKTtcblx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRcdHdvcmtlciA9IGRlZmxhdGUocmVhZGVyLCB3cml0ZXIsIG9wdGlvbnMubGV2ZWwsIHdyaXRlRm9vdGVyLCBvbnByb2dyZXNzLCBvbnJlYWRlcnJvciwgb253cml0ZWVycm9yKTtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0d3JpdGVGb290ZXIoKTtcblx0XHRcdFx0XHR9LCBvbndyaXRlZXJyb3IpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHJlYWRlcilcblx0XHRcdFx0XHRyZWFkZXIuaW5pdCh3cml0ZUZpbGUsIG9ucmVhZGVycm9yKTtcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHdyaXRlRmlsZSgpO1xuXHRcdFx0fSxcblx0XHRcdGNsb3NlIDogZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdFx0dmFyIGRhdGEsIGxlbmd0aCA9IDAsIGluZGV4ID0gMDtcblx0XHRcdFx0ZmlsZW5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0XHRcdHZhciBmaWxlID0gZmlsZXNbbmFtZV07XG5cdFx0XHRcdFx0bGVuZ3RoICs9IDQ2ICsgZmlsZS5maWxlbmFtZS5sZW5ndGggKyBmaWxlLmNvbW1lbnQubGVuZ3RoO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0ZGF0YSA9IGdldERhdGFIZWxwZXIobGVuZ3RoICsgMjIpO1xuXHRcdFx0XHRmaWxlbmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHRcdFx0dmFyIGZpbGUgPSBmaWxlc1tuYW1lXTtcblx0XHRcdFx0XHRkYXRhLnZpZXcuc2V0VWludDMyKGluZGV4LCAweDUwNGIwMTAyKTtcblx0XHRcdFx0XHRkYXRhLnZpZXcuc2V0VWludDE2KGluZGV4ICsgNCwgMHgxNDAwKTtcblx0XHRcdFx0XHRkYXRhLmFycmF5LnNldChmaWxlLmhlYWRlckFycmF5LCBpbmRleCArIDYpO1xuXHRcdFx0XHRcdGRhdGEudmlldy5zZXRVaW50MTYoaW5kZXggKyAzMiwgZmlsZS5jb21tZW50Lmxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdFx0aWYgKGZpbGUuZGlyZWN0b3J5KVxuXHRcdFx0XHRcdFx0ZGF0YS52aWV3LnNldFVpbnQ4KGluZGV4ICsgMzgsIDB4MTApO1xuXHRcdFx0XHRcdGRhdGEudmlldy5zZXRVaW50MzIoaW5kZXggKyA0MiwgZmlsZS5vZmZzZXQsIHRydWUpO1xuXHRcdFx0XHRcdGRhdGEuYXJyYXkuc2V0KGZpbGUuZmlsZW5hbWUsIGluZGV4ICsgNDYpO1xuXHRcdFx0XHRcdGRhdGEuYXJyYXkuc2V0KGZpbGUuY29tbWVudCwgaW5kZXggKyA0NiArIGZpbGUuZmlsZW5hbWUubGVuZ3RoKTtcblx0XHRcdFx0XHRpbmRleCArPSA0NiArIGZpbGUuZmlsZW5hbWUubGVuZ3RoICsgZmlsZS5jb21tZW50Lmxlbmd0aDtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGRhdGEudmlldy5zZXRVaW50MzIoaW5kZXgsIDB4NTA0YjA1MDYpO1xuXHRcdFx0XHRkYXRhLnZpZXcuc2V0VWludDE2KGluZGV4ICsgOCwgZmlsZW5hbWVzLmxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdGRhdGEudmlldy5zZXRVaW50MTYoaW5kZXggKyAxMCwgZmlsZW5hbWVzLmxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdGRhdGEudmlldy5zZXRVaW50MzIoaW5kZXggKyAxMiwgbGVuZ3RoLCB0cnVlKTtcblx0XHRcdFx0ZGF0YS52aWV3LnNldFVpbnQzMihpbmRleCArIDE2LCBkYXRhbGVuZ3RoLCB0cnVlKTtcblx0XHRcdFx0d3JpdGVyLndyaXRlVWludDhBcnJheShkYXRhLmFycmF5LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHR0ZXJtaW5hdGUoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR3cml0ZXIuZ2V0RGF0YShjYWxsYmFjayk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0sIG9ud3JpdGVlcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblx0fVxuXG5cdGlmICh0eXBlb2YgQmxvYkJ1aWxkZXIgPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdEJsb2JCdWlsZGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgdGhhdCA9IHRoaXMsIGJsb2JQYXJ0cztcblxuXHRcdFx0ZnVuY3Rpb24gaW5pdEJsb2JQYXJ0cygpIHtcblx0XHRcdFx0aWYgKCFibG9iUGFydHMpIHtcblx0XHRcdFx0XHRibG9iUGFydHMgPSBbIG5ldyBCbG9iKCkgXVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHRoYXQuYXBwZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRpbml0QmxvYlBhcnRzKCk7XG5cdFx0XHRcdGJsb2JQYXJ0cy5wdXNoKGRhdGEpO1xuXHRcdFx0fTtcblx0XHRcdHRoYXQuZ2V0QmxvYiA9IGZ1bmN0aW9uKGNvbnRlbnRUeXBlKSB7XG5cdFx0XHRcdGluaXRCbG9iUGFydHMoKTtcblx0XHRcdFx0aWYgKGJsb2JQYXJ0cy5sZW5ndGggPiAxIHx8IGJsb2JQYXJ0c1swXS50eXBlICE9IGNvbnRlbnRUeXBlKSB7XG5cdFx0XHRcdFx0YmxvYlBhcnRzID0gWyBjb250ZW50VHlwZSA/IG5ldyBCbG9iKGJsb2JQYXJ0cywge1xuXHRcdFx0XHRcdFx0dHlwZSA6IGNvbnRlbnRUeXBlXG5cdFx0XHRcdFx0fSkgOiBuZXcgQmxvYihibG9iUGFydHMpIF07XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGJsb2JQYXJ0c1swXTtcblx0XHRcdH07XG5cdFx0fTtcblx0fVxuXG5cdG9iai56aXAgPSB7XG5cdFx0UmVhZGVyIDogUmVhZGVyLFxuXHRcdFdyaXRlciA6IFdyaXRlcixcblx0XHRCbG9iUmVhZGVyIDogQmxvYlJlYWRlcixcblx0XHRIdHRwUmVhZGVyIDogSHR0cFJlYWRlcixcblx0XHRIdHRwUmFuZ2VSZWFkZXIgOiBIdHRwUmFuZ2VSZWFkZXIsXG5cdFx0RGF0YTY0VVJJUmVhZGVyIDogRGF0YTY0VVJJUmVhZGVyLFxuXHRcdFRleHRSZWFkZXIgOiBUZXh0UmVhZGVyLFxuXHRcdEJsb2JXcml0ZXIgOiBCbG9iV3JpdGVyLFxuXHRcdEFycmF5V3JpdGVyIDogQXJyYXlXcml0ZXIsXG4gICAgICAgIEZpbGVXcml0ZXIgOiBGaWxlV3JpdGVyLFxuXHRcdERhdGE2NFVSSVdyaXRlciA6IERhdGE2NFVSSVdyaXRlcixcblx0XHRUZXh0V3JpdGVyIDogVGV4dFdyaXRlcixcblx0XHRjcmVhdGVSZWFkZXIgOiBmdW5jdGlvbihyZWFkZXIsIGNhbGxiYWNrLCBvbmVycm9yKSB7XG5cdFx0XHRyZWFkZXIuaW5pdChmdW5jdGlvbigpIHtcblx0XHRcdFx0Y2FsbGJhY2soY3JlYXRlWmlwUmVhZGVyKHJlYWRlciwgb25lcnJvcikpO1xuXHRcdFx0fSwgb25lcnJvcik7XG5cdFx0fSxcblx0XHRjcmVhdGVXcml0ZXIgOiBmdW5jdGlvbih3cml0ZXIsIGNhbGxiYWNrLCBvbmVycm9yLCBkb250RGVmbGF0ZSkge1xuXHRcdFx0d3JpdGVyLmluaXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGNyZWF0ZVppcFdyaXRlcih3cml0ZXIsIG9uZXJyb3IsIGRvbnREZWZsYXRlKSk7XG5cdFx0XHR9LCBvbmVycm9yKTtcblx0XHR9LFxuXHRcdHdvcmtlclNjcmlwdHNQYXRoIDogXCJcIixcblx0XHR1c2VXZWJXb3JrZXJzIDogdHJ1ZVxuXHR9O1xuXG59KSh0aGlzKTtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9saWIvemlwLmpzXCIsXCIvbGliXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIExpZ2h0TWFwID0gcmVxdWlyZSgnZ2wvbGlnaHRtYXAnKTtcbnZhciBCc3AgPSByZXF1aXJlKCdmb3JtYXRzL2JzcCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgndXRpbHMnKTtcblxudmFyIG1heExpZ2h0TWFwcyA9IDY0O1xudmFyIGxpZ2h0TWFwQnl0ZXMgPSAxO1xudmFyIGJsb2NrV2lkdGggPSA1MTI7XG52YXIgYmxvY2tIZWlnaHQgPSA1MTI7XG5cbnZhciBMaWdodE1hcHMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmFsbG9jYXRlZCA9IHV0aWxzLmFycmF5MmQoYmxvY2tXaWR0aCwgbWF4TGlnaHRNYXBzKTtcbiAgICB0aGlzLmxpZ2h0TWFwc0RhdGEgPSBbXTtcbn07XG5cbkxpZ2h0TWFwcy5wcm90b3R5cGUuYnVpbGRMaWdodE1hcCA9IGZ1bmN0aW9uKGJzcCwgc3VyZmFjZSwgb2Zmc2V0KSB7XG4gICAgdmFyIHdpZHRoID0gKHN1cmZhY2UuZXh0ZW50c1swXSA+PiA0KSArIDE7XG4gICAgdmFyIGhlaWdodCA9IChzdXJmYWNlLmV4dGVudHNbMV0gPj4gNCkgKyAxO1xuICAgIHZhciBzaXplID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgdmFyIGJsb2NrTGlnaHRzID0gdXRpbHMuYXJyYXkxZCgxOCAqIDE4KTtcbiAgICB2YXIgbGlnaHRNYXBPZmZzZXQgPSBzdXJmYWNlLmxpZ2h0TWFwT2Zmc2V0O1xuXG4gICAgZm9yICh2YXIgbWFwID0gMDsgbWFwIDwgbWF4TGlnaHRNYXBzOyBtYXArKykge1xuICAgICAgICBpZiAoc3VyZmFjZS5saWdodFN0eWxlc1ttYXBdID09PSAyNTUpXG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAvLyBUT0RPOiBBZGQgbGlnaHRzdHlsZXMsIHVzZWQgZm9yIGZsaWNrZXJpbmcsIGFuZCBvdGhlciBsaWdodCBhbmltYXRpb25zLlxuICAgICAgICB2YXIgc2NhbGUgPSAyNjQ7XG4gICAgICAgIGZvciAodmFyIGJsID0gMDsgYmwgPCBzaXplOyBibCsrKSB7XG4gICAgICAgICAgICBibG9ja0xpZ2h0c1tibF0gKz0gYnNwLmxpZ2h0TWFwc1tsaWdodE1hcE9mZnNldCArIGJsXSAqIHNjYWxlO1xuICAgICAgICB9XG4gICAgICAgIGxpZ2h0TWFwT2Zmc2V0ICs9IHNpemU7XG4gICAgfVxuXG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBzdHJpZGUgPSBibG9ja1dpZHRoICogbGlnaHRNYXBCeXRlcztcbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0geSAqIHN0cmlkZSArIHg7XG4gICAgICAgICAgICB0aGlzLmxpZ2h0TWFwc0RhdGFbb2Zmc2V0ICsgcG9zaXRpb25dID0gMjU1IC0gTWF0aC5taW4oMjU1LCBibG9ja0xpZ2h0c1tpXSA+PiA3KTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkxpZ2h0TWFwcy5wcm90b3R5cGUuYWxsb2NhdGVCbG9jayA9IGZ1bmN0aW9uICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIHRleElkID0gMDsgdGV4SWQgPCBtYXhMaWdodE1hcHM7IHRleElkKyspIHtcbiAgICAgICAgdmFyIGJlc3QgPSBibG9ja0hlaWdodDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBibG9ja1dpZHRoIC0gd2lkdGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGJlc3QyID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgd2lkdGg7IGorKykge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYWxsb2NhdGVkW3RleElkXVtpICsgal0gPj0gYmVzdClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYWxsb2NhdGVkW3RleElkXVtpICsgal0gPiBiZXN0MilcbiAgICAgICAgICAgICAgICAgICAgYmVzdDIgPSB0aGlzLmFsbG9jYXRlZFt0ZXhJZF1baSArIGpdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaiA9PSB3aWR0aCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC54ID0gaTtcbiAgICAgICAgICAgICAgICByZXN1bHQueSA9IGJlc3QgPSBiZXN0MjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChiZXN0ICsgaGVpZ2h0ID4gYmxvY2tIZWlnaHQpXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHdpZHRoOyBqKyspXG4gICAgICAgICAgICB0aGlzLmFsbG9jYXRlZFt0ZXhJZF1bcmVzdWx0LnggKyBqXSA9IGJlc3QgKyBoZWlnaHQ7XG5cbiAgICAgICAgcmVzdWx0LnRleElkID0gdGV4SWQ7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufTtcblxuTGlnaHRNYXBzLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uKGJzcCkge1xuICAgIHZhciB1c2VkTWFwcyA9IDA7XG4gICAgZm9yICh2YXIgbSA9IDA7IG0gPCBic3AubW9kZWxzLmxlbmd0aDsgbSsrKSB7XG4gICAgICAgIHZhciBtb2RlbCA9IGJzcC5tb2RlbHNbbV07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtb2RlbC5zdXJmYWNlQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIHN1cmZhY2UgPSBic3Auc3VyZmFjZXNbbW9kZWwuZmlyc3RTdXJmYWNlICsgaV07XG4gICAgICAgICAgICBpZiAoc3VyZmFjZS5mbGFncyAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd2lkdGggPSAoc3VyZmFjZS5leHRlbnRzWzBdID4+IDQpICsgMTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSAoc3VyZmFjZS5leHRlbnRzWzFdID4+IDQpICsgMTtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuYWxsb2NhdGVCbG9jayh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgIHN1cmZhY2UubGlnaHRNYXBTID0gcmVzdWx0Lng7XG4gICAgICAgICAgICBzdXJmYWNlLmxpZ2h0TWFwVCA9IHJlc3VsdC55O1xuICAgICAgICAgICAgdXNlZE1hcHMgPSBNYXRoLm1heCh1c2VkTWFwcywgcmVzdWx0LnRleElkKTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSByZXN1bHQudGV4SWQgKiBsaWdodE1hcEJ5dGVzICogYmxvY2tXaWR0aCAqIGJsb2NrSGVpZ2h0O1xuICAgICAgICAgICAgb2Zmc2V0ICs9IChyZXN1bHQueSAqIGJsb2NrV2lkdGggKyByZXN1bHQueCkgKiBsaWdodE1hcEJ5dGVzO1xuICAgICAgICAgICAgdGhpcy5idWlsZExpZ2h0TWFwKGJzcCwgc3VyZmFjZSwgb2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnRleHR1cmUgPSBuZXcgTGlnaHRNYXAodGhpcy5saWdodE1hcHNEYXRhLCAwLCBibG9ja1dpZHRoLCBibG9ja0hlaWdodCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBMaWdodE1hcHM7XG5cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9saWdodG1hcHMuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVGV4dHVyZSA9IHJlcXVpcmUoJ2dsL3RleHR1cmUnKTtcbnZhciBMaWdodE1hcHMgPSByZXF1aXJlKCdsaWdodG1hcHMnKTtcbnZhciBhc3NldHMgPSByZXF1aXJlKCdhc3NldHMnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJ3V0aWxzJyk7XG52YXIgd2lyZWZyYW1lID0gZmFsc2U7XG5cbnZhciBibG9ja1dpZHRoID0gNTEyO1xudmFyIGJsb2NrSGVpZ2h0ID0gNTEyO1xuXG52YXIgTWFwID0gZnVuY3Rpb24oYnNwKSB7XG4gICAgdGhpcy50ZXh0dXJlcyA9IFtdO1xuICAgIHRoaXMubGlnaHRNYXBzID0gbmV3IExpZ2h0TWFwcygpO1xuICAgIHRoaXMubGlnaHRNYXBzLmJ1aWxkKGJzcCk7XG5cbiAgICBmb3IgKHZhciB0ZXhJZCBpbiBic3AudGV4dHVyZXMpIHtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBic3AudGV4dHVyZXNbdGV4SWRdO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHdpZHRoOiB0ZXh0dXJlLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0ZXh0dXJlLmhlaWdodCxcbiAgICAgICAgICAgIHdyYXA6IGdsLlJFUEVBVCxcbiAgICAgICAgICAgIHBhbGV0dGU6IGFzc2V0cy5wYWxldHRlXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudGV4dHVyZXMucHVzaChuZXcgVGV4dHVyZSh0ZXh0dXJlLmRhdGEsIG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICB2YXIgY2hhaW5zID0gW107XG4gICAgZm9yICh2YXIgbSBpbiBic3AubW9kZWxzKSB7XG4gICAgICAgIHZhciBtb2RlbCA9IGJzcC5tb2RlbHNbbV07XG4gICAgICAgIGZvciAodmFyIHNpZCA9IG1vZGVsLmZpcnN0U3VyZmFjZTsgc2lkIDwgbW9kZWwuc3VyZmFjZUNvdW50OyBzaWQrKykge1xuICAgICAgICAgICAgdmFyIHN1cmZhY2UgPSBic3Auc3VyZmFjZXNbc2lkXTtcbiAgICAgICAgICAgIHZhciB0ZXhJbmZvID0gYnNwLnRleEluZm9zW3N1cmZhY2UudGV4SW5mb0lkXTtcblxuICAgICAgICAgICAgdmFyIGNoYWluID0gY2hhaW5zW3RleEluZm8udGV4dHVyZUlkXTtcbiAgICAgICAgICAgIGlmICghY2hhaW4pIHtcbiAgICAgICAgICAgICAgICBjaGFpbiA9IHsgdGV4SWQ6IHRleEluZm8udGV4dHVyZUlkLCBkYXRhOiBbXSB9O1xuICAgICAgICAgICAgICAgIGNoYWluc1t0ZXhJbmZvLnRleHR1cmVJZF0gPSBjaGFpbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGluZGljZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSBzdXJmYWNlLmVkZ2VTdGFydDsgZSA8IHN1cmZhY2UuZWRnZVN0YXJ0ICsgc3VyZmFjZS5lZGdlQ291bnQ7IGUrKykge1xuICAgICAgICAgICAgICAgIHZhciBlZGdlRmxpcHBlZCA9IGJzcC5lZGdlTGlzdFtlXSA8IDA7XG4gICAgICAgICAgICAgICAgdmFyIGVkZ2VJbmRleCA9IE1hdGguYWJzKGJzcC5lZGdlTGlzdFtlXSk7XG4gICAgICAgICAgICAgICAgaWYgKCFlZGdlRmxpcHBlZCkge1xuICAgICAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goYnNwLmVkZ2VzW2VkZ2VJbmRleCAqIDJdKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGJzcC5lZGdlc1tlZGdlSW5kZXggKiAyICsgMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGljZXMucHVzaChic3AuZWRnZXNbZWRnZUluZGV4ICogMiArIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGJzcC5lZGdlc1tlZGdlSW5kZXggKiAyXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kaWNlcyA9IHdpcmVmcmFtZSA/IGluZGljZXMgOiB1dGlscy50cmlhbmd1bGF0ZShpbmRpY2VzKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gW1xuICAgICAgICAgICAgICAgICAgICBic3AudmVydGljZXNbaW5kaWNlc1tpXV0ueCxcbiAgICAgICAgICAgICAgICAgICAgYnNwLnZlcnRpY2VzW2luZGljZXNbaV1dLnksXG4gICAgICAgICAgICAgICAgICAgIGJzcC52ZXJ0aWNlc1tpbmRpY2VzW2ldXS56XG4gICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIHZhciBzID0gdmVjMy5kb3QodiwgdGV4SW5mby52ZWN0b3JTKSArIHRleEluZm8uZGlzdFM7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSB2ZWMzLmRvdCh2LCB0ZXhJbmZvLnZlY3RvclQpICsgdGV4SW5mby5kaXN0VDtcblxuICAgICAgICAgICAgICAgIHZhciBzMSA9IHMgLyB0aGlzLnRleHR1cmVzW3RleEluZm8udGV4dHVyZUlkXS53aWR0aDtcbiAgICAgICAgICAgICAgICB2YXIgdDEgPSB0IC8gdGhpcy50ZXh0dXJlc1t0ZXhJbmZvLnRleHR1cmVJZF0uaGVpZ2h0O1xuXG4gICAgICAgICAgICAgICAgLy8gU2hhZG93IG1hcCB0ZXh0dXJlIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgdmFyIHMyID0gcztcbiAgICAgICAgICAgICAgICBzMiAtPSBzdXJmYWNlLnRleHR1cmVNaW5zWzBdO1xuICAgICAgICAgICAgICAgIHMyICs9IChzdXJmYWNlLmxpZ2h0TWFwUyAqIDE2KTtcbiAgICAgICAgICAgICAgICBzMiArPSA4O1xuICAgICAgICAgICAgICAgIHMyIC89IChibG9ja1dpZHRoICogMTYpO1xuXG4gICAgICAgICAgICAgICAgdmFyIHQyID0gdDtcbiAgICAgICAgICAgICAgICB0MiAtPSBzdXJmYWNlLnRleHR1cmVNaW5zWzFdO1xuICAgICAgICAgICAgICAgIHQyICs9IChzdXJmYWNlLmxpZ2h0TWFwVCAqIDE2KTtcbiAgICAgICAgICAgICAgICB0MiArPSA4O1xuICAgICAgICAgICAgICAgIHQyIC89IChibG9ja0hlaWdodCAqIDE2KTtcblxuICAgICAgICAgICAgICAgIGNoYWluLmRhdGEucHVzaCh2WzBdLCB2WzFdLCB2WzJdLCBzMSwgdDEsIHMyLCB0Mik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZGF0YSA9IFtdO1xuICAgIHZhciBvZmZzZXQgPSAwO1xuICAgIHRoaXMuY2hhaW5zID0gW107XG4gICAgZm9yICh2YXIgYyBpbiBjaGFpbnMpIHtcbiAgICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBjaGFpbnNbY10uZGF0YS5sZW5ndGg7IHYrKykge1xuICAgICAgICAgICAgZGF0YS5wdXNoKGNoYWluc1tjXS5kYXRhW3ZdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hhaW4gPSB7XG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICAgIHRleElkOiBjaGFpbnNbY10udGV4SWQsXG4gICAgICAgICAgICBlbGVtZW50czogY2hhaW5zW2NdLmRhdGEubGVuZ3RoIC8gN1xuICAgICAgICB9O1xuICAgICAgICBvZmZzZXQgKz0gY2hhaW4uZWxlbWVudHM7XG4gICAgICAgIHRoaXMuY2hhaW5zLnB1c2goY2hhaW4pO1xuICAgIH1cbiAgICB0aGlzLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoZGF0YSksIGdsLlNUQVRJQ19EUkFXKTtcbiAgICB0aGlzLmJ1ZmZlci5zdHJpZGUgPSA3ICogNDtcbn07XG5cbk1hcC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHAsIG0pIHtcbiAgICB2YXIgc2hhZGVyID0gYXNzZXRzLnNoYWRlcnMud29ybGQ7XG4gICAgdmFyIGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgIHZhciBtb2RlID0gd2lyZWZyYW1lID8gZ2wuTElORVMgOiBnbC5UUklBTkdMRVM7XG5cbiAgICBzaGFkZXIudXNlKCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVyKTtcblxuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlci5hdHRyaWJ1dGVzLnNoYWRvd1RleENvb3Jkc0F0dHJpYnV0ZSk7XG5cbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlci5hdHRyaWJ1dGVzLnZlcnRleEF0dHJpYnV0ZSwgMywgZ2wuRkxPQVQsIGZhbHNlLCBidWZmZXIuc3RyaWRlLCAwKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNoYWRlci5hdHRyaWJ1dGVzLnRleENvb3Jkc0F0dHJpYnV0ZSwgMiwgZ2wuRkxPQVQsIGZhbHNlLCBidWZmZXIuc3RyaWRlLCAxMik7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy5zaGFkb3dUZXhDb29yZHNBdHRyaWJ1dGUsIDIsIGdsLkZMT0FULCBmYWxzZSwgYnVmZmVyLnN0cmlkZSwgMjApO1xuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYoc2hhZGVyLnVuaWZvcm1zLnByb2plY3Rpb25NYXRyaXgsIGZhbHNlLCBwKTtcbiAgICBnbC51bmlmb3JtTWF0cml4NGZ2KHNoYWRlci51bmlmb3Jtcy5tb2RlbHZpZXdNYXRyaXgsIGZhbHNlLCBtKTtcbiAgICBnbC51bmlmb3JtMWkoc2hhZGVyLnVuaWZvcm1zLnRleHR1cmVNYXAsIDApO1xuICAgIGdsLnVuaWZvcm0xaShzaGFkZXIudW5pZm9ybXMubGlnaHRNYXAsIDEpO1xuXG4gICAgdGhpcy5saWdodE1hcHMudGV4dHVyZS5iaW5kKDEpO1xuICAgIGZvciAodmFyIGMgaW4gdGhpcy5jaGFpbnMpIHtcbiAgICAgICAgdmFyIGNoYWluID0gdGhpcy5jaGFpbnNbY107XG4gICAgICAgIHZhciB0ZXh0dXJlID0gdGhpcy50ZXh0dXJlc1tjaGFpbi50ZXhJZF07XG4gICAgICAgIHRleHR1cmUuYmluZCgwKTtcbiAgICAgICAgZ2wuZHJhd0FycmF5cyhtb2RlLCB0aGlzLmNoYWluc1tjXS5vZmZzZXQsIHRoaXMuY2hhaW5zW2NdLmVsZW1lbnRzKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBNYXA7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL21hcC5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBhc3NldHMgPSByZXF1aXJlKCdhc3NldHMnKTtcbnZhciBUZXh0dXJlID0gcmVxdWlyZSgnZ2wvVGV4dHVyZScpO1xuXG52YXIgTW9kZWwgPSBmdW5jdGlvbihtZGwpIHtcbiAgICB0aGlzLnNraW5zID0gW107XG4gICAgZm9yICh2YXIgc2tpbkluZGV4ID0gMDsgc2tpbkluZGV4IDwgbWRsLnNraW5zLmxlbmd0aDsgc2tpbkluZGV4KyspIHtcbiAgICAgICAgdmFyIHNraW4gPSBtZGwuc2tpbnNbc2tpbkluZGV4XTtcbiAgICAgICAgdmFyIHRleHR1cmUgPSBuZXcgVGV4dHVyZShza2luLCB7XG4gICAgICAgICAgICBwYWxldHRlOiBhc3NldHMucGFsZXR0ZSxcbiAgICAgICAgICAgIHdpZHRoOiBtZGwuc2tpbldpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBtZGwuc2tpbkhlaWdodFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5za2lucy5wdXNoKHRleHR1cmUpO1xuICAgIH1cblxuICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5pZCk7XG4gICAgdmFyIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KG1kbC5mcmFtZUNvdW50ICogbWRsLmZhY2VDb3VudCAqIDMgKiA1KTtcbiAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1kbC5mcmFtZUNvdW50OyBpKyspIHtcbiAgICAgICAgdmFyIGZyYW1lID0gbWRsLmZyYW1lc1tpXTtcbiAgICAgICAgZm9yICh2YXIgZiA9IDA7IGYgPCBtZGwuZmFjZUNvdW50OyBmKyspIHtcbiAgICAgICAgICAgIHZhciBmYWNlID0gbWRsLmZhY2VzW2ZdO1xuICAgICAgICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCAzOyB2KyspIHtcbiAgICAgICAgICAgICAgICBkYXRhW29mZnNldCsrXSA9IGZyYW1lLnZlcnRpY2VzW2ZhY2UuaW5kaWNlc1t2XV1bMF07XG4gICAgICAgICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSBmcmFtZS52ZXJ0aWNlc1tmYWNlLmluZGljZXNbdl1dWzFdO1xuICAgICAgICAgICAgICAgIGRhdGFbb2Zmc2V0KytdID0gZnJhbWUudmVydGljZXNbZmFjZS5pbmRpY2VzW3ZdXVsyXTtcblxuICAgICAgICAgICAgICAgIHZhciBzID0gbWRsLnRleENvb3Jkc1tmYWNlLmluZGljZXNbdl1dLnM7XG4gICAgICAgICAgICAgICAgdmFyIHQgPSBtZGwudGV4Q29vcmRzW2ZhY2UuaW5kaWNlc1t2XV0udDtcblxuICAgICAgICAgICAgICAgIGlmICghZmFjZS5pc0Zyb250RmFjZSAmJiBtZGwudGV4Q29vcmRzW2ZhY2UuaW5kaWNlc1t2XV0ub25TZWFtKVxuICAgICAgICAgICAgICAgICAgICBzICs9IHRoaXMuc2tpbnNbMF0ud2lkdGggKiAwLjU7IC8vIG9uIGJhY2sgc2lkZVxuXG4gICAgICAgICAgICAgICAgZGF0YVtvZmZzZXQrK10gPSAocyArIDAuNSkgLyB0aGlzLnNraW5zWzBdLndpZHRoO1xuICAgICAgICAgICAgICAgIGRhdGFbb2Zmc2V0KytdID0gKHQgKyAwLjUpIC8gdGhpcy5za2luc1swXS5oZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIHRoaXMuc3RyaWRlID0gNSAqIDQ7IC8vIHgsIHksIHosIHMsIHRcbiAgICB0aGlzLmZhY2VDb3VudCA9IG1kbC5mYWNlQ291bnQ7XG4gICAgdGhpcy5hbmltYXRpb25zID0gbWRsLmFuaW1hdGlvbnM7XG59O1xuXG5Nb2RlbC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHAsIG0sIGFuaW1hdGlvbiwgZnJhbWUpIHtcbiAgICB2YXIgc2hhZGVyID0gYXNzZXRzLnNoYWRlcnMubW9kZWw7XG4gICAgYW5pbWF0aW9uID0gYW5pbWF0aW9uIHwgMDtcbiAgICBmcmFtZSA9IGZyYW1lIHwgMDtcbiAgICBzaGFkZXIudXNlKCk7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5pZCk7XG4gICAgdGhpcy5za2luc1swXS5iaW5kKDApO1xuXG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXIuYXR0cmlidXRlcy52ZXJ0ZXhBdHRyaWJ1dGUsIDMsIGdsLkZMT0FULCBmYWxzZSwgdGhpcy5zdHJpZGUsIDApO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyLmF0dHJpYnV0ZXMudGV4Q29vcmRzQXR0cmlidXRlLCAyLCBnbC5GTE9BVCwgZmFsc2UsIHRoaXMuc3RyaWRlLCAxMik7XG4gICAgZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXIudW5pZm9ybXMubW9kZWx2aWV3TWF0cml4LCBmYWxzZSwgbSk7XG4gICAgZ2wudW5pZm9ybU1hdHJpeDRmdihzaGFkZXIudW5pZm9ybXMucHJvamVjdGlvbk1hdHJpeCwgZmFsc2UsIHApO1xuXG4gICAgZnJhbWUgKz0gdGhpcy5hbmltYXRpb25zW2FuaW1hdGlvbl0uZmlyc3RGcmFtZTtcbiAgICBpZiAoZnJhbWUgPj0gdGhpcy5hbmltYXRpb25zW2FuaW1hdGlvbl0uZnJhbWVDb3VudClcbiAgICAgICAgZnJhbWUgPSAwO1xuXG4gICAgZ2wudW5pZm9ybTFpKHNoYWRlci51bmlmb3Jtcy50ZXh0dXJlTWFwLCAwKTtcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgfn5mcmFtZSAqICh0aGlzLmZhY2VDb3VudCAqIDMpLCB0aGlzLmZhY2VDb3VudCAqIDMpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IE1vZGVsO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9tb2RlbC5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxudmFyIFByb3RvY29sID0ge1xuICAgIHNlcnZlckJhZDogMCxcbiAgICBzZXJ2ZXJOb3A6IDEsXG4gICAgc2VydmVyRGlzY29ubmVjdDogMixcbiAgICBzZXJ2ZXJVcGRhdGVTdGF0OiAzLFxuICAgIHNlcnZlclZlcnNpb246IDQsXG4gICAgc2VydmVyU2V0VmlldzogNSxcbiAgICBzZXJ2ZXJTb3VuZDogNixcbiAgICBzZXJ2ZXJUaW1lOiA3LFxuICAgIHNlcnZlclByaW50OiA4LFxuICAgIHNlcnZlclN0dWZmVGV4dDogOSxcbiAgICBzZXJ2ZXJTZXRBbmdsZTogMTAsXG4gICAgc2VydmVySW5mbzogMTEsXG4gICAgc2VydmVyTGlnaHRTdHlsZTogMTIsXG4gICAgc2VydmVyVXBkYXRlTmFtZTogMTMsXG4gICAgc2VydmVyVXBkYXRlRnJhZ3M6IDE0LFxuICAgIHNlcnZlckNsaWVudERhdGE6IDE1LFxuICAgIHNlcnZlclN0b3BTb3VuZDogMTYsXG4gICAgc2VydmVyVXBkYXRlQ29sb3JzOiAxNyxcbiAgICBzZXJ2ZXJQYXJ0aWNsZTogMTgsXG4gICAgc2VydmVyRGFtYWdlOiAxOSxcbiAgICBzZXJ2ZXJTcGF3blN0YXRpYzogMjAsXG4gICAgc2VydmVyU3Bhd25CYXNlbGluZTogMjIsXG4gICAgc2VydmVyVGVtcEVudGl0eTogMjMsXG4gICAgc2VydmVyU2V0UGF1c2U6IDI0LFxuICAgIHNlcnZlclNpZ25vbk51bTogMjUsXG4gICAgc2VydmVyQ2VudGVyUHJpbnQ6IDI2LFxuICAgIHNlcnZlcktpbGxlZE1vbnN0ZXI6IDI3LFxuICAgIHNlcnZlckZvdW5kU2VjcmV0OiAyOCxcbiAgICBzZXJ2ZXJTcGF3blN0YXRpY1NvdW5kOiAyOSxcbiAgICBzZXJ2ZXJDZFRyYWNrOiAzMixcbiAgICBcbiAgICBjbGllbnRWaWV3SGVpZ2h0OiAxLFxuICAgIGNsaWVudElkZWFsUGl0Y2g6IDIsXG4gICAgY2xpZW50UHVuY2gxOiA0LFxuICAgIGNsaWVudFB1bmNoMjogOCxcbiAgICBjbGllbnRQdW5jaDM6IDE2LFxuICAgIGNsaWVudFZlbG9jaXR5MTogMzIsXG4gICAgY2xpZW50VmVsb2NpdHkyOiA2NCxcbiAgICBjbGllbnRWZWxvY2l0eTM6IDEyOCxcbiAgICBjbGllbnRBaW1lbnQ6IDI1NixcbiAgICBjbGllbnRJdGVtczogNTEyLFxuICAgIGNsaWVudE9uR3JvdW5kOiAxMDI0LFxuICAgIGNsaWVudEluV2F0ZXI6IDIwNDgsXG4gICAgY2xpZW50V2VhcG9uRnJhbWU6IDQwOTYsXG4gICAgY2xpZW50QXJtb3I6IDgxOTIsXG4gICAgY2xpZW50V2VhcG9uOiAxNjM4NCxcblxuICAgIGZhc3RVcGRhdGVNb3JlQml0czogMSxcbiAgICBmYXN0VXBkYXRlT3JpZ2luMTogMixcbiAgICBmYXN0VXBkYXRlT3JpZ2luMjogNCxcbiAgICBmYXN0VXBkYXRlT3JpZ2luMzogOCxcbiAgICBmYXN0VXBkYXRlQW5nbGUyOiAxNixcbiAgICBmYXN0VXBkYXRlTm9MZXJwOiAzMixcbiAgICBmYXN0VXBkYXRlRnJhbWU6IDY0LFxuICAgIGZhc3RVcGRhdGVTaWduYWw6IDEyOCxcbiAgICBmYXN0VXBkYXRlQW5nbGUxOiAyNTYsXG4gICAgZmFzdFVwZGF0ZUFuZ2xlMzogNTEyLFxuICAgIGZhc3RVcGRhdGVNb2RlbDogMTAyNCxcbiAgICBmYXN0VXBkYXRlQ29sb3JNYXA6IDIwNDgsXG4gICAgZmFzdFVwZGF0ZVNraW46IDQwOTYsXG4gICAgZmFzdFVwZGF0ZUVmZmVjdHM6IDgxOTIsXG4gICAgZmFzdFVwZGF0ZUxvbmdFbnRpdHk6IDE2Mzg0LFxuXG4gICAgc291bmRWb2x1bWU6IDEsXG4gICAgc291bmRBdHRlbnVhdGlvbjogMixcbiAgICBzb3VuZExvb3Bpbmc6IDQsXG5cbiAgICB0ZW1wU3Bpa2U6IDAsXG4gICAgdGVtcFN1cGVyU3Bpa2U6IDEsXG4gICAgdGVtcEd1blNob3Q6IDIsXG4gICAgdGVtcEV4cGxvc2lvbjogMyxcbiAgICB0ZW1wVGFyRXhwbG9zaW9uOiA0LFxuICAgIHRlbXBMaWdodG5pbmcxOiA1LFxuICAgIHRlbXBMaWdodG5pbmcyOiA2LFxuICAgIHRlbXBXaXpTcGlrZTogNyxcbiAgICB0ZW1wS25pZ2h0U3Bpa2U6IDgsXG4gICAgdGVtcExpZ2h0bmluZzM6IDksXG4gICAgdGVtcExhdmFTcGxhc2g6IDEwLFxuICAgIHRlbXBUZWxlcG9ydDogMTEsXG4gICAgdGVtcEV4cGxvc2lvbjI6IDEyXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBQcm90b2NvbDtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi9wcm90b2NvbC5qc1wiLFwiL1wiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcblxudmFyIHNldHRpbmdzID0ge1xuICAgIHZlcnNpb246ICcwLjEnLFxuICAgIG1hcE5hbWVzOiB7XG4gICAgICAgIHN0YXJ0OiAnRW50cmFuY2UnLFxuICAgICAgICBlMW0xOiAnU2xpcGdhdGUgQ29tcGxleCcsXG4gICAgICAgIGUxbTI6ICdDYXN0bGUgb2YgdGhlIERhbW5lZCcsXG4gICAgICAgIGUxbTM6ICdUaGUgTmVjcm9wb2xpcycsXG4gICAgICAgIGUxbTQ6ICdUaGUgR3Jpc2x5IEdyb3R0bycsXG4gICAgICAgIGUxbTU6ICdHbG9vbSBLZWVwJyxcbiAgICAgICAgZTFtNjogJ1RoZSBEb29yIFRvIENodGhvbicsXG4gICAgICAgIGUxbTc6ICdUaGUgSG91c2Ugb2YgQ2h0aG9uJyxcbiAgICAgICAgZTFtODogJ1ppZ2d1cmF0IFZlcnRpZ28nXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gc2V0dGluZ3M7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL3NldHRpbmdzLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xudmFyIFRleHR1cmUgPSByZXF1aXJlKCdnbC90ZXh0dXJlJyk7XG52YXIgU3ByaXRlcyA9IHJlcXVpcmUoJ2dsL3Nwcml0ZXMnKTtcbnZhciBGb250ID0gcmVxdWlyZSgnZ2wvZm9udCcpO1xudmFyIGFzc2V0cyA9IHJlcXVpcmUoJ2Fzc2V0cycpO1xudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MnKTtcblxudmFyIENvbnNvbGUgPSBmdW5jdGlvbigpIHt9O1xuXG5Db25zb2xlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICB2YXIgZm9udFRleHR1cmUgPSBhc3NldHMubG9hZCgnd2FkL0NPTkNIQVJTJywgeyB3aWR0aDogMTI4LCBoZWlnaHQ6IDEyOCwgYWxwaGE6IHRydWUgfSk7XG4gICB2YXIgZm9udCA9IG5ldyBGb250KGZvbnRUZXh0dXJlLCA4LCA4KTtcblxuICAgdmFyIGJhY2tncm91bmRUZXh0dXJlID0gYXNzZXRzLmxvYWQoJ3Bhay9nZngvY29uYmFjay5sbXAnKTtcbiAgIGJhY2tncm91bmRUZXh0dXJlLmRyYXdUbyhmdW5jdGlvbihwKSB7XG4gICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgdmFyIHZlcnNpb24gPSAnV2ViR0wgJyArIHNldHRpbmdzLnZlcnNpb247XG4gICAgICBmb250LmRyYXdTdHJpbmcoMjI1LCAxODYsIHZlcnNpb24sIDEpO1xuICAgICAgZm9udC5yZW5kZXIoYXNzZXRzLnNoYWRlcnMudGV4dHVyZTJkLCBwKTtcbiAgIH0pO1xuICAgdGhpcy5iYWNrZ3JvdW5kID0gbmV3IFNwcml0ZXMoMzIwLCAyMDApO1xuICAgdGhpcy5iYWNrZ3JvdW5kLnRleHR1cmVzLmFkZFN1YlRleHR1cmUoYmFja2dyb3VuZFRleHR1cmUpO1xuICAgdGhpcy5iYWNrZ3JvdW5kLnRleHR1cmVzLmNvbXBpbGUoYXNzZXRzLnNoYWRlcnMudGV4dHVyZTJkKTtcblxuICAgdGhpcy5idWZmZXIgPSBuZXcgU3ByaXRlcyhnbC53aWR0aCwgZ2wuaGVpZ2h0KTtcbiAgIHRoaXMuYnVmZmVyLnRleHR1cmVzLmFkZFN1YlRleHR1cmUobmV3IFRleHR1cmUobnVsbCwgeyB3aWR0aDogZ2wud2lkdGgsIGhlaWdodDogZ2wuaGVpZ2h0IH0pKTtcbiAgIHRoaXMuYnVmZmVyLnRleHR1cmVzLmNvbXBpbGUoYXNzZXRzLnNoYWRlcnMudGV4dHVyZTJkKTtcblxuICAgdGhpcy5mb250ID0gZm9udDtcbiAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG4gICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICB0aGlzLnkgPSAtZ2wuaGVpZ2h0ICogMC43NTtcbiAgIHRoaXMubGluZXMgPSBbJyddO1xuICAgdGhpcy5saW5lID0gJ10nO1xufTtcblxuQ29uc29sZS5wcm90b3R5cGUucHJpbnQgPSBmdW5jdGlvbihtc2cpIHtcbiAgIGlmIChtc2cuaW5kZXhPZignXFxuJykgIT09IC0xKVxuICAgICAgdGhpcy5saW5lcy5wdXNoKCcnKTtcbiAgIGVsc2VcbiAgICAgIHRoaXMubGluZXNbdGhpcy5saW5lcy5sZW5ndGggLSAxXSArPSBtc2c7XG4gICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbn07XG5cbkNvbnNvbGUucHJvdG90eXBlLmlucHV0ID0gZnVuY3Rpb24oa2V5KSB7XG4gICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSAxOTI6XG4gICAgICAgICB0aGlzLmVuYWJsZWQgPSAhdGhpcy5lbmFibGVkOyAvLyBUT0RPOiBBbmltYXRlIGhlcmUuXG4gICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMTM6XG4gICAgICAgICB0aGlzLmxpbmVzLnB1c2godGhpcy5saW5lKTtcbiAgICAgICAgIHRoaXMubGluZSA9ICddJztcbiAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAgdGhpcy5saW5lICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoa2V5KTtcbiAgIH1cbn07XG5cbkNvbnNvbGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGR0KSB7XG4gICBpZiAoIXRoaXMuZW5hYmxlZClcbiAgICAgIHJldHVybjtcbiAgIC8vIFRPRE86IEFuaW1hdGUuXG59O1xuXG5Db25zb2xlLnByb3RvdHlwZS5yZWRyYXdCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgIHZhciBzZWxmID0gdGhpcztcbiAgIHRoaXMuYnVmZmVyLnRleHR1cmVzLnRleHR1cmUuZHJhd1RvKGZ1bmN0aW9uIChwKSB7XG4gICAgICBnbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgICAgdmFyIHkgPSBnbC5oZWlnaHQgLSA0MDtcbiAgICAgIGZvciAodmFyIGkgPSBzZWxmLmxpbmVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICBzZWxmLmZvbnQuZHJhd1N0cmluZyg4LCB5LCBzZWxmLmxpbmVzW2ldKTtcbiAgICAgICAgIHkgLT0gODtcbiAgICAgIH1cbiAgICAgIHNlbGYuZm9udC5yZW5kZXIoYXNzZXRzLnNoYWRlcnMudGV4dHVyZTJkLCBwKTtcbiAgIH0pO1xufTtcblxuQ29uc29sZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHApIHtcbiAgIGlmICghdGhpcy5lbmFibGVkKVxuICAgICAgcmV0dXJuO1xuXG4gICBpZiAodGhpcy5kaXJ0eSlcbiAgICAgIHRoaXMucmVkcmF3QnVmZmVyKCk7XG5cbiAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICB0aGlzLmJhY2tncm91bmQuY2xlYXIoKTtcbiAgIHRoaXMuYmFja2dyb3VuZC5kcmF3U3ByaXRlKDAsIDAsIHRoaXMueSwgZ2wud2lkdGgsIGdsLmhlaWdodCwgMSwgMSwgMSwgMSk7XG4gICB0aGlzLmJhY2tncm91bmQucmVuZGVyKGFzc2V0cy5zaGFkZXJzLmNvbG9yMmQsIHApO1xuXG4gICB0aGlzLmJ1ZmZlci5jbGVhcigpO1xuICAgdGhpcy5idWZmZXIuZHJhd1Nwcml0ZSgwLCAwLCB0aGlzLnksIGdsLndpZHRoLCBnbC5oZWlnaHQsIDEsIDEsIDEsIDEpO1xuICAgdGhpcy5idWZmZXIucmVuZGVyKGFzc2V0cy5zaGFkZXJzLmNvbG9yMmQsIHApO1xuXG4gICB0aGlzLmZvbnQuZHJhd1N0cmluZyg4LCB0aGlzLnkgKyBnbC5oZWlnaHQgLSAzMCwgdGhpcy5saW5lKTtcbiAgIHRoaXMuZm9udC5yZW5kZXIoYXNzZXRzLnNoYWRlcnMudGV4dHVyZTJkLCBwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IG5ldyBDb25zb2xlKCk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIjFZaVo1U1wiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiL3VpL2NvbnNvbGUuanNcIixcIi91aVwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBTcHJpdGVzID0gcmVxdWlyZSgnZ2wvc3ByaXRlcycpO1xudmFyIGFzc2V0cyA9IHJlcXVpcmUoJ2Fzc2V0cycpO1xuXG52YXIgU3RhdHVzQmFyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zcHJpdGVzID0gbmV3IFNwcml0ZXMoNTEyLCA1MTIsIDY0KTtcblxuICAgIHRoaXMuYmFja2dyb3VuZCA9IHRoaXMubG9hZFBpYygnU0JBUicpO1xuICAgIHRoaXMubnVtYmVycyA9IFtdO1xuICAgIHRoaXMucmVkTnVtYmVycyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgICB0aGlzLm51bWJlcnMucHVzaCh0aGlzLmxvYWRQaWMoJ05VTV8nICsgaSkpO1xuICAgICAgICB0aGlzLnJlZE51bWJlcnMucHVzaCh0aGlzLmxvYWRQaWMoJ0FOVU1fJyArIGkpKTtcbiAgICB9XG5cbiAgICB0aGlzLndlYXBvbnMgPSBuZXcgQXJyYXkoNyk7XG4gICAgdGhpcy53ZWFwb25zWzBdID0gdGhpcy5sb2FkV2VhcG9uKCdTSE9UR1VOJyk7XG4gICAgdGhpcy53ZWFwb25zWzFdID0gdGhpcy5sb2FkV2VhcG9uKCdTU0hPVEdVTicpO1xuICAgIHRoaXMud2VhcG9uc1syXSA9IHRoaXMubG9hZFdlYXBvbignTkFJTEdVTicpO1xuICAgIHRoaXMud2VhcG9uc1szXSA9IHRoaXMubG9hZFdlYXBvbignU05BSUxHVU4nKTtcbiAgICB0aGlzLndlYXBvbnNbNF0gPSB0aGlzLmxvYWRXZWFwb24oJ1JMQVVOQ0gnKTtcbiAgICB0aGlzLndlYXBvbnNbNV0gPSB0aGlzLmxvYWRXZWFwb24oJ1NSTEFVTkNIJyk7XG4gICAgdGhpcy53ZWFwb25zWzZdID0gdGhpcy5sb2FkV2VhcG9uKCdMSUdIVE5HJyk7XG5cbiAgICB0aGlzLmZhY2VzID0gbmV3IEFycmF5KDUpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDw9IDU7IGkrKylcbiAgICAgICAgdGhpcy5mYWNlc1tpIC0gMV0gPSB7IG5vcm1hbDogdGhpcy5sb2FkUGljKCdGQUNFJyArIGkpLCBwYWluOiB0aGlzLmxvYWRQaWMoJ0ZBQ0VfUCcgKyBpKSB9O1xuXG4gICAgdGhpcy5zcHJpdGVzLnRleHR1cmVzLmNvbXBpbGUoYXNzZXRzLnNoYWRlcnMudGV4dHVyZTJkKTtcbn07XG5cblN0YXR1c0Jhci5wcm90b3R5cGUubG9hZFBpYyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdGV4dHVyZSA9IGFzc2V0cy5sb2FkKCd3YWQvJyArIG5hbWUpO1xuICAgIHJldHVybiB0aGlzLnNwcml0ZXMudGV4dHVyZXMuYWRkU3ViVGV4dHVyZSh0ZXh0dXJlKTtcbn07XG5cblN0YXR1c0Jhci5wcm90b3R5cGUuZHJhd1BpYyA9IGZ1bmN0aW9uKGluZGV4LCB4LCB5KSB7XG4gICAgdGhpcy5zcHJpdGVzLmRyYXdTcHJpdGUoaW5kZXgsIHgsIHksIDAsIDAsIDEsIDEsIDEsIDEpO1xufTtcblxuU3RhdHVzQmFyLnByb3RvdHlwZS5sb2FkV2VhcG9uID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgd2VhcG9uID0ge307XG4gICAgd2VhcG9uLm93bmVkID0gdGhpcy5sb2FkUGljKCdJTlZfJyArIG5hbWUpO1xuICAgIHdlYXBvbi5hY3RpdmUgPSB0aGlzLmxvYWRQaWMoJ0lOVjJfJyArIG5hbWUpO1xuICAgIHdlYXBvbi5mbGFzaGVzID0gbmV3IEFycmF5KDUpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTsgaSsrKVxuICAgICAgICB3ZWFwb24uZmxhc2hlc1tpXSA9IHRoaXMubG9hZFBpYygnSU5WQScgKyAoaSArIDEpICsgJ18nICsgbmFtZSk7XG4gICAgcmV0dXJuIHdlYXBvbjtcbn07XG5cblN0YXR1c0Jhci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKHApIHtcbiAgICB0aGlzLnNwcml0ZXMuY2xlYXIoKTtcblxuICAgIHZhciBsZWZ0ID0gZ2wud2lkdGggLyAyIC0gMTYwO1xuICAgIHRoaXMuZHJhd1BpYyh0aGlzLmJhY2tncm91bmQsIGxlZnQsIGdsLmhlaWdodCAtIDI4KTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDc7IGkrKylcbiAgICAgICAgdGhpcy5kcmF3UGljKHRoaXMud2VhcG9uc1tpXS5vd25lZCwgbGVmdCArIGkgKiAyNCwgZ2wuaGVpZ2h0IC0gNDIpO1xuXG4gICAgdGhpcy5zcHJpdGVzLnJlbmRlcihhc3NldHMuc2hhZGVycy5jb2xvcjJkLCBwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IFN0YXR1c0Jhcjtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvdWkvc3RhdHVzYmFyLmpzXCIsXCIvdWlcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgVXRpbHMgPSB7fTtcblxuVXRpbHMuZ2V0RXh0ZW5zaW9uID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIHZhciBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy4nKTtcbiAgICBpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIHBhdGguc3Vic3RyKGluZGV4ICsgMSk7XG59O1xuXG5VdGlscy50cmlhbmd1bGF0ZSA9IGZ1bmN0aW9uKHBvaW50cykge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBwb2ludHMucG9wKCk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwb2ludHMubGVuZ3RoIC0gMjsgaSArPSAyKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHBvaW50c1tpICsgMl0pO1xuICAgICAgICByZXN1bHQucHVzaChwb2ludHNbaV0pO1xuICAgICAgICByZXN1bHQucHVzaChwb2ludHNbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuVXRpbHMucXVha2VJZGVudGl0eSA9IGZ1bmN0aW9uKGEpIHtcbiAgICBhWzBdID0gMDsgYVs0XSA9IDE7IGFbOF0gPSAwOyBhWzEyXSA9IDA7XG4gICAgYVsxXSA9IDA7IGFbNV0gPSAwOyBhWzldID0gLTE7IGFbMTNdID0gMDtcbiAgICBhWzJdID0gLTE7IGFbNl0gPSAwOyBhWzEwXSA9IDA7IGFbMTRdID0gMDtcbiAgICBhWzNdID0gMDsgYVs3XSA9IDA7IGFbMTFdID0gMDsgYVsxNV0gPSAxO1xuICAgIHJldHVybiBhO1xufTtcblxuVXRpbHMuZGVnMlJhZCA9IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcbiAgICByZXR1cm4gZGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG59O1xuXG5VdGlscy5yYWQyRGVnID0gZnVuY3Rpb24oZGVncmVlcykge1xuICAgIHJldHVybiBkZWdyZWVzIC8gTWF0aC5QSSAqIDE4MDtcbn07XG5cblxuVXRpbHMuaXNQb3dlck9mMiA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gKHggJiAoeCAtIDEpKSA9PSAwO1xufTtcblxuVXRpbHMubmV4dFBvd2VyT2YyID0gZnVuY3Rpb24oeCkge1xuICAgIC0teDtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IDMyOyBpIDw8PSAxKSB7XG4gICAgICAgIHggPSB4IHwgeCA+PiBpO1xuICAgIH1cbiAgICByZXR1cm4geCArIDE7XG59O1xuXG5VdGlscy5hcnJheTFkID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KHdpZHRoKTtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHJlc3VsdFt4XSA9IDA7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblV0aWxzLmFycmF5MmQgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIHJlc3VsdCA9IG5ldyBBcnJheShoZWlnaHQpO1xuICAgIGZvciAodmFyIHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgcmVzdWx0W3ldID0gbmV3IEFycmF5KHdpZHRoKTtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB3aWR0aDsgeCsrKVxuICAgICAgICAgICAgcmVzdWx0W3ldW3hdID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IFV0aWxzO1xuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvdXRpbHMuanNcIixcIi9cIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG52YXIgTWFwID0gcmVxdWlyZSgnbWFwJyk7XG52YXIgTW9kZWwgPSByZXF1aXJlKCdtb2RlbCcpO1xudmFyIGFzc2V0cyA9IHJlcXVpcmUoJ2Fzc2V0cycpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgndXRpbHMnKTtcblxudmFyIFdvcmxkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5tb2RlbHMgPSBbJ2R1bW15J107XG4gICAgdGhpcy5zdGF0aWNzID0gW107XG4gICAgdGhpcy5lbnRpdGllcyA9IFtdO1xuICAgIHRoaXMubWFwID0gbnVsbDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTAyNDsgaSsrKSB7XG4gICAgICAgIHZhciBlbnRpdHkgPSB7XG4gICAgICAgICAgICB0aW1lOiAwLFxuICAgICAgICAgICAgc3RhdGU6IHsgYW5nbGVzOiB2ZWMzLmNyZWF0ZSgpLCBvcmlnaW46IHZlYzMuY3JlYXRlKCkgfSxcbiAgICAgICAgICAgIHByaW9yU3RhdGU6IHsgYW5nbGVzOiB2ZWMzLmNyZWF0ZSgpLCBvcmlnaW46IHZlYzMuY3JlYXRlKCkgfSxcbiAgICAgICAgICAgIG5leHRTdGF0ZTogeyBhbmdsZXM6IHZlYzMuY3JlYXRlKCksIG9yaWdpbjogdmVjMy5jcmVhdGUoKSB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZW50aXRpZXMucHVzaChlbnRpdHkpO1xuICAgIH1cbn07XG5cbldvcmxkLnByb3RvdHlwZS5sb2FkTW9kZWwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHR5cGUgPSB1dGlscy5nZXRFeHRlbnNpb24obmFtZSk7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgJ2JzcCc6XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBuZXcgTWFwKGFzc2V0cy5sb2FkKCdwYWsvJyArIG5hbWUpKTtcbiAgICAgICAgICAgIHRoaXMubW9kZWxzLnB1c2gobW9kZWwpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLm1hcCkgeyB0aGlzLm1hcCA9IG1vZGVsOyB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuYW1lKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtZGwnOlxuICAgICAgICAgICAgdGhpcy5tb2RlbHMucHVzaChuZXcgTW9kZWwoYXNzZXRzLmxvYWQoJ3Bhay8nICsgbmFtZSkpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhpcy5tb2RlbHMucHVzaChudWxsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbldvcmxkLnByb3RvdHlwZS5zcGF3blN0YXRpYyA9IGZ1bmN0aW9uKGJhc2VsaW5lKSB7XG4gICAgdmFyIGVudGl0eSA9IHsgc3RhdGU6IGJhc2VsaW5lIH07XG4gICAgdGhpcy5zdGF0aWNzLnB1c2goZW50aXR5KTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5zcGF3bkVudGl0eSA9IGZ1bmN0aW9uKGlkLCBiYXNlbGluZSkge1xuICAgIHRoaXMuZW50aXRpZXNbaWRdLnN0YXRlID0gYmFzZWxpbmU7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oZHQpIHtcblxuICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5lbnRpdGllcy5sZW5ndGg7IGUrKykge1xuICAgICAgICB2YXIgZW50aXR5ID0gdGhpcy5lbnRpdGllc1tlXTtcbiAgICAgICAgaWYgKCFlbnRpdHkpIGNvbnRpbnVlO1xuXG4gICAgICAgIGZvciAodmFyIGMgPSAwOyBjIDwgMzsgYysrKSB7XG4gICAgICAgICAgICB2YXIgZHAgPSBlbnRpdHkubmV4dFN0YXRlLm9yaWdpbltjXSAtIGVudGl0eS5wcmlvclN0YXRlLm9yaWdpbltjXTtcbiAgICAgICAgICAgIGVudGl0eS5zdGF0ZS5vcmlnaW5bY10gPSBlbnRpdHkucHJpb3JTdGF0ZS5vcmlnaW5bY10gKyBkcCAqIGR0O1xuXG4gICAgICAgICAgICB2YXIgZGEgPSBlbnRpdHkubmV4dFN0YXRlLmFuZ2xlc1tjXSAtIGVudGl0eS5wcmlvclN0YXRlLmFuZ2xlc1tjXTtcbiAgICAgICAgICAgIGlmIChkYSA+IDE4MCkgZGEgLT0gMzYwO1xuICAgICAgICAgICAgZWxzZSBpZiAoZGEgPCAtMTgwKSBkYSArPSAzNjA7XG4gICAgICAgICAgICBlbnRpdHkuc3RhdGUuYW5nbGVzW2NdID0gZW50aXR5LnByaW9yU3RhdGUuYW5nbGVzW2NdICsgZGEgKiBkdDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbldvcmxkLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24ocCwgdmlld0VudGl0eSkge1xuICAgIHZhciBtID0gdXRpbHMucXVha2VJZGVudGl0eShtYXQ0LmNyZWF0ZSgpKTtcbiAgICB2YXIgZW50aXR5ID0gdGhpcy5lbnRpdGllc1t2aWV3RW50aXR5XTtcbiAgICB2YXIgb3JpZ2luID0gZW50aXR5LnN0YXRlLm9yaWdpbjtcbiAgICB2YXIgYW5nbGVzID0gZW50aXR5LnN0YXRlLmFuZ2xlcztcbiAgICBtYXQ0LnJvdGF0ZVkobSwgbSwgdXRpbHMuZGVnMlJhZCgtYW5nbGVzWzBdKSk7XG4gICAgbWF0NC5yb3RhdGVaKG0sIG0sIHV0aWxzLmRlZzJSYWQoLWFuZ2xlc1sxXSkpO1xuICAgIG1hdDQudHJhbnNsYXRlKG0sIG0sIFstb3JpZ2luWzBdLCAtb3JpZ2luWzFdLCAtb3JpZ2luWzJdIC0gMjJdKTtcbiAgICB0aGlzLm1hcC5kcmF3KHAsIG0pO1xuXG4gICAgdGhpcy5kcmF3U3RhdGljcyhwLCBtKTtcbiAgICB0aGlzLmRyYXdFbnRpdGllcyhwLCBtLCB2aWV3RW50aXR5KTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5kcmF3U3RhdGljcyA9IGZ1bmN0aW9uKHAsIG0pIHtcbiAgICB2YXIgbW0gPSBtYXQ0LmNyZWF0ZSgpO1xuICAgIGZvciAodmFyIHMgPSAwOyBzIDwgdGhpcy5zdGF0aWNzLmxlbmd0aDsgcysrKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGljc1tzXS5zdGF0ZTtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbHNbc3RhdGUubW9kZWxJbmRleF07XG4gICAgICAgIG1hdDQudHJhbnNsYXRlKG1tLCBtLCBzdGF0ZS5vcmlnaW4pO1xuICAgICAgICBtb2RlbC5kcmF3KHAsIG1tLCAwLCAwKTtcbiAgICB9XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuZHJhd0VudGl0aWVzID0gZnVuY3Rpb24ocCwgbSwgdmlld0VudGl0eSkge1xuICAgIHZhciBtbSA9IG1hdDQuY3JlYXRlKCk7XG4gICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLmVudGl0aWVzLmxlbmd0aDsgZSsrKSB7XG4gICAgICAgIGlmIChlID09PSB2aWV3RW50aXR5KVxuICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5lbnRpdGllc1tlXS5zdGF0ZTtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5tb2RlbHNbc3RhdGUubW9kZWxJbmRleF07XG4gICAgICAgIGlmIChtb2RlbCkge1xuICAgICAgICAgICAgbW0gPSBtYXQ0LnRyYW5zbGF0ZShtbSwgbSwgc3RhdGUub3JpZ2luKTtcbiAgICAgICAgICAgIG1hdDQucm90YXRlWihtbSwgbW0sIHV0aWxzLmRlZzJSYWQoc3RhdGUuYW5nbGVzWzFdKSk7XG4gICAgICAgICAgICBtb2RlbC5kcmF3KHAsIG1tLCAwLCBzdGF0ZS5mcmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBXb3JsZDtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvd29ybGQuanNcIixcIi9cIikiXX0=
