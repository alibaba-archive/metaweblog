/**
 * Module dependencies.
 */

var Client = require('./xmlrpc').Client;

/**
 * MetaWeblog API
 * 
 * @param {String} rpc_url, the rpc api url, like `http://www.cnblogs.com/fengmk2/services/metaweblog.aspx`
 * @api public
 */
var MetaWeblog = exports.MetaWeblog = function(rpc_url) {
	this.client = new Client(rpc_url);
};

/**
 * Data struct detail
 * 
 * struct BlogInfo
 *  - {String} blogid
 *  - {String} url
 *  - {String} blogName
 * 	
 * struct Post
 *  - {Date} dateCreated - Required when posting.
 *  - {String} description - Required when posting.
 *  - {String} title - Required when posting.
 *  - {Array} categories (optional), array of string
 *  - {Object} enclosure (optional), struct Enclosure
 *  - {String} link (optional)
 *  - {String} permalink (optional)
 *  - {Any} postid (optional)
 *  - {Object} source (optional), struct Source
 *  - {String} userid (optional)
 *  - {Any} mt_allow_comments (optional)
 *  - {Any} mt_allow_pings (optional)
 *  - {Any} mt_convert_breaks (optional)
 *  - {String} mt_text_more (optional)
 *  - {String} mt_excerpt (optional)
 *  
 * struct CategoryInfo
 *  - {String} description
 *  - {String} htmlUrl
 *  - {String} rssUrl
 *  - {String} title
 *  - {String} categoryid
 *  
 * struct FileData
 *  - {String} bits, base64
 *  - {String} name
 *  
 * struct UrlData
 *  - {String} url
 *  
 * struct Enclosure
 *  - {Integer} length (optional)
 *  - {String} type (optional)
 *  - {String} url (optional)
 *  
 * struct Source
 *  - {String} name (optional)
 *  - {String} url (optional)
 *  
 */

/**
 * Deletes a post.
 * 
 * @param {String} appKey
 * @param {String} postid
 * @param {String} username
 * @param {String} password
 * @param {Boolean} publish - Where applicable, this specifies whether 
 * 	   the blog should be republished after the post has been deleted.
 * @return {Boolean} Always returns true.
 * @api public
 */
MetaWeblog.prototype.deletePost = 
		function(appKey, postid, username, password, publish, callback) {
	this.client.request('blogger.deletePost', 
		appKey, postid, username, password, publish, callback);
};

/**
 * Returns information on all the blogs a given user is a member.
 * 
 * @param {String} appKey
 * @param {String} username
 * @param {String} password
 * @return {Array} array of struct `BlogInfo`
 * @api public
 */
MetaWeblog.prototype.getUsersBlogs = 
		function(appKey, username, password, callback) {
	this.client.request('blogger.getUsersBlogs', 
		appKey, username, password, callback);
};

/**
 * Updates and existing post to a designated blog using the metaWeblog API. 
 * Returns true if completed.
 * 
 * @param {String} postid
 * @param {String} username
 * @param {String} password
 * @param {Object} post, struct `Post`
 * @param {Boolean} publish
 * @return {Boolean}
 * @api public
 */
MetaWeblog.prototype.editPost = 
		function(postid, username, password, post, publish, callback) {
	this.client.request('metaWeblog.editPost', 
		postid, username, password, post, publish, callback);
};


/**
 * Retrieves a list of valid categories for a post using the metaWeblog API. 
 * Returns the metaWeblog categories struct collection.
 * 
 * @param {String} blogid
 * @param {String} username
 * @param {String} password
 * @return {Array} array of struct `CategoryInfo`
 * @api public
 */
MetaWeblog.prototype.getCategories = 
		function(blogid, username, password, callback) {
	this.client.request('metaWeblog.getCategories', 
			blogid, username, password, callback);
};

/**
 * Retrieves an existing post using the metaWeblog API. 
 * Returns the metaWeblog struct.
 * 
 * @param {String} postid
 * @param {String} username
 * @param {String} password
 * @return {Object} struct `Post`
 * @api public
 */
MetaWeblog.prototype.getPost = 
		function(postid, username, password, callback) {
	this.client.request('metaWeblog.getPost', 
			postid, username, password, callback);
};

/**
 * Retrieves a list of the most recent existing post using the metaWeblog API. 
 * Returns the metaWeblog struct collection.
 * 
 * @param {String} blogid
 * @param {String} username
 * @param {String} password
 * @param {Integer} numberOfPosts
 * @return {Array} array of struct `Post`
 * @api public
 */
MetaWeblog.prototype.getRecentPosts = 
		function(blogid, username, password, numberOfPosts, callback) {
	this.client.request('metaWeblog.getRecentPosts', 
			blogid, username, password, numberOfPosts, callback);
};

/**
 * Makes a new file to a designated blog using the metaWeblog API. 
 * Returns url as a string of a struct.
 * 
 * @param {String} blogid
 * @param {String} username
 * @param {String} password
 * @param {Object} file, struct `FileData`
 * @return {Object} struct `UrlData`
 * @api public
 */
MetaWeblog.prototype.newMediaObject = 
		function(blogid, username, password, file, callback) {
	this.client.request('metaWeblog.newMediaObject', 
			blogid, username, password, file, callback);
};

/**
 * Makes a new post to a designated blog using the metaWeblog API. 
 * Returns postid as a string.
 * 
 * @param {String} blogid
 * @param {String} username
 * @param {String} password
 * @param {Object} post, struct `Post`
 * @return {String} new post id
 * @api public
 */
MetaWeblog.prototype.newPost = 
		function(blogid, username, password, post, callback) {
	this.client.request('metaWeblog.newPost', 
			blogid, username, password, post, callback);
};