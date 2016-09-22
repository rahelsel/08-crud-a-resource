(function(module) {
  function Article (opts) {
    // NOTE: this converts previous constructor to Functional Programming style.
    Object.keys(opts).forEach(function(prop) {
      this[prop] = opts[prop];
    }, this); // The optional 'this' here is necessary to keep context.
  }

  Article.prototype.toHtml = function(scriptTemplateId) {
    var template = Handlebars.compile(scriptTemplateId.text());
    this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);
    this.publishStatus = this.publishedOn ? 'published ' + this.daysAgo + ' days ago' : '(draft)';
    this.body = marked(this.body);
    return template(this);
  };

  // Set up a DB table for articles.
  Article.createTable = function() {
    webDB.execute(
      'CREATE TABLE articles('+
      ' title VARCHAR, '+
      ' category VARCHAR,'+
      ' author VARCHAR,'+
      ' authorUrl VARCHAR,'+
      ' publishedOn VARCHAR,'+
      ' body VARCHAR);', // DONE: What SQL command do we run here inside these quotes?
      function() {
        console.log('Successfully set up the articles table.');
      }
    );
  };

  // NOTE: Refactor to expect the data from the database, rather than localStorage.
  Article.loadAll = function(rows) {
    Article.allArticles = rows.map(function(ele) {
      return new Article(ele);
    });
  };

  Article.prototype.insertRecord = function() {
    webDB.execute(
      [{
        // NOTE: insertRecord should be called elsewhere after we retrieve our JSON
        'sql': 'INSERT INTO articles (title, category, author, authorUrl, publishedOn, body) VALUES(?, ?, ?, ?, ?, ?)', // <----- DONE: complete our SQL query here, inside the quotes.
        'data': [this.title, this.category, this.author, this.authorUrl, this.publishedOn, this.body]
      }]
    );
  };

  Article.fetchAll = function(nextFunction) {
    webDB.execute(
      'SELECT * FROM articles', // <-----DONE: fill these quotes to query our table.
      function(rows) {
        if (rows.length) {
        /* DONE:
           1 - Use Article.loadAll to instanitate these rows,
           2 - Pass control to the view by invoking the next function that
                was passed in to Article.fetchAll */
          Article.loadAll(rows);
          nextFunction();
        } else {
          $.getJSON('/data/hackerIpsum.json', function(responseData) {
            responseData.forEach(function(obj) {
              var article = new Article(obj); // This will instantiate an article instance based on each article object from our JSON.
              /* DONE:
               1 - 'insert' the newly-instantiated article in the DB:
             */
              article.insertRecord();
            });
            // Now get ALL the records out of the database:
            webDB.execute(
              'SELECT * FROM articles', // <-----DONE: query our table
              function(rows) {
                // DONE:
                // 1 - Use Article.loadAll to process our rows,
                // 2 - Pass control to the view by calling the next function that was passed in to Article.fetchAll
                Article.loadAll(rows);
                nextFunction();
              });
          });
        }
      });
  };

  Article.prototype.deleteRecord = function() {
    webDB.execute(
      [{
        /* NOTE: this is an advanced admin option, so you will need to test
          out an individual article in the console */
        'sql': '', // <---TODO: Delete an article instance from the database based on its id:
        'data': [this.id]
      }]
    );
  };

  Article.clearTable = function() {
    webDB.execute(
      '' // <----TODO: delete all records from the articles table.
    );
  };

  Article.allAuthors = function() {
    return Article.allArticles.map(function(article) {
      return article.author;
    })
    .reduce(function(uniqueNames, name) {
      if (uniqueNames.indexOf(name) === -1) {
        uniqueNames.push(name);
      }
      return uniqueNames;
    }, []);
  };

  Article.numWordsAll = function() {
    return Article.allArticles.map(function(article) {
      return article.body.match(/\w+/g).length;
    })
    .reduce(function(a, b) {
      return a + b;
    });
  };

  Article.numWordsByAuthor = function() {
    return Article.allAuthors().map(function(currentAuthor) {
      return {
        name: currentAuthor,
        numWords: Article.allArticles.filter(function(article) {
          return article.author === currentAuthor;
        })
        .map(function(currentAuthorsArticle) {
          return currentAuthorsArticle.body.match(/\w+/g).length;
        })
        .reduce(function(previousWords, currentWords) {
          return previousWords + currentWords;
        })
      };
    });
  };

// TODO: ensure that our table has been setup.

  module.Article = Article;
})(window);
