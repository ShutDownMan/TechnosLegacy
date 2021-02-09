var Firebird = require('node-firebird');
var FuzzySearch = require('fuzzy-search');
const { ipcRenderer } = require('electron');
var mainList = undefined;
var dbPool = undefined;
var searcher = undefined;
var column1 = undefined;
var column2 = undefined;
var currentPage = undefined;

function initializeDB(unidade) {
	/// TODO: get fullpath from user
	let options = {
		database: `D:\\Documents\\GitHub\\TechnosLegacy\\src\\data\\${unidade}.FDB`,
		user: 'SYSDBA',
		password: 'masterkey'
		// win1252
	}
	
	dbPool = Firebird.pool(5, options);
	
	/*
	dbPool.get(function (err, db) {
		if(err) throw err;
		
		
	});
	*/
	// pool.destroy();
}

function initializeList() {
	column1 = document.querySelector('#table_column1');
	column2 = document.querySelector('#table_column2');
	currentPage = document.querySelector('#current_page')
	
	column1.innerHTML = "ID";
	column2.innerHTML = "Nome";
	currentPage.innerHTML = "Home";
	
	column1.setAttribute('data-sort', 'column1');
	column2.setAttribute('data-sort', 'column2');
	
	let options = {
		valueNames: [ 'column1', 'column2' ]
	};
	mainList = new List('mainList', options);
	mainList.remove('column1', '0');
	mainList.add([{column1: -1, column2: 'Sem resultados'}]);
}

function getAllAlunosFromDatabse(unidade) {    
	return new Promise(function (resolve, reject) {
		dbPool.get(function (err, db) {
			if(err) throw err;
			
			// db = DATABASE
			db.query('SELECT r.ID_ALUNO, r.NOME FROM ALUNOS r', function(err, result) {
				if(err) throw err;
				
				result = result.map(function(currentValue, index, arr) {
					return {column1: currentValue.ID_ALUNO, column2: currentValue.NOME};
				});
				
				resolve(result);
				
				// IMPORTANT: release the pool connection
				db.detach();
			});
		});
	});
}

function getAlunoByID(idAluno) {
	return new Promise(function (resolve, reject) {
		dbPool.get(function (err, db) {
			if(err) throw err;
			
			db.query(`SELECT * FROM ALUNOS r WHERE r.ID_ALUNO = ?`, [parseInt(idAluno)], function(err, result) {
				if(err) throw err;
				
				/*
				result = result.map(function(currentValue, index, arr) {
					return {column1: currentValue.ID_ALUNO, column2: currentValue.NOME};
				});
				*/
				
				resolve(result);
				
				db.detach();
			});
		});
	});
}

function getDescricao(value) {
	return new Promise(function (resolve, reject) {
		// first row
		value.DESCRICAO(function(err, name, e) {
			let buffers = [];
			console.log(name);
			
			if (err) {
				reject();
				throw err;
			}
			
			// e === EventEmitter
			e.on('data', function(chunk) {
				// console.log(chunk);
				buffers.push(chunk);
			});
			
			e.on('end', function() {
				// console.log(buffers);
				let buffer = buffers.toString('binary');
				// console.log(buffer);
				resolve(buffer);
			})
			
		});
	});
}

function getFollowUpsByIDAluno(idAluno) {
	return new Promise(function (resolve, reject) {
		dbPool.get(function (err, db) {
			if(err) throw err;
			
			db.query(`SELECT r.DATA_CONTATO, CAST(r.DESCRICAO as BLOB SUB_TYPE 0) as DESCRICAO FROM FOLLOW_UP r WHERE r.ID_ALUNO = ?`, [parseInt(idAluno)],
			async function(err, result, e) {
				if(err) throw err;
				
				result = result.map(async function(currentValue, index, arr) {
					// console.log(currentValue.DATA_CONTATO);
					// console.log(await getDescricao(currentValue));
					return {column1: currentValue.DATA_CONTATO, column2: await getDescricao(currentValue)};
				});
				
				resolve(Promise.all(result));
				
				db.detach();
			});
		});
	}); 
}

function getNotasByIDAluno(idAluno) {
	return new Promise(function (resolve, reject) {
		dbPool.get(function (err, db) {
			if(err) throw err;
			
			db.query(`SELECT r.DATA, r.PRESENCA' FROM PRESENCA r WHERE r.ID_ALUNO = ?`, [parseInt(idAluno)],
			async function(err, result, e) {
				if(err) throw err;
				
				result = result.map(function(currentValue, index, arr) {
					return {column1: currentValue.DATA, column2: currentValue.PRESENCA};
				});
				
				resolve(result);
				
				db.detach();
			});
		});
	}); 
}

