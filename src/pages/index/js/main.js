var Firebird = require('node-firebird');
var FuzzySearch = require('fuzzy-search');
var alunosList = undefined;
var dbPool = undefined;
var searcher = undefined;

function initializeDB(unidade) {
    /// TODO: get fullpath from user
    let options = {
        database: `D:\\Documents\\GitHub\\TechnosLegacy\\src\\data\\${unidade}.FDB`,
        user: 'SYSDBA',
        password: 'masterkey'
    }
    
    dbPool = Firebird.pool(5, options);
    
    /*
    dbPool.get(function (err, db) {
        if(err) throw err;
        
        
    });
    */
    // pool.destroy();
}

function getAllAlunosFromDatabse(unidade) {    
    return new Promise(function (resolve, reject) {
        dbPool.get(function (err, db) {
            if(err) throw err;
            
            // db = DATABASE
            db.query('SELECT r.ID, r.NOME FROM ALUNO r', function(err, result) {
                if(err) throw err;
                
                resolve(result);
                
                // IMPORTANT: release the pool connection
                db.detach();
            });
        });
    });
}

(async function ($) {
    "use strict";
    
    /// initializing list
    let options = {
        valueNames: [ 'ID', 'NOME' ]
    };
    alunosList = new List('alunosTable', options);
    alunosList.remove('ID', '0');
    alunosList.add([{ID: 0, NOME: 'Sem resultados'}]);
    
    /// initialize db
    let firebirdDB = initializeDB('CENTRO');
    
    /// populate it
    let allAlunos = await getAllAlunosFromDatabse('Centro');
    console.log(allAlunos);
    
    /// initialize fuzzy search
    searcher = new FuzzySearch(allAlunos, ['NOME'], {
        caseSensitive: false,
        sort: true
    });    
})(jQuery);

function onSearchChanged(newText) {
    console.log(newText);

    /// if less than 3 chars, don't search
    if(newText.length < 3) return;

    /// get results that match
    let result = searcher.search(newText);
    console.log(result);
    
    /// clear table list
    alunosList.clear();

    /// if no results
    if(!result.length) {
        /// show no results on table
        result = [{ID: 0, NOME: 'Sem resultados'}]
    }

    /// add objects to table
    alunosList.add(result);
}