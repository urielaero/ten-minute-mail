'use strict';

var request = require('request'),
    FileCookieStore = require('tough-cookie-filestore'),
    fs = require('fs-extra'),
    cheerio = require('cheerio'),
    uid = require('uid');

//cookie
var cookie = {};

cookie.getCookie = function(file){
    var jar = request.jar(new FileCookieStore(file));
    return jar;
};

cookie.loadCookies = function(){
    var file = fs.readJsonSync(api.cookiePath+'meta.json', {throws: false});
    if(!file)
        file = {};

    Object.keys(file).forEach(function(e, i){
        mail.info[e] = cookie.getCookie(api.cookiePath+file[e]);
    });
};

cookie.saveMeta = function(){
    fs.outputJsonSync(api.cookiePath+'meta.json', mail.ids, {throws: false});
};

cookie.clean = function(){
    var file = fs.readJsonSync(api.cookiePath+'meta.json', {throws: false});
    if(!file) return;
    Object.keys(file).forEach(function(e, i){
        fs.removeSync(api.cookiePath+file[e]);
        delete mail.info[e];
    });
    fs.removeSync(api.cookiePath+'meta.json');
};

//mail
var mail = {};

mail.info = {};
mail.ids = {};
mail.getInfo = function(emailCurrent, done){
    var jar = mail.info[emailCurrent],
    url = api.urlBase + api.urlIndex;
    if(!jar)
        return done(new Error('Cookie not found'));

    request.get({url: url, jar: jar}, function(err, res, body){
        if(err) return done(err);
        var $ = cheerio.load(body),
        table = $('#emailTable'),
        countMsg = $('#messageCount').text().trim(),
        expireMsg = $('#expirationTime').text().trim(),
        emailInPage = $('#copyAddress').attr('data-clipboard-text'),
        blocked = $('#leftpart h2 a').text() == 'Blocked'? true : false,
        expired = false;
        if(emailInPage != emailCurrent){
            expired = true;
            mail.ids[emailInPage] = mail.ids[emailCurrent];
            mail.info[emailInPage] = mail.info[emailCurrent];
        }
        if(!table)
            return done(null, []);

        var head =[]
        table.find('thead tr th').each(function(i, th){
            head.push($(th).text());
        });

        var objs = [];
        table.find('tbody tr').each(function(i, tr){
            var obj = {};
            $(tr).find('td').each(function(i, td){
                td = $(td);
                var pos = i % head.length,
                    val = td.text().trim();

                if(!val){
                    val = td.attr('disabled') == 'disabled'? true: false;
                }

                obj[head[pos].toLowerCase()] = val;

                var posUrl = td.find('a');
                if(posUrl.length){
                    obj.url = posUrl.attr('href');
                }

            });
            objs.push(obj);

        })

        done(null, {
            expiration: expireMsg,
            count: countMsg,
            inbox: objs,
            expired: expired,
            blocked: blocked,
            email: emailInPage
        });
    });
};

mail.getNew = function(done){
    var id = uid() + '.json',
    url = api.urlBase + api.urlIndex;
    api.cookie(api.cookiePath+id, function(err, jar){
        if(err) return done(err);

        request.get({url: url, jar: jar } , function(err, res, body){
            if(err) return done(err);

            var $ = cheerio.load(body),
            email = $('#copyAddress').attr('data-clipboard-text');
            if(!email || email == '')
                return done(new Error('Email not found'));

            if(!mail.ids[email]){
                mail.info[email] = jar;
                mail.ids[email] = id;
            }

            done(null, email);
        });
    });
};

//inbox

var inbox = {};

inbox.get = function(email, url, done){
    var jar = mail.info[email];
    request.get({url: url, jar: jar}, function(err, code, body){
        if(err) return done(err);
        var $ = cheerio.load(body),
        msg = $('div[dir="ltr"]').text();
        done(null, msg);
    });

};

//public api
var api = exports = module.exports = {};

api.version = '0.0.1';
api.cookiePath = 'cookies/';
api.urlBase = 'http://10minutemail.com';
api.urlIndex = '/10MinuteMail/index.html';


//block!
api.reloadCookies = cookie.loadCookies;
api.deleteCookies = cookie.clean;
api.saveCookies = cookie.saveMeta;
api.reloadCookies();

api.cookie = function(file, done){
    fs.ensureFile(file, function(err){
        var jar = cookie.getCookie(file);
        done(null, jar);
    });
};

api.existCookie = function(email){
    return mail.info[email] || false;
}

api.mail = function(email, done){
    if(!done){
        done = email;
        email = false;
    }

    if(email){
        mail.getInfo(email, done);
    }else{
        mail.getNew(done);
    }
};

api.inbox = function(email, index, done){
    if(!done){
        done = index;
        index = 0;
    }
    function postExec(email, info){
            var inboxInfo = info.inbox[index];
            if(!inboxInfo)
                return done(new Error('index err'));

            inbox.get(email, api.urlBase + inboxInfo.url, done);
    };

    if(email.split){
        api.mail(email, function(err, info){
            if(err) return done(err);
            postExec(email, info);
        });
    }else{
        postExec(email.email, email)
    }
};
