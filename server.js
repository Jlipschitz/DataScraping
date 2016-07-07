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

db.on('error', (err) => {
    console.log('Mongoose Error: ', err);
});
db.once('open', () => {
    console.log('Mongoose connection successful.');
});

//Require Schemas
var Addresses = require('./models/Address.js');;

// Routes
app.get('/', (req, res) => {
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
//driver.get('localhost:3000');

//app.get('/selenium', function(req, res) {

//grab initial elements and fill out criteria
driver.get('https://www.e-nva.com/nva/content/tourist/JSFPEntryTouristPage.jsf');

//fill out form criteria to tailor our search
driver.findElement(By.name('content:FindProvider:strProviderZipCode')).sendKeys('10018');
driver.findElement(By.css('.mainContent > option:nth-child(1)')).click();
driver.findElement(By.css('.plansDropDown > option:nth-child(2)')).click();
driver.findElement(By.id('content:FindProvider:btnFindProviderSearch1')).click();

//wait until we are past the loading screen
driver.wait(() => {
    return driver.findElement(By.id('content:FindProvider:dTblProviders')).isDisplayed()
}, 200000, 'failed to load after 200 seconds').then(
    saveInfo = () => {

        var siteStore = {

            //set nums to help handle different pages
            indexes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            pageNum: 1,
            grabData: () => {
                //store addresses found

                async.forEach(siteStore.indexes, (index, eachCallback) => {
                    async.parallel({
                        name: (parralelCallBack) => {
                            driver.findElement(By.id('content:FindProvider:dTblProviders_' + index + ':otxtProName')).getText()
                                //find name and store into result
                                .then(providerName => {
                                    return parralelCallBack(null, providerName.toString())
                                }, (err) => {
                                    console.log('Name not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + index);
                                })
                        },
                        address: (parralelCallBack) => {
                            driver.findElement(By.id('content:FindProvider:dTblProviders_' + index + ':otxtAddressVal')).getText()
                                //find address and store into result
                                .then(providerAddress => {
                                    return parralelCallBack(null, providerAddress.toString())
                                }, (err) => {
                                    console.log('Address not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + index);
                                })
                        },
                        city: (parralelCallBack) => {
                            driver.findElement(By.id('content:FindProvider:dTblProviders_' + index + ':otxtCityVal')).getText()
                                //find city and store into result
                                .then(providerCity => {
                                    return parralelCallBack(null, providerCity.toString())
                                }, (err) => {
                                    console.log('City not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + index);
                                })
                        },
                        state: (parralelCallBack) => {
                            driver.findElement(By.id('content:FindProvider:dTblProviders_' + index + ':otxtStateVal')).getText()
                                //find state and store into result
                                .then(providerState => {
                                    return parralelCallBack(null, providerState.toString())
                                }, (err) => {
                                    console.log('State not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + index);
                                })
                        },
                        zip: (parralelCallBack) => {
                            driver.findElement(By.id('content:FindProvider:dTblProviders_' + index + ':otxtZipVal')).getText()
                                //find zip and store into result
                                .then(providerZip => {
                                    return parralelCallBack(null, providerZip.toString())
                                }, (err) => {
                                    console.log('Zip not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + index);
                                })
                        },
                        phone: (parralelCallBack) => {
                            driver.findElement(By.id('content:FindProvider:dTblProviders_' + index + ':otxtPhoneVal')).getText()
                                //find phone number and store into result
                                .then(providerPhoneNum => {
                                    return parralelCallBack(null, providerPhoneNum.toString())
                                }, (err) => {
                                    console.log('Phone number not found ' + 'pagenumber:' + siteStore.pageNum + ' listNumber:' + index);
                                })
                        }
                    }, (err, result) => {

                        //iniate save to our mongodb collection Addresses
                        var entry = new Addresses(result);

                        entry.save((err, doc) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(doc);
                            }
                        });
                    })
                    //set our incrementers to coincide with the page that's called next
                    siteStore.pageNum++;
                    siteStore.indexes.map(item => item += 10)

                    //go to the next page to display more data
                    driver.findElement(By.id('content:FindProvider:dataScrolleridx' + siteStore.pageNum)).click();
                    console.log('entry is being hit');

                }, (err, asyncEachCallback) => {
                    
                    if(err) return console.log(err)

                    return asyncEachCallback();
                    
                });

            },
            //clear data storing function interval
            clearTimer: () => {
                clearInterval(siteStore.grabData);
                //driver.quit();
            },
            createInterval: () => {
                setInterval(siteStore.grabData, 1000);
            }
        }
        //call data store function per seven seconds
        siteStore.createInterval();
    });
//	})

app.listen(3000, () => {
    console.log('App running on port 3000!');
});