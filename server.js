var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public'));

//Database configuration
mongoose.connect('mongodb://localhost/nvaScraper');
var db = mongoose.connection;

db.on('error', function (err) {
    console.log('Mongoose Error: ', err);
});
db.once('open', function () {
    console.log('Mongoose connection successful.');
});

//Require Schemas
var Addresses = require('./models/Address.js');;

// Routes
app.get('/', function (req, res) {
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

setTimeout(function () {
    //fill out form criteria to tailor our search
    driver.findElement(By.name('content:FindProvider:strProviderZipCode')).sendKeys('10018');
    driver.findElement(By.css('.mainContent > option:nth-child(4)')).click();
    driver.findElement(By.css('.plansDropDown > option:nth-child(2)')).click();
    driver.findElement(By.id('content:FindProvider:btnFindProviderSearch1')).click();

    //wait until we are past the loading screen
    driver.wait(function () {
        return driver.findElement(By.id('content:FindProvider:dTblProviders')).isDisplayed()
    }, 200000, 'failed to load after 200 seconds').then(
        saveInfo => {
            setTimeout(function () {

                var siteStore = {

                    //set nums to help handle different pages
                    pageNum: 1,
                    breakNum: 126,
                    maxListNum: 9,
                    minListNum: 0,
                    grabData: function () {
                        //store addresses found
                        for (var b = siteStore.minListNum; b < siteStore.maxListNum; b++) {

                            async.parallel({
                                name: function (callback) {
                                    driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtProName')).getText()
                                        //find name and store into result
                                        .then(providerName => {
                                            return callback(null, providerName.toString())
                                        }, function (err) {
                                            console.log('Name not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                        })
                                },
                                address: function (callback) {
                                    driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtAddressVal')).getText()
                                        //find address and store into result
                                        .then(providerAddress => {
                                            return callback(null, providerAddress.toString())
                                        }, function (err) {
                                            console.log('Address not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                        })
                                },
                                city: function (callback) {
                                    driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtCityVal')).getText()
                                        //find city and store into result
                                        .then(providerCity => {
                                            return callback(null, providerCity.toString())
                                        }, function (err) {
                                            console.log('City not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                        })
                                },
                                state: function (callback) {
                                    driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtStateVal')).getText()
                                        //find state and store into result
                                        .then(providerState => {
                                            return callback(null, providerState.toString())
                                        }, function (err) {
                                            console.log('State not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                        })
                                },
                                zip: function (callback) {
                                    driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtZipVal')).getText()
                                        //find zip and store into result
                                        .then(providerZip => {
                                            return callback(null, providerZip.toString())
                                        }, function (err) {
                                            console.log('Zip not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                        })
                                },
                                phone: function (callback) {
                                    driver.findElement(By.id('content:FindProvider:dTblProviders_' + b + ':otxtPhoneVal')).getText()
                                        //find phone number and store into result
                                        .then(providerPhoneNum => {
                                            return callback(null, providerPhoneNum.toString())
                                        }, function (err) {
                                            console.log('Phone number not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + b);
                                        })
                                }
                            }, function (err, result) {

                                //iniate save to our mongodb collection Addresses
                                var entry = new Addresses(result);

                                entry.save(function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(doc);
                                    }
                                });
                            })
                        }
                        //cancel function timer if max page result filter number is met
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
                    clearTimer: function () {
                        clearInterval(siteStore.grabData);
                        //driver.quit();
                    },
                    createInterval: function () {
                        setInterval(siteStore.grabData, 1000);
                    }
                }
                //call data store function per seven seconds
                siteStore.createInterval();
            });
        }, 5000) // eleven seconds after address results page
}, 4000) // three seconds for intial page to load
//	})

app.listen(3000, function () {
    console.log('App running on port 3000!');
});