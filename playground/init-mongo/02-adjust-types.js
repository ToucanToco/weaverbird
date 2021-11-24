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

const tableSchema = db['sin-from-2019-to-2022'].find()[0];
db['sin-from-2019-to-2022'].insert(tableSchema.data);
db['sin-from-2019-to-2022'].remove({_id: tableSchema._id});
db['sin-from-2019-to-2022'].find().forEach(function(d) {
  db['sin-from-2019-to-2022'].update({_id: d._id}, {
    $set: {
      day: new Date(d.day),
    }
  })
});
