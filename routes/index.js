var express = require('express');
var router = express.Router();
var db = require('monk')('localhost:27017/test');
var userData  = db.get('demoMongo');


/////////////////////////////////////////////////SCRAING FUNCTIONS///////////////////////////////////////////////////////
function getLastNumberPage(url,options,callback){
  request(url,options,(error,response,html) => {  
    if(!error && response.statusCode == 200){
      var $ = cheerio.load(html);

      var lastUrlPage = $("li.nav-pageitem").last().text()

      console.log("estoy en getlastnumberPage")
      /////////////////////////////////////////////////////////callback(2)
      callback(lastUrlPage)


    }else
    console.log(response)
  })
}

function getLastUrlPage(url,options,callback){
  request(url,options,(error,response,html) => {  
    if(!error && response.statusCode == 200){
      var $ = cheerio.load(html);

      var number = $('li .nav-next').prop('href')

      callback(number)


    }else
    console.log(response)
  })
}

function exractLastPage(url,callback){
  request(url,function(error,response,html){
    if(!error && response.statusCode ==200){
      var $ = cheerio.load(html);
      var listUrls = [];


    }
  })
}



function extractAllPages(url,options,callback){
  request(url,options,(error,response,html) => {  
    if(!error && response.statusCode ==200){
      var $ = cheerio.load(html);
      var urlList = [];

      /////////////////////////////////var lis = $("a.memName").get()
      var lis = $("a.memName").get()
      //var lis = [];
      //lis.push($("a.memName").eq(0).get())
      //lis.push($("a.memName").eq(1).get())
      lis.forEach(function(elem){
        urlList.push($(elem).attr('href'))
      })

      callback(urlList)

    }else
    console.log(response)
  })
}

function extractDetails(url,options,callback){
  request(url,options,(error,response,html) => {  
    if(!error && response.statusCode == 200){
      var $ = cheerio.load(html);

      var userDetails = {}
      //user id
      var sizeId = url.length - iniUrlSize
      userDetails.id = url.substr(iniUrlSize,sizeId - 1)
      //name
      userDetails.name = $("span.memName.fn").text()
      //url
      userDetails.url = url
      //roll
      userDetails.roll = $(".text--reset.text--secondary.flush--bottom").text().trim()
      if(userDetails.roll == ""){
        userDetails.roll = "Participant"
      }

      //locality
      userDetails.locality = $("span.locality").first().text().trim()
      //localityLink
      userDetails.localityLink = $("div.D_memberProfileContentItem p a").attr('href')
      //Region
      userDetails.region = $("span.region").first().text().trim()
      //Oigin city 
      var originCity = $('span.D_less.small').text();
      userDetails.originCity = originCity.replace('Ciudad de origen:','').trim()


      //Social MEDIA
      var socialMedia = {
        facebook:"",
        twitter:"",
        linkedin:""
      }
      var everySocialMedia = $("ul.inlineList.clearfix a").get()
      everySocialMedia.forEach(function(itemSocialMedia){
        //Facebook
        if($(itemSocialMedia).attr("title").indexOf('Facebook') > -1){
          socialMedia.facebook = $(itemSocialMedia).attr('href')
        }
        //twitter
        if($(itemSocialMedia).attr("title").indexOf('Twitter') > -1){
          socialMedia.twitter = $(itemSocialMedia).attr('href')
        }
        //Facebook
        if($(itemSocialMedia).attr("title").indexOf('Linkedin') > -1){
          socialMedia.linkedin = $(itemSocialMedia).attr('href')
        }
      })
      userDetails.socialMedia = socialMedia


      //General Description
      userDetails.description = $("div.D_memberProfileContentItem p").eq(2).text().trim()
      //image
      userDetails.image= $("img.D_memberProfilePhoto.photo.big-preview-photo").attr('src')

      //Interests
      var everyinterest = $("a.topic-widget").get()
      var listInterest = {}
      everyinterest.forEach(function(interest){
        listInterest[$(interest).text()] = $(interest).prop('href')
      })
      userDetails.listInterest = listInterest 

      //Another meetUps groups
      var everyMeetUps = $("div.figureset-description").get()


      everyMeetUps.forEach(function(itemMeetUp){

      /////////////////////////////////////////////SELECICION DESPUES DE UNA SALECION /////////////////////////////////////
        //console.log($(this+".text--small.text--secondary").text())
      })
  //////////////////////////////////////////SIMULAR PAGINA SIN QUE CAMBIE LA URL///////////////////////////////////////////

      callback(userDetails)

    }else

    console.log(response)
  });
}

var request = require('request');
var cheerio = require('cheerio');
var countries = require('countries-cities');

//Array with routes info

listItmes = {santiago:{
  field: 'tech',
  city: 'Santiago',
  meetup: 'Javascript-Chile'
}}



var listSrcDst = [];
//listSrcDst.push({"src":Madrid,"dst": Barcelona})
var urlSeed = "https://www.meetup.com/es-ES/Javascript-Chile/members/"; 
var iniUrlSize = urlSeed.length;
var options = {
  headers: {
    'User-Agent': 'node.js'
  }
}



//////////////////////////////////////////////END SCRAPING FUNCTIONS////////////////////////////////////////////////////





/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index');
});

router.get('/get-data', function(req, res, next) {
  var data = userData.find({});
  data.on('success', function(docs) {
    res.render('index', {items: docs});
  });
});

router.post('/insert', function(req, res, next) {

  //extraction of lastUrl
  getLastUrlPage(urlSeed,options,function(lastUrl){
    //extraction of the last page
    getLastNumberPage(lastUrl,options,function(number){
      var listUrlsPages = []
      console.log("Url pages: ")
      //back up of every page url
      for(var i = 0; i < number ; i++){
        listUrlsPages.push("https://www.meetup.com/es-ES/"+listItmes.santiago.meetup+"/members/?offset="+i*20+"&sort=last_visited&desc=1");
      }
      console.log(listUrlsPages)
      //We reach every URL
      var pending = listUrlsPages.length;
      console.log("All URLs start")
      listUrlsPages.forEach(function(url){
        listAllUrls = [];
        // We extract every URL and save it in listAllUrls
        extractAllPages(url,options, function(urls){
          listAllUrls.push(urls);
          console.log(urls)
          if(--pending === 0){
            var totalPending = 0, varTotalPending = 0;
            // We calculate the members number
            for(var i = 0; i<listUrlsPages.length; i++){
              varTotalPending += listAllUrls[i].length;
            }
            totalPending = varTotalPending;
            var porcentage = 0;
            console.log("total pending: "+varTotalPending)
            var listUserDetails = []
            listAllUrls.forEach(function(listUrls){
              listUrls.forEach(function(url){ 
                listEveryDetail = [];
                extractDetails(url,options, function(details){
                  listEveryDetail.push(details);
                  porcentage = ((((totalPending+1) - varTotalPending) / totalPending) * 100 )

                  console.log(porcentage+"% scrapped")
                  if(--varTotalPending === 0){
                    userData.remove({})
                    userData.insert(listEveryDetail);
                    res.redirect('/');   
                    //console.log("ya he terminado")                   
                  }
                })
              })
            })
          }
        })
      })  
    })
  })

/*
  var item = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  };

  userData.remove({})
  userData.insert(item);

  res.redirect('/');

*/
});

router.post('/update', function(req, res, next) {
  var item = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  };
  var id = req.body.id;

  // userData.update({"_id": db.id(id)}, item);
  userData.updateById(id, item);
});

router.post('/delete', function(req, res, next) {
  var id = req.body.id;

  // userData.remove({"_id": db.id(id)});
  userData.removeById(id);
});

module.exports = router;
