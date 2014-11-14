# Introduction

The FANTOM5 project collected more than one thousand human and mouse samples and, using single molecule sequencing, experimentally defined 184,827 human and 116,277 mouse TSS regions (or CAGE peaks) and quantified their expression using CAGE (Forrest et al., 2014).  The raw tag counts under the CAGE peaks were used to generate expression tables across the entire collection. Normalized tags per million (TPM) were then calculated using the RLE method implemented in edgeR.

The FANTOM5 expression data is primarily distributed in compressed tab-separated-value (TSV) file format.  For each set of samples (human and mouse) there are separate expression tables for raw count, log10 normalized, and RLE normalized expression data.  Each file consists of the full set of CAGE peaks (184,827 rows in human and 116,277 rows in mouse) and expression values over samples (975 columns in human and 399 columns in mouse).  Each compressed file exceeds 23 Mb approaching 500 Mb in some cases and over 1 Gb uncompressed.

These expression files are publicly available on the [FANTOM website](http://fantom.gsc.riken.jp/5/).  However, in order to extract a subset of expression values, even for a small set of peaks or samples, it is necessary to download the entire large file, decompress, then using complicated bash commands or R scripts extract the relevant columns and rows.  In order to assist in this process we have created the FANTOM5 Table Extract Tool (TET).  TET is intended to to be a simplified way of extracting relevant sections from a curated set of FANTOM5 data tables.

Using TET a user will select one of the FANTOM5 data sets (includes phase 1, phase 1+2, and lncRNAome), select the columns they wish to extract (i.e. samples), then specify a set of rows (i.e. cage peaks) using a regular expression search pattern, and finally view or download the resulting subset.

# Using the TET website

An instance of TET including FANTOM5 data is available here: [TET](http://fantom.gsc.riken.jp/5/tet/)

1. Select a dataset/file from the FANTOM5 data.
2. Select specific columns of the dataset you wish to extract
    * The list of columns will be populated based on the dataset/file selection.
    * Select columns from the drop-down list or by typing a column name (it will auto-complete for fast retrieval of the desired column(s)).
    * The order of columns selected does not matter. The returned columns order will match that of the source file.
3. Enter search term(s) for retrieving specific rows from the source table.
  * Leave blank to retrieve all the rows. *(warning: result may be a large file)*
  * Search will be accross all columns by default; including columns not selected in step two.
  * Search terms are based on partial string matching (e.g. the first column of expression dataset corresponds to the CAGE cluster ids, typing `chr1` in the search term box will retrieve all the CAGE clusters on chromosome 1, chromosome 10 or chromosome 11 and  `chr1:` will match all clusters on chromosome 1).
  * Regular expressions are allowed (e.g. `chr[1-3]:` will return peaks on chr1, chr2, and chr3).
      ^ (Caret)       =  match expression at the start of a line, as in ^A.
      \ (Back Slash)  =  turn off the special meaning of the next character, as in \+.
      [ ] (Brackets)  =  match any one of the enclosed characters, as in [aeiou].
                         Use Hyphen "-" for a range, as in [0-9].
      [^ ]            =  match any one character except those enclosed in [ ], as in [^0-9].
      . (Period)      =  match a single character of any value, except end of line.
      * (Asterisk)    =  match zero or more of the preceding character or expression.
      + (Plus)        =  matches one or more of the preceding character or expression.
  * Because regular expressions are allowed; periods ( `.` ) and plus sign ( `+` ), which are commonly used in CAGE cluster ids, carry a special meaning and must be protected by a backslash ( `\` ) (e.g.  `chr10.*,\+` returns all chromosome 10 clusters on the plus strand).
  * You can search within a specific column by providing a regular expression such as `^([^\t]*\t){n}` where `n` is the zero based column index you want to perform the search into. e.g. `^([^\t]*\t){2}chr10` will search for chr10 in column 2 (the third column in the source file).
  * Multiple search terms may be added as one search term per line or delimited by white spaces or pipes ( `|` ) (note this creates am OR search, AND are implemented using regular expressions) (e.g. `chr1: chr2:` will return peaks on chromosomes 1 and 2).
5. Visualizations
  * Table view will show the query results in a paged table view.
  * Visualizations are limited to 200 rows at a time.
4. View or download the tab delimited table for your extracted rows and columns. *(results may take several seconds for large datasets)*
  * Click 'View Table' to view tab-delimited table within your browser.
  * Click 'Download Table' to download tab-delimited table as a file.

# Technical for developers

The FANTOM5 table extraction tool consists of two parts.  A backend node.js server with a custom API used to extract relevant subsection of the curated text files and a GUI front end for easily constructing a API query built using AngularJS.

## Backend API

The API is accessed using the following URL pattern.

    {server URL}/search?filename={filename}&search={query string as regular expression}

Rows within the specified file that match the regular expression and the file headerline will be returned.  Specific columns can be extracted by adding `&column={column number}` for each column to extract.  Additionally, the results can be paged using the following:

    head={max number of rows to return}&skip={number of columns to skip}

For example the following URL will return the first 10 rows from example.tsv.gz:

    {server URL}/search?filename=example.tsv.gz&head=10

The following URL will return columns 0,10, and 20 from all rows that contain the string "chr10" (and the file header).

    {server URL}/search?filename=example.tsv.gz&columns=0&columns=10&columns=20&search=chr10

# For developers

## Background

To install a copy of TET you will need [node.js](http://nodejs.org/), npm, Grunt, and Bower. If you are not familiar it would be worthwhile to read up on [node and npm](http://www.joyent.com/blog/installing-node-and-npm/), [Grunt](https://github.com/gruntjs/grunt/wiki/Getting-started) and [bower](http://bower.io/).

## Installation

    git clone https://github.com/Hypercubed/TET.git
    cd TET
    npm install
    bower install

## Directory Layout

    app/                --> all of the files to be used in development
      bower_components/    --> AngularJS and 3rd party JavaScript libraries installed using bower
      scripts/             --> JavaScript files
      styles/              --> CSS files
      views/               --> html views
    data/               --> data files (tsv and gz).
    lib/                --> TET express application
      controllers/        --> Express server controllers
      server.js           --> Express server
    test/               --> test source files and libraries
    package.json        --> npm's config file
    bower.json          --> bower's config file
    Gruntfile.js        --> Grunt config file
    config.json         --> TET config file
    README.md           --> This file

## Adding data

This git repository doesn't include the data files.  You will need to download the FANTOM5 data from the FANTOM server or add your own into the `data/` folder.  All data files should be Tab-Seperated-Value (TSV) files or gzipped TSV files (ending with `.gz`).  Any rows that begin with `##` or `0[1-9]` are ignored.  The first row that is not ignored is considered the file header.

You will also need to create a `index.tsv` in with the following header followed by one row per file.

    label{tab}name{tab}filename{tab}source{tab}date{newline}

## Grunt

Grunt is a JavaScript based task runner.  In this project Grunt is used for many tasks including testing, minification, and even deployment.  If you are not familiar with Grunt please read the [Getting started guide](https://github.com/gruntjs/grunt/wiki/Getting-started).

Grunt tasks:

             clean  Clean files and folders.
              test  Run all tests
       test:chrome  Run frontend tests in chrome browser
        test:mocha  Run backend tests
             build  Prepare project for deployment.
             serve  Run a test server

## Running the app during development

Running `grunt serve` will run a test server on the local host and open your default web browser to `http://localhost:<port>/`.

## Running the app during production

Depending on your needs this process may very.  Running `grunt build` will create a `public` directory.  This folder along with `*.json` config files, the `lib` folder, and the `data` folder should be copied to the production server.  The `test` folder is optional.

Directory layout on the production server:

    public/                --> all of the files to be used in development
      scripts/             --> JavaScript files
      styles/              --> CSS files
      views/               --> html views
    data/               --> data files (tsv and gz).
    lib/                --> TET express application
    package.json        --> npm's config file
    Gruntfile.js        --> Grunt config file
    config.json         --> TET config file
    README.md           --> This file

Run `npm install --production` to install production node dependencies.

Running `NODE_ENV=production node server.js` or `NODE_ENV=production forever server.js` will run a production server.

## Testing

Running `grunt test:chrome` will run the unit tests in chrome using karma.  `grunt test:mocha` will run the server API tests using mocha.

# Contact

For more information please contact [J. Harshbarger](jayson@gsc.riken.jp)

## Acknowledgments
This work was supported by a research grant from the Japanese Ministry of Education, Culture, Sports, Science and Technology (MEXT) to the RIKEN Center for Life Science Technologies.

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

Copyright (c) 2014 RIKEN, Japan.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
