'use strict';

var mongoose = require('mongoose');
var Clients = require('./clients');

var propertySchema = new mongoose.Schema({
  aptNum: {type: Number, required: true, min: 1, max: 300},
  imageUrl:{type: String, required: true},
  vacancy: {type: String, required: true, default: 'Vacancy', enum: ['Vacancy', 'No Vacancy']},
  price: {type: Number, required: true},
  bedroom: {type: Number, required: true, min:1},
  bathroom: {type: Number, required: true, min: 1},
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clients' }]
});


propertySchema.statics.addTenant = function(propId, clientId, cb) {
  Property.findById(propId, (err1, prop) => {
    Clients.findById(clientId, (err2, client) => {
      if(err1 || err2) return cb(err1 || err2);
      var clientLivesAtProp = prop.tenants.indexOf(client._id) !== -1;
      if(clientLivesAtProp) {
        return cb({error: "They already live there"})
      };

      if(prop.tenants.length > prop.bedroom * 2){
        return cb({error: "Too many people live here!"})
      };
      if(client.apt.length !== []) {
        Property.removeTenant(client.apt[0], client._id, err => {
          if(err) return cb(err);
        })
      }
      client.apt = [];
      client.apt.push(prop._id);
      prop.tenants.push(client._id);
      prop.vacancy = 'No Vacancy';
      prop.save(err1 => {
        client.save(err2 => {
          cb(err1 || err2, client);
        })
      })
    })
  })
}

propertySchema.statics.removeTenant = function(propId, clientId, cb){
  Property.findById(propId, (err, prop) => {
    if(err) return cb(err);
    prop.tenants = prop.tenants.filter(tenantId => {
      return tenantId.toString() != clientId
    })

    if(!prop.tenants){
      prop.vacancy = "Vacancy";
    }
    prop.save(err => {
      cb(err);
    });
  });
};

var Property = mongoose.model('Property', propertySchema);

module.exports = Property;