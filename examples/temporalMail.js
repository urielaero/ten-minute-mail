var tenMinuteMail = require('../lib/tenMinuteMailApi.js'),
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
    console.log('use: ');
    console.log('\tGenerate temporal email and save cookie:');
    console.log('\t\tnode temporalMail.js get');
    console.log('\tShow info from email');
    console.log('\t\tnode temporalMail.js show g7570876@exampleemail.com');
    console.log('\tShow first inbox of email');
    console.log('\t\tnode temporalMail.js inbox g7570876@exampleemail.com ');
    console.log('\tClean cookies');
    console.log('\t\tnode temporalMail.js clean');
}
