const { Pool, Client } = require('pg');
require('dotenv').config();

// FOR REAL LIFE HEROKU DEPLOYMENT
const client = new Client({
  user: 'tjqjhjzzjtindk',
  host: 'ec2-107-20-193-202.compute-1.amazonaws.com',
  database: 'd8siqm30rho7tc',
  password: '784f35e06e48d45062f3ab4fb83511caca68de81182c2cba1d27b7bd3d7e463e',
  ssl: true
});

// FOR LOCAL DATABASE TESTING
// const client = new Client({
//   user: 'dillonlin',
//   host: 'localhost',
//   database: 'coinspace',
//   password: '',
//   ssl: false,
// });

client.connect();

client.query(` CREATE TABLE IF NOT EXISTS users ()
  id serial NOT NULL PRIMARY KEY,
  email varchar(50) NOT NULL,
  password text NOT NULL
  )`);

client.query(`CREATE TABLE IF NOT EXISTS coin (
  id int NOT NULL PRIMARY KEY,
  name varchar(50) NOT NULL
)`);

const coins = ['Bitcoin', 'Ethereum', 'Litecoin', 'Ripple'];

coins.forEach((coin, index) => {
  client.query(`insert into coin (id, name) values (${index + 1}, '${coin}')`, (err, res) => {
    if (err) {
      console.log(`${coin} Insertion Error`, err);
    }
    console.log(`${coin} Insertion Success`);
  });
});

client.query(`CREATE TABLE IF NOT EXISTS price_history (
  id serial PRIMARY KEY,
  coin_id int NOT NULL,
  time_stamp varchar(50) NOT NULL,
  price decimal NOT NULL
)`);

const data = [require('./BTCUSDHistoricalData.js'), require('./ETHUSDHistoricalData.js'), require('./LTCUSDHistoricalData.js'), require('./XRPUSDHistoricalData.js')];

data.forEach((history, index) => {
  history.forEach((dateObj) => {
    let date = dateObj.Date;
    let coinId = index + 1;
    let price = dateObj.Open;
    client.query(`insert into price_history (coin_id, time_stamp, price) values (${coinId}, '${date} 12', ${price})`, (err, res) => {
      if (err) {
        console.log('Insertion Error', err);
      }
      console.log(coinId, price, 'Daily Data Insertion Success');
    });
  });
});
