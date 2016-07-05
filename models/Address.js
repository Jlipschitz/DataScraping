var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressesSchema = new Schema({
  name: {
    type:String,
    required: true
  },
  address: {
    type:String,
    required:true
  },
  city: {
    type:String,
    required:true
  },
  state: {
    type:String,
    required:true
  },
  zipCode: {
    type: String,
    require:true
  },
  phone: {
    type:String,
    required: false
  }
});

var Addresses = mongoose.model('Addresses', AddressesSchema);
module.exports = Addresses;
