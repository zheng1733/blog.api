'use strict';

const summary = require('./articles/summary');
const express = require('express');
const router = express.Router();
const log = require('../common/log');
const Result = require('../common/ResponseModel');
const EMPTY = new Result().empty();
const ERROR = new Result().error();
const Article = require('../model/article');
const PAGE_SIZE = 50;
const TIME_OUT = 15*1000; // db action time out

router.all('*', function (req, res, next) {
  // body...
  
	if (!res.header('Access-Control-Allow-Origin')) {   
	  res.header('Access-Control-Allow-Origin', '*');
	}

	if (!res.header('Access-Control-Allow-Headers')) {
	  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	}

  // res.header('Content-Type', 'application/json');
  next();
});

router.get('/', function (req, res, next) {
  const onlySummary = req.query.onlySummary || 1;

  log.d(`onlySummary ${onlySummary}, request ${JSON.stringify(req.query)}`);

  Article.find()
    .limit(PAGE_SIZE)
    .sort({
      createdAt: -1
    })
    .exec((error, data) => {
      if (!error) {
        let articles;

        if (onlySummary == 1 || onlySummary == true) {
          articles = data.map(item => {
            item.content = summary.toSummary(item.content);
            return item;
          });

          log.d('onlySummary true');
        } else {
          articles = data;
          log.d('onlySummary false');
        }

        res.json(new Result(Result.OK, req.query, articles));
      } else {
        res.json(new Result(Result.FAIL, error));
      }
    });
});

router.get('/:id', function (req, res, next) {
  log.d(req.params);
  const id = req.params['id'];
  Article.findById(id)
    .exec((error, data) => {
      if (!error) {
        let item = data;
        res.json(new Result(Result.OK, req.params, item));
      } else {
        res.json(ERROR.setMsg(error));
        log.e(res);
      }
    });
});

router.post('/', (req, res, next) => {
  log.d('post to articles: \n body: \n' + req.body);

  const article = {
    atitle: req.body['title'],
    author: req.body['author'],
    content: req.body['content']
  };

  Article.create(article, (error, data) => {
    if (error) {
      res.json(ERROR.setMsg(error));
    } else {
      let item = data; // TODO: filter output field
      res.json(new Result(Result.OK, req.body, item));
    }
  });
});

router.post('/:id', (req, res) => {
  log.d('update post: ' + JSON.stringify(req.body));

  const update = req.body;
  const id = req.params.id;
  const options = {
    select: 'title content tags comments',
    maxTimeMS: TIME_OUT
  };

  // Article.findByIdAndUpdate(id, update, options, error => {
  //   if (error) {
  //     res.json(ERROR.setMsg(error));
  //   } else {
  //     res.json(new Result(Result.OK, req.body, req.params));
  //   }
  // });

  updateById(id, update, options, req, res);
});

router.delete('/:id', (req, res) => {

});

function updateById(id, update, options, req, res) {
  Article.findByIdAndUpdate(id, {
    $set: update
  }, options, error => {
    if (error) {
      res.json(ERROR.setMsg(error));
    } else {
      res.json(new Result(Result.OK, req.body, req.params));
    }
  });
}


module.exports = router;
