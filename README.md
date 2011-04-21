# MetaWeblog API on Nodejs

## Install

    $ npm install metaweblog
  
## Usage

    var MetaWeblog = require('metaweblog').MetaWeblog;
    // use http://cnblogs.com
    var blog = new MetaWeblog('http://www.cnblogs.com/fengmk2/services/metaweblog.aspx');
    blog.getUsersBlogs('fawave', 'fengmk2', 'xxx', function(err, bloginfos) {
        console.log(bloginfos);
    });