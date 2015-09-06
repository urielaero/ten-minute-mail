var should = require('should'),
    mockery = require('mockery'),
    sinon = require('sinon'),
    fs = require('fs-extra'),
    request = require('request');

describe('tenMinuteMailApi', function(){

    var api,
        stubFileCookieStore,
        stubRequest,
        stubFsEnsureFile,
        stubFsReadJsonSync,
        stubFsRemoveSync,
        stubFsOutputJsonSync;

    before(function(){
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        stubFsEnsureFile = sinon.stub(fs, 'ensureFile');
        stubFsReadJsonSync = sinon.stub(fs, 'readJsonSync');
        stubFsRemoveSync = sinon.stub(fs, 'removeSync');
        stubFsOutputJsonSync = sinon.stub(fs, 'outputJsonSync');
        stubFileCookieStore = sinon.stub();
        stubRequest = sinon.stub(request, 'get');

        //stubRequest = sinon.stub(request);
        mockery.registerMock('tough-cookie-filestore', stubFileCookieStore);
        mockery.registerMock('fs-extra', fs);
        mockery.registerMock('request', request);


        api = require('../lib/tenMinuteMailApi');
    });

    describe('version', function(){
        it('should content version', function(){
            api.version.should.be.equal('0.0.1');
        });
    });

    describe('cookie', function(){
        describe('get/set', function(){
            it('should return exist or new cookie', function(done){
                stubFsEnsureFile.yields(null);
                stubFileCookieStore.returns({});
                api.cookie('name.json', function(err, jar){
                    should.not.exist(err);
                    stubFsEnsureFile.called.should.be.ok();
                    stubFileCookieStore.called.should.be.ok();
                    jar.should.be.an.instanceOf(Object);
                    done();
                });
            });

        });

        describe('load', function(){
            it('load cookies from path, if exist', function(){
                stubFsReadJsonSync.returns({
                    'unmail@trb.com': 'unid.json'
                });
                api.reloadCookies();
                var req = api.existCookie('unmail@trb.com');
                req.should.be.an.instanceOf(Object)
            });

            it('should clean of cookie directory', function(){
                stubFsReadJsonSync.returns({
                    'unmail@trb.com': 'unid.json'
                });
                stubFsRemoveSync.returns(true);
                api.reloadCookies();
                api.deleteCookies();
                var req = api.existCookie('unmail@trb.com');
                req.should.be.equal(false);
            });

            it('empty list if no exist meta.json', function(){
                api.deleteCookies();
                stubFsReadJsonSync.returns(null);
                api.reloadCookies();
                var req = api.existCookie('unmail@trb.com');
                req.should.be.equal(false);
            });
        });

    });

    describe('mail', function(){

        var html,
        html2,
        emailTest = 'g7522207@trbvm.com';
        before(function(){
            html = fs.readFileSync('test/html/10minutemail.html', 'utf-8');
            html2 = fs.readFileSync('test/html/10minutemail2.html', 'utf-8');
        });

        it('should return new email', function(done){
            stubRequest.yields(null, {}, html);
            api.mail(function(err, email){
                should.not.exist(err);
                email.should.be.equal(emailTest);
                done();
            });
        });

        it('should return info of email', function(done){
            stubRequest.yields(null, {}, html);
            var esp = [
                {
                    'leído': false,
                    de: 'aero.uriel@gmail.com',
                    asunto: 'asunto 1',
                    'vista previa': 'cuerpo 1',
                    fecha: 'Jul 24, 2015 3:17:46 AM',
                    url: '/10MinuteMail/index.html?dataModelSelection=message%3Aemails%5B0%5D&actionMethod=index.xhtml%3AmailQueue.select'
                },
                {
                    'leído': false,
                    de: 'aero.uriel@gmail.com',
                    asunto: 'nuevo asunto 2',
                    'vista previa': 'hola uriel :D',
                    fecha: 'Jul 24, 2015 3:18:10 AM',
                    url: '/10MinuteMail/index.html?dataModelSelection=message%3Aemails%5B1%5D&actionMethod=index.xhtml%3AmailQueue.select'
                }
            ];

            api.mail(emailTest, function(err, res){
                res.should.be.an.instanceOf(Object);
                res.inbox.should.be.eql(esp);
                res.count.should.be.equal('Actualmente tienes 2 mensajes.');
                res.expiration.should.be.equal('Tu dirección de correo expirará en 9 minutos.');
                done();
            });
        });


        it('should return expired msg and save new cookie', function(done){
            stubRequest.yields(null, {}, html2);
            api.mail(emailTest, function(err, res){
                res.should.be.an.instanceOf(Object);
                res.expired.should.be.equal(true);
                res.email.should.be.equal('g7522208@trbvm.com');
                var jar = api.existCookie('g7522208@trbvm.com');
                jar.should.be.not.equal(false)
                done();
            });

        });

        it('should return err', function(done){
            stubRequest.yields(null, {}, '<html> </html>');
            api.mail(function(err, email){
                err.should.be.an.instanceOf(Error);
                should.not.exist(email);
                done();
            });
        });

        describe('saveCookies with mails', function(){
            it('create/rewrite meta.json with cookies', function(done){
                stubRequest.yields(null, {}, html);
                stubFsOutputJsonSync.returns(true);
                api.mail(function(err, email){
                    api.saveCookies();
                    stubFsOutputJsonSync.called.should.be.equal(true);
                    done();
                });
            });
        });


        describe('inbox', function(){
            before(function(){
                var jar = api.existCookie(emailTest),
                htmlInbox = fs.readFileSync('test/html/10minutemailBox.html', 'utf-8');
                stubRequest.withArgs({url: 'http://10minutemail.com/10MinuteMail/index.html', jar: jar}).yieldsAsync(null, {}, html);
                stubRequest.withArgs({url: 'http://10minutemail.com/10MinuteMail/index.html?dataModelSelection=message%3Aemails%5B0%5D&actionMethod=index.xhtml%3AmailQueue.select', jar:jar }).yieldsAsync(null, {c:200}, htmlInbox);
            });

            it('should return msg from inbox @param string', function(done){
                api.inbox(emailTest, 0, function(err, msg){
                    should.not.exist(err);
                    msg.should.be.an.instanceOf(String).and.equal('cuerpo 1');
                    done();
                });
            });

            it('should return msg from inbox @param Object info', function(done){
                api.mail(emailTest, function(err, info){
                    api.inbox(info, 0, function(err, msg){
                        should.not.exist(err);
                        msg.should.be.an.instanceOf(String).and.equal('cuerpo 1');
                        done();
                    });
                });
            });

            it('should return msg from inbox @param Object info default 0', function(done){
                api.mail(emailTest, function(err, info){
                    api.inbox(info, function(err, msg){
                        should.not.exist(err);
                        msg.should.be.an.instanceOf(String).and.equal('cuerpo 1');
                        done();
                    });
                });

            });
        });

    });

});
