var should = require('should'),
    mockery = require('mockery'),
    sinon = require('sinon'),
    fs = require('fs-extra'),
    request = require('request');

describe('tenMinuteMailApi', function(){

    var api, stubFsEnsureFile , stubFileCookieStore, stubRequest;

    before(function(){
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
            useCleanCache: true
        });

        stubFsEnsureFile = sinon.stub(fs, 'ensureFile');
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
        it('should return exist or new cookie', function(done){
            stubFsEnsureFile.yields(null);
            stubFileCookieStore.returns({});
            api.cookie('name.json', function(err, jar, req){
                should.not.exist(err);
                stubFsEnsureFile.called.should.be.ok();
                stubFileCookieStore.called.should.be.ok();
                jar._jar.should.be.an.instanceOf(Object);
                req.should.be.an.instanceOf(Object);
                done();
            });
        });
    });

    describe('mail', function(){

        var html,
        emailTest = 'g7522207@trbvm.com';
        before(function(){
            html = fs.readFileSync('test/10minutemail.html', 'utf-8');
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
                    'Leído': false,
                    De: 'aero.uriel@gmail.com',
                    Asunto: 'asunto 1',
                    'Vista Previa': 'cuerpo 1',
                    Fecha: 'Jul 24, 2015 3:17:46 AM'
                },
                {
                    'Leído': false,
                    De: 'aero.uriel@gmail.com',
                    Asunto: 'nuevo asunto 2',
                    'Vista Previa': 'hola uriel :D',
                    Fecha: 'Jul 24, 2015 3:18:10 AM'
                }
            ];

            api.mail(emailTest, function(err, res){
                res.should.be.an.instanceOf(Array);
                res.should.be.eql(esp);
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

    });

});
