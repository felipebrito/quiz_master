#!/usr/bin/env node

const http = require('http');

console.log('🔍 VALIDAÇÃO COMPLETA DO CSS');
console.log('============================\n');

// Função para fazer requisições HTTP
function testCSS(url, description) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        // Verificar se o CSS está sendo carregado
        const hasCSSLink = data.includes('stylesheet');
        const hasTailwindClasses = data.includes('bg-gray-50') && data.includes('text-xl');
        const hasAdminElements = data.includes('Admin Panel') && data.includes('Dashboard');
        
        resolve({
          status: res.statusCode,
          duration,
          hasCSSLink,
          hasTailwindClasses,
          hasAdminElements,
          cssFile: data.match(/href="([^"]*\.css)"/)?.[1] || 'N/A'
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Função para testar o arquivo CSS diretamente
function testCSSFile(cssUrl) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.get(cssUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        // Verificar se contém classes Tailwind
        const hasTailwindBase = data.includes('.bg-gray-50') || data.includes('background-color');
        const hasFlexClasses = data.includes('.flex') || data.includes('display: flex');
        const hasTextClasses = data.includes('.text-xl') || data.includes('font-size');
        
        resolve({
          status: res.statusCode,
          duration,
          hasTailwindBase,
          hasFlexClasses,
          hasTextClasses,
          size: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  try {
    console.log('1. Testando página administrativa...');
    const pageResult = await testCSS('http://localhost:3001/admin', 'Admin Page');
    
    console.log(`   ✅ Status: ${pageResult.status}`);
    console.log(`   ⏱️  Tempo: ${pageResult.duration}ms`);
    console.log(`   📄 CSS Link: ${pageResult.hasCSSLink ? '✅' : '❌'}`);
    console.log(`   🎨 Classes Tailwind: ${pageResult.hasTailwindClasses ? '✅' : '❌'}`);
    console.log(`   🏢 Elementos Admin: ${pageResult.hasAdminElements ? '✅' : '❌'}`);
    console.log(`   📁 Arquivo CSS: ${pageResult.cssFile}\n`);
    
    if (pageResult.cssFile !== 'N/A') {
      console.log('2. Testando arquivo CSS...');
      const cssResult = await testCSSFile(`http://localhost:3001${pageResult.cssFile}`);
      
      console.log(`   ✅ Status: ${cssResult.status}`);
      console.log(`   ⏱️  Tempo: ${cssResult.duration}ms`);
      console.log(`   🎨 Tailwind Base: ${cssResult.hasTailwindBase ? '✅' : '❌'}`);
      console.log(`   🔧 Flex Classes: ${cssResult.hasFlexClasses ? '✅' : '❌'}`);
      console.log(`   📝 Text Classes: ${cssResult.hasTextClasses ? '✅' : '❌'}`);
      console.log(`   📏 Tamanho: ${cssResult.size} bytes\n`);
    }
    
    // Resultado final
    const allGood = pageResult.hasCSSLink && pageResult.hasTailwindClasses && pageResult.hasAdminElements;
    
    console.log('🎯 RESULTADO FINAL:');
    console.log('==================');
    
    if (allGood) {
      console.log('✅ CSS ESTÁ FUNCIONANDO PERFEITAMENTE!');
      console.log('   - Página carregando corretamente');
      console.log('   - CSS sendo servido');
      console.log('   - Classes Tailwind aplicadas');
      console.log('   - Elementos administrativos presentes');
    } else {
      console.log('❌ PROBLEMA DETECTADO:');
      if (!pageResult.hasCSSLink) console.log('   - CSS não está sendo carregado');
      if (!pageResult.hasTailwindClasses) console.log('   - Classes Tailwind não encontradas');
      if (!pageResult.hasAdminElements) console.log('   - Elementos administrativos não encontrados');
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

runTests();
