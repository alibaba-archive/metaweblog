/**
 * Module dependencies.
 */

var http = require('http')
  , https = require('https')
  , urlutil = require('url')
  , xml2json = require('xml2json');

/**
 * HTML Special Characters
 * 
 * http://tntluoma.com/files/codes.htm
 */
var escape = exports.escape = function(s) {
    return String(s)
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/@/g, '&#64;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
};
  
function Client(rpc_url) {
	var info = urlutil.parse(rpc_url);
	this.http_request = http.request;
	var port = info.port || 80;
	if(info.protocol == 'https:') {
		this.http_request = https.request;
		if(!info.port) {
			port = 443;
		}
	}
	this.options = {
		host: info.hostname,
		path: info.pathname || '/',
		method: 'POST',
		port: port
	};
	if(info.query) {
		this.options.path += info.search;
	}
};

/**
 * create xml rpc request data
 * 
 * @param {String} method
 * @param param1, param2, ...
 * @param {Function} callback(result)
 * @return {String} xml string
 * @api public
 */
Client.prototype.request = function() {
	var len = arguments.length - 1;
	var callback = arguments[len];
	var params = [];
	for(var i = 0; i < len; i++) {
		params.push(arguments[i]);
	}
	var body = this.get_xml.apply(this, params);
	var options = this.options;
	var that = this;
	var req = this.http_request(options, function(res) {
		var chunks = [], length = 0;
		res.on('data', function(chunk) {
			length += chunk.length;
			chunks.push(chunk);
		});
		res.on('end', function(){
			var data = new Buffer(length);
			var error = null;
			// 延后copy
			for(var i=0, pos=0, l=chunks.length; i<l; i++) {
				chunks[i].copy(data, pos);
				pos += chunks[i].length;
			}
			data = data.toString();
			//console.log(data, res.headers)
			if(res.statusCode == 200 || res.statusCode == 201) {
			    data = xml2json.toJson(data, {object: true});
				data = that.parse(data);
				if(data && data.faultString) {
					error = data;
					error.code = data.faultCode;
					error.message = data.faultString;
					data = null;
				}
			} else {
				error = data;
				data = null;
			}
			if(callback) {
				callback(error, data, res);
			}
		});
	});
	req.write(body);
	req.end();
};

/**
 * create xml rpc request data
 * 
 * <methodCall>
 *  <methodName>blogger.getUsersBlogs</methodName>
 *  <params>
 *      <param><value><string>fawave中文&lt;&gt;/?":</string></value></param>
 *      <param><value><string>fengmk2</string></value></param>
 *      <param><value><int>123</int></value></param>
 *  </params>
 * </methodCall>
 * 
 * @param {String} method
 * @param param1, param2, ...
 * @return {String} xml string
 * @api public
 */
Client.prototype.get_xml = function() {
	var method = arguments[0];
	var doc = [];
	doc.push('<methodCall>');
	doc.push('<methodName>' + method + '</methodName>');
	if(arguments.length > 1) {
		doc.push('<params>');
		for(var i = 1, len = arguments.length; i < len; i++) {
		    doc.push('<param><value>');
			this.serialize(arguments[i], doc);
			doc.push('</value></param>');
		}
		doc.push('</params>');
	}
	doc.push('</methodCall>');
	return doc.join('\n');
};

function pad(n){
    return n < 10 ? '0' + n : n;
};
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference:Global_Objects:Date
function ISODateString(d){
	return d.getUTCFullYear() + '-'
		+ pad(d.getUTCMonth() + 1) +'-'
	    + pad(d.getUTCDate()) + 'T'
	    + pad(d.getUTCHours()) + ':'
	    + pad(d.getUTCMinutes()) + ':'
	    + pad(d.getUTCSeconds()) + 'Z';
};

Client.prototype.serialize = function(data, d) {
	switch (data.constructor.name) {
	    case 'Array':
	        d.push('<array><data>');
	        for(var i = 0, len = data.length; i < len; i++) {
	            d.push('<value>');
	            this.serialize(data[i], d);
	            d.push('</value>');
	        }
	        d.push('</data></array>');
	        break;
	    case 'Object':
	        d.push('<struct>');
	        for(var i in data) {
	            d.push('<member>');
	            d.push('<name>' + i + '</name>');
	            d.push('<value>');
	            this.serialize(data[i], d);
	            d.push('</value>');
	            d.push('</member>');
	            
	        }
	        d.push('</struct>');
	        break;
	    case 'Number':
	        d.push('<int>' + data + '</int>');
	        break;
	    case 'String':
	        d.push('<string>' + escape(data) + '</string>');
	    	break;
	    case 'Date': 
	        d.push('<dateTime.iso8601>' + data.toISOString() + '</dateTime.iso8601>');
	        break;
	    case 'Boolean':
	        d.push('<boolean>' + (data ? '1' : '0') + '</boolean>');
	        break;
	    default:
	        d.push('<string>' + escape(data) + '</string>');
	        break;
	}
};

/**
 * rpc result parser
 * 
 * @param res
 * @returns
 */
Client.prototype.parse = function(res) {
    if(res.methodResponse) {
        res = res.methodResponse;
    }
    if(res.params) {
        res = res.params.param.value;
    } else if(res.fault) {
        res = res.fault.value;
    }
    return this._parse(res);
};

Client.prototype._parse = function(res) {
    for (var name in res) {
        if (name === 'struct') {
            var data = {};
            var members = res.struct.member;
            if(!members) {
                return data;
            }
            if(members.constructor.name !== 'Array') {
                members = [members];
            }
            for (var i = 0, l = members.length; i < l; i++) {
                var member = members[i];
                data[member.name] = this.parse(member.value);
            }
            return data;
        } else if (name === 'array') {
            var values = res.array.data.value;
            if(values.constructor.name !== 'Array') {
                values = [values];
            }
            var data = [];
            for (var i = 0, l = values.length; i < l; i++) {
                data[i] = this.parse(values[i]);
            }
            return data; 
        } else if (name === 'boolean') {
            return res[name] === '1';
        } else {
            return res[name];
        }
    }
};

exports.Client = Client;