var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public'));

//Database configuration
mongoose.connect('mongodb://localhost/nvaScraper');
var db = mongoose.connection;

db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});
db.once('open', function() {
    console.log('Mongoose connection successful.');
});

//Require Schemas
var Addresses = require('./models/Address.js');;

// Routes
app.get('/', function(req, res) {
    res.send(index.html);
});

var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

// using firefox to eliminate addon usage
var driver = new webdriver.Builder()
    .forBrowser('firefox')
    .build();

//open up our starting page
driver.get('localhost:3000');

//app.get('/selenium', function(req, res) {

//grab initial elements and fill out criteria
driver.get('https://www.e-nva.com/nva/content/tourist/JSFPEntryTouristPage.jsf');

setTimeout(function() {
        //fill out form criteria to tailor our search
        driver.findElement(By.name('content:FindProvider:strProviderZipCode')).sendKeys('10018');
        driver.findElement(By.css('.mainContent > option:nth-child(4)')).click();
        driver.findElement(By.css('.plansDropDown > option:nth-child(2)')).click();
        driver.findElement(By.id('content:FindProvider:btnFindProviderSearch1')).click();

        //wait until we are past the loading screen
        driver.wait(function() {
                return driver.findElement(By.id('content:FindProvider:dTblProviders')).isDisplayed()
            }, 200000, 'failed to load after 200 seconds').then(
                saveInfo => {
                    setTimeout(function() {

                        var siteStore = {

                                //set nums to help handle different pages
                                pageNum: 2,
                                breakNum: 126,
                                maxListNum: 10,
                                minListNum: 0,
                                //set null object for future mongo storage
                                result: {},
                                grabData: function() {
                                    //store addresses found
                                    for (var b = siteStore.minListNum; b < siteStore.maxListNum; b++) {

                                        driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtProName')).getText()
                                            //find name and store into result
                                            .then(providerName => {
                                                siteStore.result.name = providerName.toString()
                                                console.log(result.name)
                                            }, function(err) {
                                                console.log('Name not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                            })

                                        driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtAddressVal')).getText()
                                            //find address and store into result
                                            .then(providerAddress => {
                                                siteStore.result.address = providerAddress.toString()
                                                console.log(result.address)
                                            }, function(err) {
                                                console.log('Address not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                            })

                                        driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtCityVal')).getText()
                                            //find city and store into result
                                            .then(providerCity => {
                                                siteStore.result.city = providerCity.toString()
                                                console.log(result.city)
                                            }, function(err) {
                                                console.log('City not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                            })

                                        driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtStateVal')).getText()
                                            //find state and store into result
                                            .then(providerState => {
                                                siteStore.result.state = providerState.toString()
                                                console.log(result.state)
                                            }, function(err) {
                                                console.log('State not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                            })

                                        driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtZipVal')).getText()
                                            //find zip and store into result
                                            .then(providerZip => {
                                                siteStore.result.zipCode = providerZip.toString()
                                                console.log(result.zipCode)
                                            }, function(err) {
                                                console.log('Zip not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                            })

                                        driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtPhoneVal')).getText()
                                            //find phone number and store into result
                                            .then(providerPhoneNum => {
                                                siteStore.result.phone = providerPhoneNum.toString()
                                                console.log(result.phone)
                                            }, function(err) {
                                                console.log('Phone number not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                            })
                                        //iniate save to our mongodb collection Addresses
                                        var entry = new Addresses(siteStore.result);

                                        entry.save(function(err, doc) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                console.log(doc);
                                            }
                                        });
                                    }

                                    //cancel data store if max page result filter number is met
                                    if (siteStore.pageNum === siteStore.breakNum) {
                                        return siteStore.clearTimer();
                                    }
                                    //go to the next page to display more data
                                    driver.findElement(By.id('content:FindProvider:dataScrolleridx' + siteStore.pageNum)).click();
                                    //set our incrementers to coincide with the page that's called next
                                    siteStore.pageNum++;
                                    siteStore.maxListNum += 10;
                                    siteStore.minListNum += 10;
                                },
                                //clear data storing function interval
                                clearTimer: function() {
                                    clearInterval(siteStore.grabData);
                                    //driver.quit();
                                },
                                createInterval: function() {
                                    setInterval(siteStore.grabData, 3000);
                                }
                            }
                            //call data store function per seven seconds
							siteStore.createInterval();
                    });
                }, 11000) // eleven seconds after address results page
    }, 7000) // three seconds for intial page to load
    //	})

app.listen(3000, function() {
    console.log('App running on port 3000!');
});