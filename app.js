const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const knex = require('knex')({
	client: 'pg',
	connection: {
	host : '127.0.0.1',
    user : 'postgres',
    password : '85208520',
    database : 'face-detection-data'
  	}
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {

	res.json("It\'s working");

});

app.get('/user/:id', (req, res) => {

	const id = req.params.id;
	knex.select('*').from('users')
	.where({
		id
	}).then(response => {
	
		response.length
		? res.json(response[0])
		: res.status('400').json('failed');
	
	});

});

app.post('/register', (req, res) => {
	
	const { name, email, password } = req.body;
	const hash = bcrypt.hashSync(password, 10);
	if(name && email && password) {
		knex.transaction(trx => {

			return trx.insert({
				email,
				hash
			}).into('login').then(response => {

				return trx.insert({
					name,
					email,
					joined: new Date()
				})
				.into('users').returning('*')
				.then(response => res.json(response[0]));
			
			}).then(trx.commit).catch(trx.rollback);

		}).catch(error => res.status(400).json(error));

	} else {

		res.status(400).json('failed');

	}

});

app.post('/signin', (req, res) => {

	const { email, password } = req.body;
	knex.select('*').from('login').where({
		email
	}).then(login => {

		if(login.length) {
			
			const hash = login[0].hash;
			const isValid = bcrypt.compareSync(password, hash);
			if (isValid) {
				
				return knex.select('*').from('users').where({
					email
				}).then(user => {
					res.json(user[0]);
				}).catch(error => res.status('400').json('error'))
			
			} else {
				
				res.status('400').json('failed');
			
			}
	
		} else {

			res.status('400').json('failed');

		}

	}).catch(error => res.json(error));

});

app.put('/image', (req, res) => {

	const id = req.body.id;
	knex('users')
	.where({
		id
	}).increment('entries', 1).returning('entries')
	.then(response => {
		response.length ? res.json(response[0]) : res.status('400').json('failed');
	})
	.catch(error => res.status(400).json('error'))

});

app.listen(process.env.PORT || 3000, () => console.log('App is running'));