const {Transform} = require('stream');
const leb128 = require('../base/leb128');

class SectionPayload {
  constructor(name, data) {
    this.name = name;
    this.data = data;
  }

  get length() {
    return this.name.length + this.data.length;
  }
}

class Section {
  constructor(id, payload) {
    this.id = id;
    this.payload = payload;
  }
}

class SectionDecoder extends Transform {
  constructor(options) {
    super(options);
  }

  static decode(buffer) {
    const id = SectionDecoder.decodeId(buffer);
    buffer = buffer.slice(1);

    const payloadLen = SectionDecoder.decodePayloadLen(buffer);
    buffer = buffer.slice(payloadLen.length);

    let name = '';
    let nameLenSize = 0;
    if (id === 0) {
      const nameLen = SectionDecoder.decodeNameLen(buffer);
      nameLenSize = nameLen.value;
      name = buffer.toString('utf8', 0, nameLen.length);
      buffer = buffer.slice(nameLen.length);
    }

    const payloadDataSize = payloadLen.value - nameLenSize - name.length;
    let payload = buffer.slice(0, payloadDataSize);
    buffer = buffer.slice(payloadDataSize);

    console.log(id, name, payload.length);

    return buffer;
  }

  static decodeId(buffer) {
    return buffer.readUInt8(0);
  }

  static decodePayloadLen(buffer) {
    return leb128.decode(buffer.slice(0, 4));
  }

  static decodeNameLen(buffer) {
    return leb128.decode(buffer);
  }

  _transform(buffer, encode, callback) {
    while (buffer.length > 0) {
      buffer = SectionDecoder.decode(buffer);
    }
    callback(null, buffer);
  }
}

module.exports = {
  SectionDecoder
};
