const http = require('http');

const data = JSON.stringify({
  input: {
    name: "Teste",
    email: "teste@email.com",
    password: "123456"
  }
});

console.log('Enviando requisição para http://localhost:3000/api/trpc/auth.registerEmail');
console.log('Dados:', data);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/trpc/auth.registerEmail',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  console.log('Status Code:', res.statusCode);
  
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    console.log('Resposta:', responseData);
    try {
      const parsed = JSON.parse(responseData);
      console.log('Sucesso:', parsed);
    } catch(e) {
      console.log('Erro ao parsear:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error);
});

req.write(data);
req.end();
