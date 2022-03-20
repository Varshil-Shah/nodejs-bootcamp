const fs = require('fs');
const http = require('http');
const { default: slugify } = require('slugify');
const url = require('url');

const replaceTemplate = require('./modules/replaceTemplate');

// FILES -

// BLOCKING CODE - SYNCHRONOUS CODE

const textIn = fs.readFileSync('txt/input.txt', 'utf-8');
console.log(textIn);
const textOut = `This messages is added by NodeJS.\nCreated on ${Date.now()}`;
fs.writeFileSync('txt/output.txt', textOut);
console.log('File written!');

// NON-BLOCKING CODE - ASYNCHRONOUS CODE

fs.readFile('txt/start.txt', 'utf-8', (_, data1) => {
  fs.readFile(`txt/${data1}.txt`, 'utf-8', (_, data2) => {
    console.log(data2);
    fs.readFile('txt/append.txt', 'utf-8', (_, data3) => {
      console.log(data3);

      fs.writeFile('txt/final.txt', `${data2}\n${data3}`, 'utf-8', (_) => {
        console.log('You file has been written!');
      });
    });
  });
});
console.log('Will read file?');

const templateOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const templateCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);
const templateProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

const slugs = dataObj.map((product) =>
  slugify(product.productName, { lower: true })
);
console.log(slugs);

// HTTP -
const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);

  // Overview page -
  if (pathname === '/overview' || pathname === '/') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });

    const cardsHtml = dataObj
      .map((card) => {
        card.pathName = convertNameToPathName(card.productName);
        return replaceTemplate(templateCard, card);
      })
      .join('');
    const result = templateOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
    res.end(result);

    // Product page -
  } else if (pathname.startsWith('/product')) {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });

    console.log(pathname, pathname.substring('/product/'.length));
    const productName = convertPathNameToName(
      pathname.substring('/product/'.length)
    );

    const product = dataObj.find((card) => card.productName === productName);

    const output = replaceTemplate(templateProduct, product);
    res.end(output);

    // API -
  } else if (pathname === '/api') {
    res.writeHead(200, {
      'Content-type': 'application/json',
    });
    res.end(data);

    // Page not found -
  } else {
    res.writeHead(404, {
      'Content-type': 'text/html',
      'some-dummy-data': 'page-not-found',
    });
    res.end('<h1>Page not found :(</h1>');
  }
});

server.listen(3000, () => {
  console.log('Listening on port 3000');
});

const convertPathNameToName = (path) => {
  return path
    .split('-')
    .map((word) => word[0].toUpperCase() + word.substring(1))
    .join(' ');
};

const convertNameToPathName = (path) => {
  return path
    .split(' ')
    .map((word) => word.toLowerCase())
    .join('-');
};