function getPresencasByIDAluno(idAluno) {
	return new Promise(function (resolve, reject) {
		dbPool.get(function (err, db) {
			if(err) throw err;
			
			db.query(`SELECT r.DATA, r.PRESENCA, r.COMPUTADOR, r.LABORATORIO FROM PRESENCA r WHERE r.ID_ALUNO = ?`, [parseInt(idAluno)],
			async function(err, result, e) {
				if(err) throw err;
				
				console.log(result);
				
				result = result.map(function(currentValue, index, arr) {
					let column2Str = `(${currentValue.LABORATORIO} @ ${currentValue.COMPUTADOR}) - ${currentValue.PRESENCA}`;
					if(!currentValue.LABORATORIO) {
						if(!currentValue.COMPUTADOR) {	
							column2Str = `${currentValue.PRESENCA}`;
						} else {
							column2Str = `(${currentValue.COMPUTADOR}) ${currentValue.PRESENCA}`;
						}
					} else if(!currentValue.COMPUTADOR) {
						column2Str = `(${currentValue.LABORATORIO}) ${currentValue.PRESENCA}`;
					}
					return {column1: currentValue.DATA, column2: column2Str};
				});
				
				resolve(result);
				
				db.detach();
			});
		});
	}); 
}

(async function ($) {
	"use strict";
	
	/// initializing list
	initializeList();
	
	/// initialize db
	let firebirdDB = initializeDB('CENTRO');
	
	/// populate it
	let allAlunos = await getAllAlunosFromDatabse('Centro');
	console.log(allAlunos);
	
	/// initialize fuzzy search
	searcher = new FuzzySearch(allAlunos, ['column2'], {
		caseSensitive: false,
		sort: true
	});    
})(jQuery);

function onSearchChanged(newText) {
	console.log(newText);
	
	currentPage.innerHTML = "Home";
	
	/// if less than 3 chars, don't search
	if(newText.length < 4) return;
	
	column1.innerHTML = "ID";
	column2.innerHTML = "Nome";
	
	/// get results that match
	let result = searcher.search(newText);
	console.log(result);
	
	/// clear table list
	mainList.clear();
	
	/// if no results
	if(!result.length) {
		/// show no results on table
		result = [{ID: 0, NOME: 'Sem resultados'}]
	}
	
	/// add objects to table
	mainList.add(result);
}

var CurrentIDAluno = undefined;
var CurrentNomeAluno = undefined;
var CurrentAlunoInfo = undefined;

async function onClickAluno(idAluno, nomeAluno) {
	// console.log(idAluno);
	// console.log(nomeAluno);
	
	/// se menu atual não for home
	if(currentPage.innerHTML !== "Home") {
		return;
	}
	
	CurrentIDAluno = idAluno;
	CurrentNomeAluno = nomeAluno;
	CurrentAlunoInfo = await getAlunoByID(idAluno);
	
	// console.log("Info Aluno");
	// console.log(CurrentAlunoInfo);
	
	let navbarAlunoNameElem = document.querySelector("#navbar-aluno-name");
	
	if(navbarAlunoNameElem) {
		navbarAlunoNameElem.innerHTML = nomeAluno;
	}
}

function onClickPerfilAluno() {
	ipcRenderer.send('get-aluno-profile-page', CurrentIDAluno);
}

async function onClickFollowUpsAluno() {
	let followUps = await getFollowUpsByIDAluno(CurrentIDAluno);
	
	currentPage.innerHTML = 'Follow Ups';
	
	console.log("FOLLOW UPS:");
	console.log(followUps);
	
	column1.innerHTML = "Data";
	column2.innerHTML = "Descrição";
	
	mainList.clear();
	if(!followUps.length) {	
		mainList.add([{column1: -1, column2: 'Sem resultados'}]);
	}
	
	mainList.add(followUps);
}

async function onClickPresencasAluno() {
	let presencas = await getPresencasByIDAluno(CurrentIDAluno);
	
	currentPage.innerHTML = 'Presenças';
	
	console.log("Presenças:");
	console.log(presencas);
	
	column1.innerHTML = "Data";
	column2.innerHTML = "Comparecimento";	
	
	mainList.clear();
	if(!presencas.length) {	
		mainList.add([{column1: -1, column2: 'Sem resultados'}]);
	}
	
	mainList.add(presencas);
}

async function onClickModulosAluno() {
	let notas = await getModulosByIDAluno(CurrentIDAluno);
	
	currentPage.innerHTML = 'Notas';
	
	console.log("Notas:");
	console.log(notas);
	
	column1.innerHTML = "Média";
	column2.innerHTML = "Módulos";
	
	mainList.clear();
	if(!notas.length) {	
		mainList.add([{column1: -1, column2: 'Sem resultados'}]);
	}
	
	mainList.add(notas);
}