'use strict';

angular.module('tetApp')
  .value('mockINDEX', [{
    label:'Group 1',
    name:'File 1',
    filename:'file1.txt.gz',
    source:'http://www.foo.com/file1.txt.gz',
    date:'1/15/2013'
  },
  {
    label:'Group 1',
    name:'File 1',
    filename:'file2.txt.gz',
    source:'http://www.foo.com/file2.txt.gz',
    date:'1/16/2013'
  },
  {
    label:'Group 2',
    name:'File 3',
    filename:'file3.txt.gz',
    source:'http://www.foo.com/file3.txt.gz',
    date:'1/15/2013'
  }])
  .value('mockHEADER', '00Annotation\tcounts.Adipocyte%20-%20breast%2c%20donor1.CNhs11051.11376-118A8')
  .value('mockTSV', 'name\tvalue\nname1\tvalue1\nname2\tvalue2');
