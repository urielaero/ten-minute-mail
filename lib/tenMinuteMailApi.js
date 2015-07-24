'use strict';

var request = require('request'),
    FileCookieStore = require('tough-cookie-filestore'),
    fs = require('fs-extra'),
    cheerio = require('cheerio'),
    uid = require('uid');

//cookie
var cookie = {};

cookie.getCookie = function(file, done){
    var jar = request.jar(new FileCookieStore(file)),
    req = request.defaults({ jar: jar});
    done(null, jar, req);
};

//mail
var mail = {};

mail.info = {};

mail.getInfo = function(email, done){
    var req = mail.info[email];
    if(!req)
        return done(new Error('Cookie not found'));

    req.get(api.url, function(err, res, body){
        if(err) return done(err);

        var $ = cheerio.load(body),
        table = $('#emailTable');
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

                obj[head[pos]] = val;
            });
            objs.push(obj);

        })

        done(null, objs);
    });
};

mail.getNew = function(done){
    var id = uid();
    api.cookie('cookies/'+id+'.json', function(err, jar, req){
        if(err) return done(err);

        req.get(api.url, function(err, res, body){
            if(err) return done(err);

            var $ = cheerio.load(body),
            email = $('#copyAddress').attr('data-clipboard-text');
            if(!email || email == '')
                return done(new Error('Email not found'));

            mail.info[email] = req;

            done(null, email);
        });
    });
};

var api = exports = module.exports = {};

api.version = '0.0.1';

api.url = 'http://10minutemail.com/10MinuteMail/index.html';

api.cookie = function(file, done){

    fs.ensureFile(file, function(err){
        cookie.getCookie(file, done);
    });

};

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

/*
api.mail(function(err, email){
    console.log(email);
})
*/
