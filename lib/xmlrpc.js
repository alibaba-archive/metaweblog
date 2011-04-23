/**
 * Module dependencies.
 */

var libxml = require('libxmljs')
  , http = require('http')
  , https = require('https')
  , urlutil = require('url');

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
			for(var i=0, pos=0, size=chunks.length; i<size; i++) {
				chunks[i].copy(data, pos);
				pos += chunks[i].length;
			}
			data = data.toString();
			//console.log(data, res.headers)
			if(res.statusCode == 200 || res.statusCode == 201) {
				data = that.parse(libxml.parseXmlString(data));
				if(data && data.faultString) {
					error = data;
					error.message = error.faultString;
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
 * @param {String} method
 * @param param1, param2, ...
 * @return {String} xml string
 * @api public
 */
Client.prototype.get_xml = function() {
	var method = arguments[0];
	var doc = new libxml.Document();
	var d = doc.node('methodCall')
    	.node('methodName', method)
    	.parent();
	if(arguments.length > 1) {
		d = d.node('params');
		for(var i = 1, len = arguments.length; i < len; i++) {
			this.serialize(arguments[i], d.node('param').node('value'));
		}
	}
	return doc.toString();
};

// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference:Global_Objects:Date
function ISODateString(d){
	function pad(n){return n < 10 ? '0' + n : n};
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
	        var data_xml = d.node('array').node('data');
	        for(var i = 0, len = data.length; i < len; i++) {
	            this.serialize(data[i], data_xml.node('value'));
	        }
	        break;
	    case 'Object':
	        var struct_xml = d.node('struct');
	        for(var i in data) {
	            this.serialize(data[i], struct_xml.node('member').node('name', i).parent().node('value'));
	        }
	        break;
	    case 'Number':
	        d.node('int', data.toString());
	        break;
	    case 'String':
	    	d.node('string', data);
	    	break;
	    case 'Date': 
	    	d.node('dateTime.iso8601', data.toISOString());
	    case 'Boolean':
	    	d.node('boolean', data ? '1' : '0');
	    default:
	        d.node('string', data.toString());
	}
};

Client.prototype.parse = function(xml) {
	var childNodes;
    if(xml.constructor.name === 'Array') {
        childNodes = xml;
    } else {
        childNodes = xml.childNodes();
    }
    for (var i = 0, len = childNodes.length; i < len; i ++) {
    	var child = childNodes[i];
    	var name = child.name();
        if (name === 'struct') {
            var members = child.find('member');
            var data = {};
            for (var m in members) {
                var k = members[m].find('name')[0].text();
                data[k] = this.parse(members[m].find('value/*'));
            }
            return data;
        } else if (name === 'array') {
            var values = child.find('data/value');
            var data = [];
            for (var v in values) {
            	data[v] = this.parse(values[v]);
            }
            return data; 
        } else if (name === 'string' || name === 'int' || name === 'i4' ||
        		name === 'dateTime.iso8601' || name === 'double') {
            return child.text();
        } else if (name === 'boolean') {
        	return child.text() === '1';
        } else if (name !== 'text') {
            return this.parse(child);
        }
    }
};

exports.Client = Client;