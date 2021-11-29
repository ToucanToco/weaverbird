/**
 * On import of CSV files, data may not have the correct type (like Dates).
 * On import of JSON files, as mongoimport does not support the table schema format, data must be de-nested and cast.
 */

db.sales.find().forEach(function(d) {
  db.sales.update({_id: d._id}, {
    $set: {
      Transaction_date: new Date(d.Transaction_date),
      Account_Created: new Date(d.Account_Created),
      Last_Login: new Date(d.Last_Login),
    }
  })
});

const sin20192022TableSchema = db['sin-from-2019-to-2022'].find()[0];
db['sin-from-2019-to-2022'].insert(sin20192022TableSchema.data);
db['sin-from-2019-to-2022'].remove({_id: sin20192022TableSchema._id});
db['sin-from-2019-to-2022'].find().forEach(function(d) {
  db['sin-from-2019-to-2022'].update({_id: d._id}, {
    $set: {
      day: new Date(d.day),
    }
  })
});


const november2021HoursTableSchema = db['november-2021-hours'].find()[0];
db['november-2021-hours'].insert(november2021HoursTableSchema.data);
db['november-2021-hours'].remove({_id: november2021HoursTableSchema._id});
db['november-2021-hours'].find().forEach(function(d) {
  db['november-2021-hours'].update({_id: d._id}, {
    $set: {
      date: new Date(d.date),
    }
  })
});
