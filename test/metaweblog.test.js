/**
 * Module dependencies.
 */

var MetaWeblog = require('../lib/metaweblog').MetaWeblog;

var blog = new MetaWeblog('http://www.cnblogs.com/fengmk2/services/metaweblog.aspx');

blog.getUsersBlogs('fawave', 'fengmk2', 'xxx', function(err, data) {
	console.log(data);
});