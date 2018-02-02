[![Build Status](https://travis-ci.org/urielaero/ten-minute-mail.svg)](https://travis-ci.org/urielaero/ten-minute-mail)

## DEPRECATED! - api outdated because the site updated its interface.

## Installation

```
$ npm install ten-minute-mail --save
```

## Node.js, io.js
```js
var tenMinuteMail = require('ten-minute-mail');
```

## Example
[examples/temporalMail.js](https://github.com/urielaero/ten-minute-mail/blob/master/examples/temporalMail.js)

```js
var tenMinuteMail = require('ten-minute-mail'),
    action = process.argv[2],
    email = process.argv[3];

if(action == 'get'){
    //get new temporal mail
    tenMinuteMail.mail(function(err, email){
        console.log(err, email);
        //save cookies in file system. Sync.
        tenMinuteMail.saveCookies();
    });

}else if(action == 'show' && email){
    //show info
    tenMinuteMail.mail(email, function(err, info){
        console.log(err, info)
    });

}else if(action == 'inbox' && email){
    //show msg, index default 0
    tenMinuteMail.inbox(email, 0, function(err, msg){
        console.log(err, msg);
    });
}else if(action == 'clean'){
    // Clean old cookies sync.
    tenMinuteMail.deleteCookies();
    console.log('success');
}else{
    //...
}

```

## Api

### `tenMinuteMail.version`
A string representing the semantic version number.

### `tenMinuteMail.mail(callback)`
This method creates temporal mail and run callback(err, newEmailInfo).

### `tenMinuteMail.mail(email, callback)`
This method read the info of email and run callback(err, emailInfo).

### `tenMinuteMail.inbox(email, [index], callback)`
This method read msg from email inbox and run callback(err, msg). Index is an msg number default to 0.

### `tenMinuteMail.inbox(emailInfo, [index], callback)`
This method read msg from emailInfo object from tenMinuteMail.mail and run callback(err, msg).

### `tenMinuteMail.cookiePath`
A string representing the path of cookies. default currentScript/cookies/

### `tenMinuteMail.cookie(file, callback)`
This method creates and save in tenMinuteMail.cookiePath/file.json a new cookie see: [request cookie](https://github.com/request/request#examples)

### `tenMinuteMail.saveCookies()`
This method save the info of tenMinuteMail.cookie(file, callback)  in the path tenMinuteMail.cookiePath/meta.json for future use. (Sync)

### `tenMinuteMail.reloadCookies()`
This method reload the cookie from the path tenMinuteMail.cookiePath/meta.json and related files. (Sync)

### `tenMinuteMail.deleteCookies()`
This method removes all files from the path tenMinuteMail.cookiePath. (Sync)

### `tenMinuteMail.existCookie(email)`
This method returns the cookie (type jar) of email if exist or false.

### `tenMinuteMail.urlBase`
A string representing the base url.

### `tenMinuteMail.urlIndex`
A string representing the url to get a new email.

## Test

```
$ npm install
```
```
$ npm test
```
